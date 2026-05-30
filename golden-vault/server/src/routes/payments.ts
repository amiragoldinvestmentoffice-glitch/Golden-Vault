// server/src/routes/payments.ts
import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, getUserId } from "../middleware/auth";
import { createCryptoPayment, verifyIpnSignature, getPaymentStatus } from "../lib/nowpayments";
import { buyBtcWithUsdt, getBtcPrice } from "../lib/bitget";
import { z } from "zod";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const paymentsRouter = Router();

// ─────────────────────────────────────────────
// POST /api/payments/create
// Creates a NOWPayments invoice for a deposit
// ─────────────────────────────────────────────
const createPaymentSchema = z.object({
  amountUsd: z.number().positive().min(10),
  payCurrency: z.string().default("USDTTRC20"),
});

paymentsRouter.post("/create", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { amountUsd, payCurrency } = createPaymentSchema.parse(req.body);

    // Create payment with NOWPayments
    const payment = await createCryptoPayment({ amountUsd, userId, payCurrency });

    // Store pending payment in Supabase so we can track it
    await supabase.from("crypto_payments").insert({
      user_id: userId,
      nowpayments_id: payment.payment_id,
      amount_usd: amountUsd,
      pay_currency: payCurrency,
      pay_address: payment.pay_address,
      pay_amount: payment.pay_amount,
      status: "waiting",
    });

    res.json({
      paymentId: payment.payment_id,
      payAddress: payment.pay_address,
      payAmount: payment.pay_amount,
      payCurrency: payment.pay_currency,
      expiresAt: payment.expiration_estimate_date,
    });
  } catch (err: any) {
    console.error("Create payment error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/payments/status/:paymentId
// Check status of a payment
// ─────────────────────────────────────────────
paymentsRouter.get("/status/:paymentId", requireAuth, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const status = await getPaymentStatus(paymentId);
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/payments/webhook
// NOWPayments IPN webhook — fires when payment confirmed
// ─────────────────────────────────────────────
paymentsRouter.post(
  "/webhook",
  express.raw({ type: "application/json" }), // raw body for signature check
  async (req, res) => {
    try {
      const signature = req.headers["x-nowpayments-sig"] as string;

      // Parse body
      const payload =
        typeof req.body === "string"
          ? JSON.parse(req.body)
          : req.body;

      // Verify IPN signature
      if (!verifyIpnSignature(payload, signature)) {
        console.warn("Invalid IPN signature — possible spoofed webhook");
        res.status(401).json({ error: "Invalid signature" });
        return;
      }

      const {
        payment_id,
        payment_status,
        price_amount,   // USD amount the user was supposed to pay
        actually_paid,  // actual crypto received
        order_id,       // "deposit_{userId}_{timestamp}"
      } = payload;

      // Only process confirmed/finished payments
      if (payment_status !== "finished" && payment_status !== "confirmed") {
        res.json({ received: true, action: "none", status: payment_status });
        return;
      }

      // Extract userId from order_id
      const userId = order_id?.split("_")[1];
      if (!userId) {
        res.status(400).json({ error: "Cannot extract userId from order_id" });
        return;
      }

      // Check if already processed (idempotency)
      const { data: existing } = await supabase
        .from("crypto_payments")
        .select("id, btc_purchased")
        .eq("nowpayments_id", payment_id)
        .single();

      if (existing?.btc_purchased) {
        res.json({ received: true, action: "already_processed" });
        return;
      }

      // Use the actual USD value paid
      const usdtAmount = parseFloat(price_amount);

      // ── AUTO-BUY BTC ON BITGET ──
      let btcPurchased = 0;
      let bitgetOrderId = "";

      try {
        const result = await buyBtcWithUsdt(usdtAmount);
        btcPurchased = result.btcAmount;
        bitgetOrderId = result.orderId;
        console.log(`✅ Bought ${btcPurchased} BTC for $${usdtAmount} — order ${bitgetOrderId}`);
      } catch (buyErr: any) {
        console.error("Bitget buy error:", buyErr.message);
        // Still record payment even if buy fails — can retry manually
      }

      // ── UPDATE crypto_payments TABLE ──
      await supabase
        .from("crypto_payments")
        .update({
          status: payment_status,
          actually_paid: actually_paid,
          btc_purchased: btcPurchased,
          bitget_order_id: bitgetOrderId,
          processed_at: new Date().toISOString(),
        })
        .eq("nowpayments_id", payment_id);

      // ── ADD TO USER PORTFOLIO (investments table) ──
      if (btcPurchased > 0) {
        const btcPrice = await getBtcPrice();

        await supabase.from("investments").insert({
          user_id: userId,
          amount_usd: usdtAmount.toFixed(2),
          grams_acquired: (btcPurchased * 31.1035).toFixed(6), // convert BTC → troy oz equivalent in grams if needed
          spot_price_at_purchase: btcPrice.toFixed(2),
          payment_method: "crypto",
          nowpayments_id: payment_id,
          btc_amount: btcPurchased.toFixed(8),
        });
      }

      res.json({ received: true, action: "processed", btcPurchased });
    } catch (err: any) {
      console.error("Webhook error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

// ─────────────────────────────────────────────
// GET /api/payments/history
// Get user's payment history
// ─────────────────────────────────────────────
paymentsRouter.get("/history", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);

    const { data, error } = await supabase
      .from("crypto_payments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Need express for raw body middleware in webhook
import express from "express";
