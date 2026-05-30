import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, getUserId } from "../middleware/auth";
import { getSpotPricePerGram } from "../lib/goldPrice";
import { z } from "zod";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const recurringRouter = Router();

const recurringSchema = z.object({
  amountUsd: z.number().positive().min(10),
  frequency: z.enum(["weekly", "monthly"]),
});

// GET /api/recurring — get user's active plan
recurringRouter.get("/", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { data, error } = await supabase
      .from("recurring_investments")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/recurring — create or replace a plan
recurringRouter.post("/", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { amountUsd, frequency } = recurringSchema.parse(req.body);

    // Deactivate any existing active plan
    await supabase
      .from("recurring_investments")
      .update({ active: false })
      .eq("user_id", userId)
      .eq("active", true);

    const now = new Date();
    const nextRun = new Date(now);
    if (frequency === "weekly") {
      nextRun.setDate(now.getDate() + 7);
    } else {
      nextRun.setMonth(now.getMonth() + 1);
    }

    const { data, error } = await supabase
      .from("recurring_investments")
      .insert({
        user_id: userId,
        amount_usd: amountUsd,
        frequency,
        next_run_at: nextRun.toISOString(),
        active: true,
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/recurring/:id — cancel a plan
recurringRouter.delete("/:id", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { error } = await supabase
      .from("recurring_investments")
      .update({ active: false })
      .eq("id", req.params.id)
      .eq("user_id", userId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Background runner — called from index.ts on an interval ──
export async function runRecurringInvestments() {
  try {
    const now = new Date().toISOString();

    const { data: plans, error } = await supabase
      .from("recurring_investments")
      .select("*")
      .eq("active", true)
      .lte("next_run_at", now);

    if (error || !plans?.length) return;

    for (const plan of plans) {
      try {
        // Check wallet balance
        const { data: wallet } = await supabase
          .from("wallets")
          .select("balance_usd")
          .eq("user_id", plan.user_id)
          .single();

        const balance = parseFloat(wallet?.balance_usd ?? "0");
        const amount = parseFloat(plan.amount_usd);

        if (balance < amount) {
          console.log(`Skipping recurring for ${plan.user_id} — insufficient funds`);
          // Still advance next_run_at so we don't retry every minute
        } else {
          const spotPrice = getSpotPricePerGram();
          const gramsAcquired = amount / spotPrice;

          // Record the investment
          await supabase.from("investments").insert({
            user_id: plan.user_id,
            amount_usd: amount.toFixed(2),
            grams_acquired: gramsAcquired.toFixed(6),
            spot_price_at_purchase: spotPrice.toFixed(4),
          });

          // Deduct from wallet
          const newBalance = balance - amount;
          await supabase
            .from("wallets")
            .update({ balance_usd: newBalance.toFixed(2) })
            .eq("user_id", plan.user_id);

          console.log(`Recurring investment executed: $${amount} for user ${plan.user_id}`);
        }

        // Advance next_run_at
        const next = new Date();
        if (plan.frequency === "weekly") {
          next.setDate(next.getDate() + 7);
        } else {
          next.setMonth(next.getMonth() + 1);
        }

        await supabase
          .from("recurring_investments")
          .update({ next_run_at: next.toISOString() })
          .eq("id", plan.id);

      } catch (planErr) {
        console.error(`Recurring investment error for plan ${plan.id}:`, planErr);
      }
    }
  } catch (err) {
    console.error("runRecurringInvestments error:", err);
  }
}
