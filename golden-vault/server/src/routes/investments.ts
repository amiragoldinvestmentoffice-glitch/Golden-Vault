import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, getUserId } from "../middleware/auth";
import { getSpotPricePerGram, generatePriceHistory } from "../lib/goldPrice";
import { z } from "zod";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const investmentsRouter = Router();
investmentsRouter.use(requireAuth);

investmentsRouter.get("/", async (req, res) => {
  const userId = getUserId(req);
  const { data: rows, error } = await supabase
    .from("investments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  const spotPrice = getSpotPricePerGram();
  const totalGrams = rows.reduce((s, r) => s + parseFloat(r.grams_acquired), 0);
  const totalInvested = rows.reduce((s, r) => s + parseFloat(r.amount_usd), 0);
  const currentValue = totalGrams * spotPrice;
  const gainLoss = currentValue - totalInvested;
  const gainLossPct = totalInvested > 0 ? (gainLoss / totalInvested) * 100 : 0;
  res.json({
    investments: rows,
    summary: {
      totalGrams: parseFloat(totalGrams.toFixed(6)),
      totalInvested: parseFloat(totalInvested.toFixed(2)),
      currentValue: parseFloat(currentValue.toFixed(2)),
      gainLoss: parseFloat(gainLoss.toFixed(2)),
      gainLossPct: parseFloat(gainLossPct.toFixed(2)),
      spotPricePerGram: spotPrice,
    },
  });
});

investmentsRouter.get("/price-history", (_req, res) => {
  res.json(generatePriceHistory(30));
});

const investSchema = z.object({
  amountUsd: z.number().positive().min(10),
});

investmentsRouter.post("/", async (req, res) => {
  const userId = getUserId(req);
  const { amountUsd } = investSchema.parse(req.body);
  const spotPrice = getSpotPricePerGram();
  const gramsAcquired = amountUsd / spotPrice;

  const { data, error } = await supabase
    .from("investments")
    .insert({
      user_id: userId,
      amount_usd: amountUsd.toFixed(2),
      grams_acquired: gramsAcquired.toFixed(6),
      spot_price_at_purchase: spotPrice.toFixed(4),
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.status(201).json(data);
});
