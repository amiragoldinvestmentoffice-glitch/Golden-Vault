import { Router } from "express";

const router = Router();

router.get("/api/gold-price", async (_req, res) => {
  try {
    const response = await fetch("https://metals.live/api/spot");
    if (!response.ok) throw new Error("upstream error");
    const data = await response.json();
    const raw = Array.isArray(data) ? data[0] : data;
    res.json({
      gold: raw.gold ?? 0,
      silver: raw.silver ?? 0,
      platinum: raw.platinum ?? 0,
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch gold price" });
  }
});

export default router;
