import { Router } from "express";

const router = Router();

// ── In-memory cache ──────────────────────────────────────────────────────────
let cachedPrice: { gold: number; silver: number; platinum: number } | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours — metals.dev free plan has generous limits

// ── Fetch from metals.dev ────────────────────────────────────────────────────
async function fetchFromMetalsDev(): Promise<{ gold: number; silver: number; platinum: number }> {
  const apiKey = process.env.METALS_DEV_API_KEY;
  if (!apiKey) throw new Error("METALS_DEV_API_KEY not set");

  const response = await fetch(
    `https://api.metals.dev/v1/latest?api_key=${apiKey}&currency=USD&unit=toz`,
    { headers: { Accept: "application/json" } }
  );

  if (!response.ok) throw new Error(`metals.dev returned ${response.status}`);

  const data = await response.json();

  // metals.dev response: { metals: { gold: 3300.xx, silver: 32.xx, platinum: 980.xx } }
  const metals = data.metals ?? data;
  return {
    gold: metals.gold ?? metals.XAU ?? 0,
    silver: metals.silver ?? metals.XAG ?? 0,
    platinum: metals.platinum ?? metals.XPT ?? 0,
  };
}

// ── Fetch from GoldAPI (fallback) ────────────────────────────────────────────
async function fetchFromGoldApi(): Promise<{ gold: number; silver: number; platinum: number }> {
  const apiKey = process.env.GOLD_API_KEY;
  if (!apiKey) throw new Error("GOLD_API_KEY not set");

  const [goldRes, silverRes] = await Promise.all([
    fetch("https://www.goldapi.io/api/XAU/USD", {
      headers: { "x-access-token": apiKey, Accept: "application/json" },
    }),
    fetch("https://www.goldapi.io/api/XAG/USD", {
      headers: { "x-access-token": apiKey, Accept: "application/json" },
    }),
  ]);

  if (!goldRes.ok) throw new Error(`GoldAPI returned ${goldRes.status}`);

  const goldData = await goldRes.json();
  const silverData = silverRes.ok ? await silverRes.json() : { price: 0 };

  return {
    gold: goldData.price ?? 0,
    silver: silverData.price ?? 0,
    platinum: 0,
  };
}

// ── metals.live (no-key fallback) ────────────────────────────────────────────
async function fetchFromMetalsLive(): Promise<{ gold: number; silver: number; platinum: number }> {
  const response = await fetch("https://metals.live/api/spot", {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`metals.live returned ${response.status}`);
  const data = await response.json();
  const raw = Array.isArray(data) ? data[0] : data;
  return {
    gold: raw.gold ?? 0,
    silver: raw.silver ?? 0,
    platinum: raw.platinum ?? 0,
  };
}

// ── Main fetch with fallback chain ───────────────────────────────────────────
async function fetchLivePrice(): Promise<{ gold: number; silver: number; platinum: number }> {
  // 1. Try metals.dev (primary — generous free tier, real-time)
  if (process.env.METALS_DEV_API_KEY) {
    try {
      const price = await fetchFromMetalsDev();
      console.log("[Price] metals.dev ✅", price.gold);
      return price;
    } catch (err) {
      console.warn("[Price] metals.dev failed:", err);
    }
  }

  // 2. Try GoldAPI (secondary — existing key)
  if (process.env.GOLD_API_KEY) {
    try {
      const price = await fetchFromGoldApi();
      console.log("[Price] GoldAPI ✅", price.gold);
      return price;
    } catch (err) {
      console.warn("[Price] GoldAPI failed:", err);
    }
  }

  // 3. Try metals.live (no key required)
  try {
    const price = await fetchFromMetalsLive();
    console.log("[Price] metals.live ✅", price.gold);
    return price;
  } catch (err) {
    console.warn("[Price] metals.live failed:", err);
  }

  throw new Error("All price sources failed");
}

// ── Route ────────────────────────────────────────────────────────────────────
router.get("/api/gold-price", async (_req, res) => {
  const now = Date.now();

  // Return cached price if still fresh
  if (cachedPrice && now - lastFetchTime < CACHE_TTL_MS) {
    return res.json({ ...cachedPrice, cached: true });
  }

  try {
    const price = await fetchLivePrice();
    cachedPrice = price;
    lastFetchTime = now;
    return res.json({ ...price, cached: false });
  } catch (err) {
    console.error("[Price] All sources failed:", err);

    // Return stale cache rather than an error if we have it
    if (cachedPrice) {
      console.warn("[Price] Returning stale cache");
      return res.json({ ...cachedPrice, cached: true, stale: true });
    }

    return res.status(500).json({ error: "Failed to fetch gold price" });
  }
});

export default router;
