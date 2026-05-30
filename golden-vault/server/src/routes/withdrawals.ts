import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, getUserId } from "../middleware/auth";
import { sendWithdrawalReceivedEmail } from "../lib/email";
import { z } from "zod";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const withdrawalsRouter = Router();

const createWithdrawalSchema = z.object({
  amountUsd: z.number().positive().min(10),
  cryptoAddress: z.string().min(10),
  network: z.string().min(1),
  currency: z.string().min(1),
});

withdrawalsRouter.post("/", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { amountUsd, cryptoAddress, network, currency } = createWithdrawalSchema.parse(req.body);

    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance_usd")
      .eq("user_id", userId)
      .single();

    const balance = parseFloat(wallet?.balance_usd ?? "0");
    if (amountUsd > balance) {
      res.status(400).json({ error: "Insufficient balance" }); return;
    }

    const { data, error } = await supabase
      .from("withdrawal_requests")
      .insert({
        user_id: userId,
        amount_usd: amountUsd,
        crypto_address: cryptoAddress,
        network,
        currency,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    // Send withdrawal received email (best-effort)
    try {
      const { data: userRecord } = await supabase.auth.admin.getUserById(userId);
      const userEmail = userRecord?.user?.email;
      const userName = userRecord?.user?.user_metadata?.full_name || "Investor";
      if (userEmail) {
        await sendWithdrawalReceivedEmail({
          customerEmail: userEmail,
          customerName: userName,
          amountUsd,
          currency,
          network,
          cryptoAddress,
        });
      }
    } catch (emailErr) {
      console.error("Withdrawal email failed (request still created):", emailErr);
    }

    res.json({ success: true, withdrawal: data });
  } catch (err: any) {
    console.error("Withdrawal error:", err);
    res.status(500).json({ error: err.message });
  }
});

withdrawalsRouter.get("/", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { data, error } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

withdrawalsRouter.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      res.status(400).json({ error: "Status must be approved or rejected" }); return;
    }
    const { data, error } = await supabase
      .from("withdrawal_requests")
      .update({
        status,
        admin_note: adminNote ?? null,
        processed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, withdrawal: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
