import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, getUserId, getUserEmail } from "../middleware/auth";
import { getSpotPricePerGram } from "../lib/goldPrice";
import { sendPriceAlertEmail } from "../lib/email";
import { z } from "zod";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const priceAlertsRouter = Router();

const alertSchema = z.object({
  targetPricePerOz: z.number().positive().min(100),
  direction: z.enum(["above", "below"]),
});

priceAlertsRouter.get("/", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { data, error } = await supabase
      .from("price_alerts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

priceAlertsRouter.post("/", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    const email = getUserEmail(req);
    const { targetPricePerOz, direction } = alertSchema.parse(req.body);
    const { data, error } = await supabase
      .from("price_alerts")
      .insert({
        user_id: userId,
        email,
        target_price_per_oz: targetPricePerOz,
        direction,
        triggered: false,
      })
      .select()
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

priceAlertsRouter.delete("/:id", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { error } = await supabase
      .from("price_alerts")
      .delete()
      .eq("id", req.params.id)
      .eq("user_id", userId);
    if (error) throw error;
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const OZ_PER_GRAM = 31.1035;

export async function checkPriceAlerts() {
  try {
    const spotPerGram = getSpotPricePerGram();
    const spotPerOz = spotPerGram * OZ_PER_GRAM;

    const { data: alerts, error } = await supabase
      .from("price_alerts")
      .select("*")
      .eq("triggered", false);

    if (error || !alerts?.length) return;

    for (const alert of alerts) {
      const target = parseFloat(alert.target_price_per_oz);
      const shouldTrigger =
        (alert.direction === "above" && spotPerOz >= target) ||
        (alert.direction === "below" && spotPerOz <= target);

      if (!shouldTrigger) continue;

      await supabase
        .from("price_alerts")
        .update({ triggered: true, triggered_at: new Date().toISOString() })
        .eq("id", alert.id);

      // Store in-app notification
      await supabase.from("price_alert_notifications").insert({
        user_id: alert.user_id,
        alert_id: alert.id,
        message: `Gold has ${alert.direction === "above" ? "risen above" : "fallen below"} your target of $${target.toLocaleString()}/oz. Current price: $${spotPerOz.toFixed(2)}/oz.`,
        read: false,
      }).catch(() => {});

      // Send real email
      if (alert.email) {
        try {
          await sendPriceAlertEmail({
            customerEmail: alert.email,
            targetPricePerOz: target,
            currentPricePerOz: spotPerOz,
            direction: alert.direction,
          });
        } catch (emailErr) {
          console.error("Price alert email failed:", emailErr);
        }
      }
    }
  } catch (err) {
    console.error("Price alert check error:", err);
  }
}
