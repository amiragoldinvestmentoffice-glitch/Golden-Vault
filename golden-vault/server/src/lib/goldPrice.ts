// Simulates realistic gold spot price with small variance
// Base: ~$3,300/oz, convert to per-gram
const BASE_PRICE_PER_OZ = 3300;
const GRAMS_PER_OZ = 31.1035;

let currentPrice = BASE_PRICE_PER_OZ / GRAMS_PER_OZ; // ~$106.12/gram

// Drift price every 30s with ±0.3% variance
setInterval(() => {
  const change = currentPrice * (Math.random() * 0.006 - 0.003);
  currentPrice = Math.max(100, Math.min(115, currentPrice + change));
}, 30_000);

export function getSpotPricePerGram(): number {
  return parseFloat(currentPrice.toFixed(4));
}

export function getSpotPricePerOz(): number {
  return parseFloat((currentPrice * GRAMS_PER_OZ).toFixed(2));
}

// Historical 30-day price data for charts (generated once on startup)
export function generatePriceHistory(days = 30): Array<{ date: string; price: number }> {
  const history: Array<{ date: string; price: number }> = [];
  let price = BASE_PRICE_PER_OZ;
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const change = price * (Math.random() * 0.04 - 0.018); // ±2% daily
    price = Math.max(3000, Math.min(3600, price + change));
    history.push({
      date: date.toISOString().split("T")[0],
      price: parseFloat(price.toFixed(2)),
    });
  }
  return history;
}
