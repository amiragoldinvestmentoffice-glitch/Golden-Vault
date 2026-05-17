import { Router } from "express";
import { getSpotPricePerGram, getSpotPricePerOz } from "../lib/goldPrice";

export const priceRouter = Router();

priceRouter.get("/", (_req, res) => {
  res.json({
    perGram: getSpotPricePerGram(),
    perOz: getSpotPricePerOz(),
    currency: "USD",
    updatedAt: new Date().toISOString(),
  });
});
