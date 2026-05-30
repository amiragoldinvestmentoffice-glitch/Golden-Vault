// Real gold price from GoldAPI.io
// Fetches every 6 hours to stay within 100 req/month free tier
// Between fetches: small ±0.3% variance to keep ticker feeling live

const GRAMS_PER_OZ = 31.1035;
const FALLBACK_PRICE_PER_OZ = 3300;

let currentPricePerOz: number = FALLBACK_PRICE_PER_OZ;
let lastFetchedPricePerOz: number = FALLBACK_PRICE_PER_OZ;
let lastFetchTime: number = 0;

async function fetchRealGoldPrice(): Promise<void> {
  try {
    const res = await fetch("https://www.goldapi.io/api/XAU/USD", {
      headers: {
        "x-access-token": process.env.GOLDAPI_KEY!,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      console.warn(`GoldAPI returned ${res.status} — keeping last known price`);
      return;
    }

    const data = await res.json();
    const price = data?.price;

    if (typeof price === "number" && price > 1000) {
      lastFetchedPricePerOz = price;
      currentPricePerOz = price;
      lastFetchTime = Date.now();
      console.log(`🥇 Gold price updated: $${price.toFixed(2)}/oz`);
    } else {
      console.warn("GoldAPI returned unexpected data:", data);
    }
  } catch (err) {
    console.error("GoldAPI fetch error:", err);
  }
}

// Fetch on startup
fetchRealGoldPrice();

// Fetch every 6 hours
setInterval(fetchRealGoldPrice, 6 * 60 * 60 * 1000);

// Drift every 30s between real fetches to keep ticker feeling live
setInterval(() => {
  const change = currentPricePerOz * (Math.random() * 0.006 - 0.003);
  const min = lastFetchedPricePerOz * 0.995;
  const max = lastFetchedPricePerOz * 1.005;
  currentPricePerOz = Math.max(min, Math.min(max, currentPricePerOz + change));
}, 30_000);

export function getSpotPricePerGram(): number {
  return parseFloat((currentPricePerOz / GRAMS_PER_OZ).toFixed(4));
}

export function getSpotPricePerOz(): number {
  return parseFloat(currentPricePerOz.toFixed(2));
}

export function generatePriceHistory(days = 30): Array<{ date: string; price: number }> {
  const history: Array<{ date: string; price: number }> = [];
  let price = currentPricePerOz;
  const now = new Date();
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const change = price * (Math.random() * 0.04 - 0.018);
    price = Math.max(currentPricePerOz * 0.9, Math.min(currentPricePerOz * 1.1, price + change));
    history.push({
      date: date.toISOString().split("T")[0],
      price: parseFloat(price.toFixed(2)),
    });
  }
  return history;
}
