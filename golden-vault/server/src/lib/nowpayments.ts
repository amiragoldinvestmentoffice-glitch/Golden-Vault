// server/src/lib/nowpayments.ts
import crypto from "crypto";

const API_KEY = process.env.NOWPAYMENTS_API_KEY!;
const IPN_SECRET = process.env.NOWPAYMENTS_IPN_SECRET!;
const BASE_URL = "https://api.nowpayments.io/v1";

// Create a payment invoice for a user deposit
export async function createCryptoPayment({
  amountUsd,
  userId,
  payCurrency = "USDTTRC20", // default to USDT TRC20
}: {
  amountUsd: number;
  userId: string;
  payCurrency?: string;
}) {
  const response = await fetch(`${BASE_URL}/payment`, {
    method: "POST",
    headers: {
      "x-api-key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      price_amount: amountUsd,
      price_currency: "usd",
      pay_currency: payCurrency,
      order_id: `deposit_${userId}_${Date.now()}`,
      order_description: `Golden Vault deposit for user ${userId}`,
      ipn_callback_url: `${process.env.API_URL}/api/payments/webhook`,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`NOWPayments error: ${err}`);
  }

  return response.json();
}

// Get available currencies from NOWPayments
export async function getAvailableCurrencies() {
  const response = await fetch(`${BASE_URL}/currencies`, {
    headers: { "x-api-key": API_KEY },
  });
  return response.json();
}

// Get payment status by payment ID
export async function getPaymentStatus(paymentId: string) {
  const response = await fetch(`${BASE_URL}/payment/${paymentId}`, {
    headers: { "x-api-key": API_KEY },
  });
  return response.json();
}

// Verify IPN webhook signature from NOWPayments
export function verifyIpnSignature(
  payload: object,
  receivedSig: string
): boolean {
  // NOWPayments signs with sorted keys
  const sorted = sortObject(payload);
  const str = JSON.stringify(sorted);
  const hmac = crypto
    .createHmac("sha512", IPN_SECRET)
    .update(str)
    .digest("hex");
  return hmac === receivedSig;
}

// Helper: sort object keys recursively (required by NOWPayments IPN)
function sortObject(obj: any): any {
  if (typeof obj !== "object" || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sortObject);
  return Object.keys(obj)
    .sort()
    .reduce((acc: any, key) => {
      acc[key] = sortObject(obj[key]);
      return acc;
    }, {});
}
