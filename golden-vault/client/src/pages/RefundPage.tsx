import { Link } from "wouter";
import SEO from "../components/SEO";

export default function RefundPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SEO title="Refund & Return Policy" description="Understand the refund and return policy for orders placed on Amira Al Dahab." />

      <Link href="/"><span className="text-gold-400 hover:underline cursor-pointer text-sm">← Back to Shop</span></Link>
      <h1 className="text-3xl font-serif text-gold-400 mt-4 mb-2">Refund & Return Policy</h1>
      <p className="text-stone-500 text-sm mb-8">Last updated: May 2026</p>
      <div className="space-y-8 text-stone-300 leading-relaxed">
        <section>
          <h2 className="text-gold-400 font-semibold text-lg mb-2">1. General Policy</h2>
          <p>Due to the nature of precious metals and fluctuating gold prices, all sales are final once an order is confirmed and payment is received. We do not accept returns on gold bars, coins, or jewelry unless the item is defective or damaged upon arrival.</p>
        </section>
        <section>
          <h2 className="text-gold-400 font-semibold text-lg mb-2">2. Damaged or Defective Items</h2>
          <p>If your item arrives damaged or defective, you must notify us within 48 hours of delivery with photographic evidence. We will arrange a replacement or store credit at our discretion.</p>
        </section>
        <section>
          <h2 className="text-gold-400 font-semibold text-lg mb-2">3. Wrong Item Received</h2>
          <p>If you receive an incorrect item, contact us within 48 hours. We will arrange collection and send the correct item at no additional cost to you.</p>
        </section>
        <section>
          <h2 className="text-gold-400 font-semibold text-lg mb-2">4. Order Cancellations</h2>
          <p>Orders may be cancelled within 1 hour of placement. After this window, cancellations are not guaranteed as orders may already be in processing. Contact us immediately at <a href="mailto:amiragoldinvestmentoffice@gmail.com" className="text-gold-400 hover:underline">amiragoldinvestmentoffice@gmail.com</a> to request a cancellation.</p>
        </section>
        <section>
          <h2 className="text-gold-400 font-semibold text-lg mb-2">5. Cryptocurrency Payments</h2>
          <p>Payments made in cryptocurrency are irreversible. Refunds for crypto payments, where eligible, will be issued as store credit based on the USD value at time of original payment.</p>
        </section>
        <section>
          <h2 className="text-gold-400 font-semibold text-lg mb-2">6. Store Credit</h2>
          <p>Store credit is non-refundable and non-transferable. It has no expiry date and can be used for any purchase on the platform.</p>
        </section>
        <section>
          <h2 className="text-gold-400 font-semibold text-lg mb-2">7. Investment Gold</h2>
          <p>Fractional gold investments are non-refundable. The value of your investment fluctuates with the live gold spot price. You may withdraw your investment subject to approval and applicable fees.</p>
        </section>
        <section>
          <h2 className="text-gold-400 font-semibold text-lg mb-2">8. Anti-Money Laundering & Refund Verification</h2>
          <p>Amira Al Dahab does not encourage refunds as a financial instrument and strictly complies with anti-money laundering (AML) regulations. In the rare event that a refund is approved, it will only be issued to the original account or payment method from which funds were received — no exceptions. Refunds will never be redirected to a third-party account or a different payment method. All approved refunds are subject to identity verification and will be finalised solely at the discretion of our legal team. Any attempt to use our refund process to move funds illegitimately will be reported to the relevant authorities.</p>
        </section>
        <section>
          <h2 className="text-gold-400 font-semibold text-lg mb-2">9. Contact Us</h2>
          <p>For all refund and return queries, contact us at <a href="mailto:amiragoldinvestmentoffice@gmail.com" className="text-gold-400 hover:underline">amiragoldinvestmentoffice@gmail.com</a> within the timeframes stated above.</p>
        </section>
      </div>
    </div>
  );
}
