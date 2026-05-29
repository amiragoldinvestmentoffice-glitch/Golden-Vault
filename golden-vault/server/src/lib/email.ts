import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface OrderEmailData {
  customerEmail: string;
  customerName: string;
  orderId: number;
  items: { name: string; quantity: number; price: number }[];
  total: number;
}

export async function sendOrderConfirmationEmail(data: OrderEmailData) {
  const itemRows = data.items
    .map(
      (item) =>
        `<tr><td style="padding:8px;border-bottom:1px solid #292524;color:#e7e5e4">${item.name}</td><td style="padding:8px;border-bottom:1px solid #292524;color:#e7e5e4;text-align:center">${item.quantity}</td><td style="padding:8px;border-bottom:1px solid #292524;color:#d4a843;text-align:right">$${item.price.toFixed(2)}</td></tr>`
    )
    .join("");

  try {
    await resend.emails.send({
      from: "Amira Al Dahab <onboarding@resend.dev>",
      to: data.customerEmail,
      subject: `Order Confirmed #${data.orderId} — Amira Al Dahab`,
      html: `
        <div style="background:#1c1917;padding:40px;font-family:Georgia,serif;max-width:600px;margin:0 auto;border-radius:12px">
          <div style="text-align:center;margin-bottom:32px">
            <h1 style="color:#d4a843;font-size:28px;margin:0">✦ Amira Al Dahab</h1>
            <p style="color:#78716c;margin:4px 0 0">Premium Gold Investment</p>
          </div>
          <div style="background:#292524;border-radius:8px;padding:24px;margin-bottom:24px;text-align:center">
            <div style="font-size:40px;margin-bottom:8px">✅</div>
            <h2 style="color:#e7e5e4;margin:0 0 8px">Order Confirmed!</h2>
            <p style="color:#78716c;margin:0">Order <strong style="color:#d4a843">#${data.orderId}</strong></p>
          </div>
          <p style="color:#e7e5e4">Hello ${data.customerName},</p>
          <p style="color:#a8a29e">Thank you for your purchase. Your order has been confirmed and is being processed. We will notify you when it ships.</p>
          <table style="width:100%;border-collapse:collapse;margin:24px 0">
            <thead>
              <tr style="background:#292524">
                <th style="padding:10px 8px;text-align:left;color:#78716c;font-size:12px;text-transform:uppercase">Item</th>
                <th style="padding:10px 8px;text-align:center;color:#78716c;font-size:12px;text-transform:uppercase">Qty</th>
                <th style="padding:10px 8px;text-align:right;color:#78716c;font-size:12px;text-transform:uppercase">Price</th>
              </tr>
            </thead>
            <tbody>${itemRows}</tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding:12px 8px;color:#e7e5e4;font-weight:bold">Total</td>
                <td style="padding:12px 8px;color:#d4a843;font-weight:bold;text-align:right;font-size:18px">$${data.total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          <div style="background:#292524;border-radius:8px;padding:16px;margin-bottom:24px">
            <p style="color:#78716c;font-size:12px;margin:0 0 4px;text-transform:uppercase">What happens next?</p>
            <p style="color:#a8a29e;margin:0;font-size:14px">Our team will verify your order and begin processing. Physical gold orders are shipped via insured courier within 2-5 business days.</p>
          </div>
          <div style="text-align:center;border-top:1px solid #292524;padding-top:24px">
            <p style="color:#78716c;font-size:12px;margin:0">Questions? Email us at <a href="mailto:amiragoldinvestmentoffice@gmail.com" style="color:#d4a843">amiragoldinvestmentoffice@gmail.com</a></p>
            <p style="color:#44403c;font-size:11px;margin:8px 0 0">© 2026 Amira Al Dahab · Dubai, UAE</p>
          </div>
        </div>
      `,
    });
    console.log("Order confirmation email sent to", data.customerEmail);
  } catch (err) {
    console.error("Failed to send order email:", err);
  }
}
