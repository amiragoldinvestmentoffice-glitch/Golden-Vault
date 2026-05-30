// server/src/lib/bitget.ts
import crypto from "crypto";

const API_KEY = process.env.BITGET_API_KEY!;
const SECRET_KEY = process.env.BITGET_SECRET_KEY!;
const PASSPHRASE = process.env.BITGET_PASSPHRASE!;
const BASE_URL = "https://api.bitget.com";

// Generate Bitget API signature
function signRequest(
  timestamp: string,
  method: string,
  requestPath: string,
  body: string = ""
): string {
  const message = timestamp + method.toUpperCase() + requestPath + body;
  return crypto
    .createHmac("sha256", SECRET_KEY)
    .update(message)
    .digest("base64");
}

// Shared headers for all Bitget API calls
function getHeaders(method: string, path: string, body: string = "") {
  const timestamp = Date.now().toString();
  const sign = signRequest(timestamp, method, path, body);
  return {
    "ACCESS-KEY": API_KEY,
    "ACCESS-SIGN": sign,
    "ACCESS-TIMESTAMP": timestamp,
    "ACCESS-PASSPHRASE": PASSPHRASE,
    "Content-Type": "application/json",
  };
}

// Get current BTC/USDT price from Bitget
export async function getBtcPrice(): Promise<number> {
  const path = "/api/v2/spot/market/tickers?symbol=BTCUSDT";
  const response = await fetch(`${BASE_URL}${path}`);
  const data = await response.json();

  if (data.code !== "00000") {
    throw new Error(`Bitget price error: ${data.msg}`);
  }

  const price = parseFloat(data.data[0].lastPr);
  return price;
}

// Place a market buy order for BTC using USDT amount
export async function buyBtcWithUsdt(usdtAmount: number): Promise<{
  orderId: string;
  btcAmount: number;
  usdtSpent: number;
}> {
  const path = "/api/v2/spot/trade/place-order";
  const body = JSON.stringify({
    symbol: "BTCUSDT",
    side: "buy",
    orderType: "market",
    force: "gtc",
    size: usdtAmount.toFixed(2), // buy with exact USDT amount
    quoteSize: usdtAmount.toFixed(2),
  });

  const headers = getHeaders("POST", path, body);

  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers,
    body,
  });

  const data = await response.json();

  if (data.code !== "00000") {
    throw new Error(`Bitget order error: ${data.msg}`);
  }

  // Get order details to find how much BTC was bought
  const orderId = data.data.orderId;
  const orderDetails = await getOrderDetails(orderId);

  const btcAmount = parseFloat(orderDetails.baseVolume || "0");
  const usdtSpent = parseFloat(orderDetails.quoteVolume || usdtAmount.toString());

  return { orderId, btcAmount, usdtSpent };
}

// Get order details after placing
async function getOrderDetails(orderId: string) {
  const path = `/api/v2/spot/trade/orderInfo?orderId=${orderId}&symbol=BTCUSDT`;
  const headers = getHeaders("GET", path);

  const response = await fetch(`${BASE_URL}${path}`, { headers });
  const data = await response.json();

  if (data.code !== "00000") {
    throw new Error(`Bitget order details error: ${data.msg}`);
  }

  return data.data[0] || {};
}

// Get Bitget account spot balance
export async function getSpotBalance(coin: string = "USDT"): Promise<number> {
  const path = "/api/v2/spot/account/assets";
  const headers = getHeaders("GET", path);

  const response = await fetch(`${BASE_URL}${path}`, { headers });
  const data = await response.json();

  if (data.code !== "00000") {
    throw new Error(`Bitget balance error: ${data.msg}`);
  }

  const asset = data.data.find((a: any) => a.coin === coin);
  return asset ? parseFloat(asset.available) : 0;
}
