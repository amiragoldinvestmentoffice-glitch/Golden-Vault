import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const BRAND = "Amira Al Dahab";

// ── Order Confirmation ────────────────────────────────────────────────────
export async function sendOrderConfirmationEmail(opts: {
  customerEmail: string;
  customerName: string;
  orderId: number;
  items: { name: string; quantity: number; price: number }[];
  total: number;
}) {
  const itemRows = opts.items
    .map(
      (i) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;">${i.name}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;text-align:center;">${i.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #2a2a2a;text-align:right;">$${i.price.toLocaleString()}</td>
        </tr>`
    )
    .join("");

  await resend.emails.send({
    from: `${BRAND} <${FROM}>`,
    to: opts.customerEmail,
    subject: `Order Confirmed — #${opts.orderId} | ${BRAND}`,
    html: goldEmail({
      title: "Order Confirmed 🥇",
      preview: `Your order #${opts.orderId} has been confirmed.`,
      body: `
        <p style="color:#d4b896;font-size:16px;">Hi ${opts.customerName},</p>
        <p style="color:#a89070;">Your gold order has been confirmed and is being prepared for secure shipment.</p>
        <table style="width:100%;border-collapse:collapse;margin:24px 0;background:#1a1a1a;border-radius:8px;overflow:hidden;">
          <thead>
            <tr style="background:#2a1f0a;">
              <th style="padding:10px 12px;text-align:left;color:#d4a017;">Product</th>
              <th style="padding:10px 12px;text-align:center;color:#d4a017;">Qty</th>
              <th style="padding:10px 12px;text-align:right;color:#d4a017;">Price</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
          <tfoot>
            <tr style="background:#2a1f0a;">
              <td colspan="2" style="padding:10px 12px;color:#d4a017;font-weight:bold;">Total</td>
              <td style="padding:10px 12px;color:#d4a017;font-weight:bold;text-align:right;">$${opts.total.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
        <p style="color:#a89070;">Order reference: <strong style="color:#d4b896;">#${opts.orderId}</strong></p>
        <p style="color:#a89070;">You'll receive a shipping update once your order is dispatched. For any questions, reply to this email or chat with us on WhatsApp.</p>
      `,
    }),
  });
}

// ── Deposit Confirmed ─────────────────────────────────────────────────────
export async function sendDepositConfirmedEmail(opts: {
  customerEmail: string;
  customerName: string;
  amountUsd: number;
  currency: string;
}) {
  await resend.emails.send({
    from: `${BRAND} <${FROM}>`,
    to: opts.customerEmail,
    subject: `Deposit Confirmed — $${opts.amountUsd} | ${BRAND}`,
    html: goldEmail({
      title: "Deposit Confirmed ✅",
      preview: `Your deposit of $${opts.amountUsd} has been confirmed.`,
      body: `
        <p style="color:#d4b896;font-size:16px;">Hi ${opts.customerName},</p>
        <p style="color:#a89070;">Great news — your crypto deposit has been confirmed and your wallet has been credited.</p>
        <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:20px;margin:24px 0;text-align:center;">
          <p style="color:#888;margin:0 0 6px;">Amount Deposited</p>
          <p style="color:#d4a017;font-size:28px;font-weight:bold;margin:0;">$${opts.amountUsd.toLocaleString()}</p>
          <p style="color:#666;font-size:13px;margin:6px 0 0;">via ${opts.currency}</p>
        </div>
        <p style="color:#a89070;">Your funds are now available in your Amira Al Dahab wallet. Head to your portfolio to start investing in gold.</p>
      `,
    }),
  });
}

// ── Price Alert Triggered ─────────────────────────────────────────────────
export async function sendPriceAlertEmail(opts: {
  customerEmail: string;
  targetPricePerOz: number;
  currentPricePerOz: number;
  direction: "above" | "below";
}) {
  const directionText = opts.direction === "above" ? "risen above" : "fallen below";
  await resend.emails.send({
    from: `${BRAND} <${FROM}>`,
    to: opts.customerEmail,
    subject: `Gold Price Alert — $${opts.targetPricePerOz}/oz | ${BRAND}`,
    html: goldEmail({
      title: "Price Alert Triggered 📈",
      preview: `Gold has ${directionText} your target of $${opts.targetPricePerOz}/oz.`,
      body: `
        <p style="color:#d4b896;font-size:16px;">Your price alert has been triggered.</p>
        <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:20px;margin:24px 0;text-align:center;">
          <p style="color:#888;margin:0 0 6px;">Current Gold Price</p>
          <p style="color:#d4a017;font-size:28px;font-weight:bold;margin:0;">$${opts.currentPricePerOz.toFixed(2)}<span style="font-size:16px;color:#888;">/oz</span></p>
          <p style="color:#666;font-size:13px;margin:12px 0 0;">Your target: $${opts.targetPricePerOz.toLocaleString()}/oz (${opts.direction})</p>
          <p style="color:#a89070;margin:4px 0 0;">Gold has <strong style="color:#d4b896;">${directionText}</strong> your target price.</p>
        </div>
        <p style="color:#a89070;">Now may be a good time to review your portfolio and consider your next move.</p>
      `,
    }),
  });
}

// ── Withdrawal Received ───────────────────────────────────────────────────
export async function sendWithdrawalReceivedEmail(opts: {
  customerEmail: string;
  customerName: string;
  amountUsd: number;
  currency: string;
  network: string;
  cryptoAddress: string;
}) {
  const shortAddress = `${opts.cryptoAddress.slice(0, 6)}...${opts.cryptoAddress.slice(-6)}`;
  await resend.emails.send({
    from: `${BRAND} <${FROM}>`,
    to: opts.customerEmail,
    subject: `Withdrawal Request Received — $${opts.amountUsd} | ${BRAND}`,
    html: goldEmail({
      title: "Withdrawal Request Received",
      preview: `Your withdrawal of $${opts.amountUsd} is being reviewed.`,
      body: `
        <p style="color:#d4b896;font-size:16px;">Hi ${opts.customerName},</p>
        <p style="color:#a89070;">We've received your withdrawal request and it's currently under review. Most withdrawals are processed within 24 hours.</p>
        <div style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:20px;margin:24px 0;">
          <table style="width:100%;">
            <tr>
              <td style="color:#888;padding:6px 0;">Amount</td>
              <td style="color:#d4a017;font-weight:bold;text-align:right;">$${opts.amountUsd.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="color:#888;padding:6px 0;">Currency</td>
              <td style="color:#d4b896;text-align:right;">${opts.currency}</td>
            </tr>
            <tr>
              <td style="color:#888;padding:6px 0;">Network</td>
              <td style="color:#d4b896;text-align:right;">${opts.network}</td>
            </tr>
            <tr>
              <td style="color:#888;padding:6px 0;">Address</td>
              <td style="color:#d4b896;text-align:right;font-family:monospace;">${shortAddress}</td>
            </tr>
          </table>
        </div>
        <p style="color:#a89070;">You'll receive another email once your withdrawal has been approved and sent. If you did not request this withdrawal, please contact us immediately.</p>
      `,
    }),
  });
}

// ── Shared HTML wrapper ───────────────────────────────────────────────────
function goldEmail({ title, preview, body }: { title: string; preview: string; body: string }) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:'Helvetica Neue',Arial,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">${preview}</span>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a1200,#2a1f0a);padding:32px;text-align:center;border-radius:12px 12px 0 0;border:1px solid #3a2f0a;border-bottom:none;">
            <p style="margin:0 0 4px;color:#d4a017;font-size:22px;font-weight:bold;letter-spacing:2px;">🥇 AMIRA AL DAHAB</p>
            <p style="margin:0;color:#8a7040;font-size:12px;letter-spacing:3px;text-transform:uppercase;">Golden Vault</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="background:#111;padding:32px;border:1px solid #222;border-top:2px solid #d4a017;border-bottom:none;">
            <h1 style="color:#d4a017;font-size:22px;margin:0 0 20px;">${title}</h1>
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#0a0a0a;padding:24px 32px;text-align:center;border:1px solid #222;border-top:none;border-radius:0 0 12px 12px;">
            <p style="color:#444;font-size:12px;margin:0 0 8px;">© 2026 Amira Al Dahab. All rights reserved.</p>
            <p style="color:#333;font-size:11px;margin:0;">Dubai, UAE · Premium Gold Investment Platform</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
