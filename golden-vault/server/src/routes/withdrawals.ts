import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, getUserId } from "../middleware/auth";
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

// ─────────────────────────────────────────────
// POST /api/withdrawals
// User submits a withdrawal request
// ─────────────────────────────────────────────
withdrawalsRouter.post("/", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { amountUsd, cryptoAddress, network, currency } = createWithdrawalSchema.parse(req.body);

    // Check wallet balance
    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance_usd")
      .eq("user_id", userId)
      .single();

    const balance = parseFloat(wallet?.balance_usd ?? "0");
    if (amountUsd > balance) {
      res.status(400).json({ error: "Insufficient balance" });
      return;
    }

    // Insert withdrawal request
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

    res.json({ success: true, withdrawal: data });
  } catch (err: any) {
    console.error("Withdrawal error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/withdrawals
// User fetches their own withdrawal history
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// PATCH /api/withdrawals/:id  (Admin only)
// Approve or reject a withdrawal
// ─────────────────────────────────────────────
withdrawalsRouter.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      res.status(400).json({ error: "Status must be approved or rejected" });
      return;
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
