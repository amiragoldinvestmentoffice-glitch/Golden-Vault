import express, { Router, Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, getUserId } from "../middleware/auth";
import { createCryptoPayment, verifyIpnSignature, getPaymentStatus } from "../lib/nowpayments";
import { buyBtcWithUsdt, getBtcPrice } from "../lib/bitget";
import { sendDepositConfirmedEmail } from "../lib/email";
import { z } from "zod";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const paymentsRouter = Router();

// ── Allowed currencies whitelist ─────────────────────────────────────────────
// Prevents users injecting arbitrary currency strings into the DB
const ALLOWED_CURRENCIES = [
  "USDTTRC20", "USDTERC20", "BTC", "ETH", "USDC", "LTC", "BNB",
] as const;
type AllowedCurrency = typeof ALLOWED_CURRENCIES[number];

// ── Schemas ──────────────────────────────────────────────────────────────────
const createPaymentSchema = z.object({
  amountUsd: z.number().positive().min(10).max(500_000), // cap max to prevent fat-finger orders
  payCurrency: z.enum(ALLOWED_CURRENCIES).default("USDTTRC20"),
});

// ── Idempotency: in-memory lock to prevent double-processing webhooks ─────────
// For multi-instance deploys, replace with a DB-level lock
const processingPayments = new Set<string>();

// ── POST /api/payments/create ────────────────────────────────────────────────
paymentsRouter.post("/create", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    const parsed = createPaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid payment parameters", details: parsed.error.flatten() });
      return;
    }
    const { amountUsd, payCurrency } = parsed.data;

    // Check for existing pending payment to prevent duplicates
    const { data: pending } = await supabase
      .from("crypto_payments")
      .select("id, created_at")
      .eq("user_id", userId)
      .eq("status", "waiting")
      .gte("created_at", new Date(Date.now() - 30 * 60 * 1000).toISOString()) // last 30 min
      .maybeSingle();

    if (pending) {
      res.status(409).json({
        error: "You already have a pending payment. Please complete or wait for it to expire.",
      });
      return;
    }

    const payment = await createCryptoPayment({ amountUsd, userId, payCurrency });

    await supabase.from("crypto_payments").insert({
      user_id: userId,
      nowpayments_id: payment.payment_id,
      amount_usd: amountUsd,
      pay_currency: payCurrency,
      pay_address: payment.pay_address,
      pay_amount: payment.pay_amount,
      status: "waiting",
    });

    // Never expose internal payment_id or raw provider response beyond what UI needs
    res.json({
      paymentId: payment.payment_id,
      payAddress: payment.pay_address,
      payAmount: payment.pay_amount,
      payCurrency: payment.pay_currency,
      expiresAt: payment.expiration_estimate_date,
    });
  } catch (err: any) {
    console.error("[Payments] Create payment error:", err);
    res.status(500).json({ error: "Failed to create payment" }); // never expose err.message
  }
});

// ── GET /api/payments/status/:paymentId ──────────────────────────────────────
paymentsRouter.get("/status/:paymentId", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { paymentId } = req.params;

    // Validate format — NowPayments IDs are numeric strings
    if (!paymentId || !/^\d+$/.test(paymentId)) {
      res.status(400).json({ error: "Invalid payment ID" });
      return;
    }

    // CRITICAL: Verify this payment belongs to the requesting user
    // Original code skipped this — any authenticated user could poll any payment ID
    const { data: record } = await supabase
      .from("crypto_payments")
      .select("id, user_id")
      .eq("nowpayments_id", paymentId)
      .maybeSingle();

    if (!record) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }

    if (record.user_id !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const status = await getPaymentStatus(paymentId);
    res.json(status);
  } catch (err: any) {
    console.error("[Payments] Status check error:", err);
    res.status(500).json({ error: "Failed to fetch payment status" });
  }
});

// ── POST /api/payments/webhook ───────────────────────────────────────────────
// express.raw() is applied in index.ts for /api/payments/webhook before express.json()
paymentsRouter.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    try {
      const signature = req.headers["x-nowpayments-sig"] as string;

      if (!signature) {
        console.warn("[Webhook] Missing signature header");
        res.status(401).json({ error: "Missing signature" });
        return;
      }

      // Parse body safely
      let payload: any;
      try {
        payload = Buffer.isBuffer(req.body)
          ? JSON.parse(req.body.toString())
          : typeof req.body === "string"
          ? JSON.parse(req.body)
          : req.body;
      } catch {
        res.status(400).json({ error: "Invalid JSON payload" });
        return;
      }

      // Verify signature FIRST — before touching any data
      if (!verifyIpnSignature(payload, signature)) {
        console.warn("[Webhook] Invalid IPN signature — possible spoofed request");
        res.status(401).json({ error: "Invalid signature" });
        return;
      }

      const { payment_id, payment_status, price_amount, actually_paid, order_id } = payload;

      // Validate required fields exist
      if (!payment_id || !payment_status || !order_id) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }

      // Only process terminal successful states
      if (payment_status !== "finished" && payment_status !== "confirmed") {
        res.json({ received: true, action: "none", status: payment_status });
        return;
      }

      // Extract and validate userId from order_id
      const userId = order_id?.split("_")[1];
      if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) {
        console.error("[Webhook] Invalid userId in order_id:", order_id);
        res.status(400).json({ error: "Invalid order reference" });
        return;
      }

      // CRITICAL: Idempotency lock — prevents double-processing if NowPayments
      // sends the same webhook twice (they retry on non-200 responses)
      if (processingPayments.has(payment_id)) {
        console.log("[Webhook] Already processing payment:", payment_id);
        res.json({ received: true, action: "processing" });
        return;
      }

      // Check DB-level idempotency
      const { data: existing } = await supabase
        .from("crypto_payments")
        .select("id, btc_purchased, status")
        .eq("nowpayments_id", payment_id)
        .maybeSingle();

      if (!existing) {
        // Payment not in our DB — could be spoofed or from a different env
        console.error("[Webhook] Payment ID not found in DB:", payment_id);
        res.status(404).json({ error: "Payment record not found" });
        return;
      }

      if (existing.btc_purchased) {
        res.json({ received: true, action: "already_processed" });
        return;
      }

      // CRITICAL: Verify the amount matches what we recorded — prevents amount manipulation
      const recordedAmount = parseFloat(existing.amount_usd ?? "0");
      const reportedAmount = parseFloat(price_amount ?? "0");
      const TOLERANCE = 0.01; // 1 cent tolerance for float rounding
      if (Math.abs(recordedAmount - reportedAmount) > TOLERANCE) {
        console.error(
          `[Webhook] Amount mismatch — recorded: $${recordedAmount}, reported: $${reportedAmount}`
        );
        res.status(400).json({ error: "Amount mismatch" });
        return;
      }

      // Acquire lock
      processingPayments.add(payment_id);

      try {
        const usdtAmount = recordedAmount; // use OUR recorded amount, not webhook's

        let btcPurchased = 0;
        let bitgetOrderId = "";

        try {
          const result = await buyBtcWithUsdt(usdtAmount);
          btcPurchased = result.btcAmount;
          bitgetOrderId = result.orderId;
          console.log(`[Webhook] ✅ Bought ${btcPurchased} BTC for $${usdtAmount}`);
        } catch (buyErr: any) {
          console.error("[Webhook] Bitget buy error:", buyErr.message);
          // Continue — record the payment as confirmed even if BTC purchase fails
          // so we can manually reconcile. Don't silently swallow.
        }

        await supabase
          .from("crypto_payments")
          .update({
            status: payment_status,
            actually_paid,
            btc_purchased: btcPurchased || null,
            bitget_order_id: bitgetOrderId || null,
            processed_at: new Date().toISOString(),
          })
          .eq("nowpayments_id", payment_id);

        if (btcPurchased > 0) {
          const btcPrice = await getBtcPrice();
          await supabase.from("investments").insert({
            user_id: userId,
            amount_usd: usdtAmount.toFixed(2),
            grams_acquired: (btcPurchased * 31.1035).toFixed(6),
            spot_price_at_purchase: btcPrice.toFixed(2),
            payment_method: "crypto",
            nowpayments_id: payment_id,
            btc_amount: btcPurchased.toFixed(8),
          });
        }

        // Send confirmation email — best-effort, never block the response
        try {
          const { data: userRecord } = await supabase.auth.admin.getUserById(userId);
          const userEmail = userRecord?.user?.email;
          const userName =
            userRecord?.user?.user_metadata?.full_name || "Investor";
          if (userEmail) {
            await sendDepositConfirmedEmail({
              customerEmail: userEmail,
              customerName: userName,
              amountUsd: usdtAmount,
              currency: payload.pay_currency || "Crypto",
            });
          }
        } catch (emailErr) {
          console.error("[Webhook] Deposit email failed (payment still processed):", emailErr);
        }

        res.json({ received: true, action: "processed" });
        // Never expose btcPurchased in response — leaks trading details
      } finally {
        // Always release the lock
        processingPayments.delete(payment_id);
      }
    } catch (err: any) {
      console.error("[Webhook] Unhandled error:", err);
      // Return 200 to prevent NowPayments from retrying — we'll reconcile manually
      res.json({ received: true, action: "error" });
    }
  }
);

// ── GET /api/payments/history ────────────────────────────────────────────────
paymentsRouter.get("/history", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    const { data, error } = await supabase
      .from("crypto_payments")
      .select(
        // Never select * — exclude internal fields like bitget_order_id, btc_purchased
        "id, created_at, amount_usd, pay_currency, pay_amount, status, processed_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100); // cap result size

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    console.error("[Payments] History error:", err);
    res.status(500).json({ error: "Failed to fetch payment history" });
  }
});
