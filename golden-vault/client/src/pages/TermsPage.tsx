import SEO from "../components/SEO";

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SEO title="Terms & Conditions" description="Read the terms and conditions for using Amira Al Dahab gold investment services." />

      <h1 className="text-3xl font-serif text-gold-400 mb-2">Terms & Conditions</h1>
      <p className="text-stone-500 text-sm mb-8">Last updated: May 2026</p>

      <div className="space-y-8 text-stone-300 leading-relaxed">
        <section>
          <h2 className="text-xl font-serif text-gold-400 mb-3">1. Acceptance of Terms</h2>
          <p>By accessing and using Amira Al Dahab ("the Platform"), you agree to be bound by these Terms and Conditions. If you do not agree, please do not use our services.</p>
        </section>

        <section>
          <h2 className="text-xl font-serif text-gold-400 mb-3">2. About Our Services</h2>
          <p>Amira Al Dahab is a gold trading and investment platform offering physical gold products including bars, coins, and jewelry. We also provide gold investment services allowing users to purchase fractional gold holdings.</p>
        </section>

        <section>
          <h2 className="text-xl font-serif text-gold-400 mb-3">3. Eligibility</h2>
          <p>You must be at least 18 years of age to use this platform. By using our services, you confirm that you meet this requirement and have the legal capacity to enter into a binding agreement.</p>
        </section>

        <section>
          <h2 className="text-xl font-serif text-gold-400 mb-3">4. Gold Prices</h2>
          <p>Gold prices displayed on the platform are based on live market spot prices and may fluctuate. The final price at checkout is binding at the time of order confirmation. We are not responsible for price changes after an order is placed.</p>
        </section>

        <section>
          <h2 className="text-xl font-serif text-gold-400 mb-3">5. Orders & Payment</h2>
          <p>All orders are subject to availability and confirmation. We accept bank transfers, cryptocurrency, and credit/debit cards. Orders are confirmed only after payment is verified. We reserve the right to cancel any order at our discretion.</p>
        </section>

        <section>
          <h2 className="text-xl font-serif text-gold-400 mb-3">6. Shipping & Delivery</h2>
          <p>Physical gold products are shipped via insured courier services. Delivery times vary by location. Risk of loss transfers to the buyer upon delivery. We are not responsible for delays caused by customs, courier services, or force majeure events.</p>
        </section>

        <section>
          <h2 className="text-xl font-serif text-gold-400 mb-3">7. Investment Risk</h2>
          <p>Gold investments carry inherent market risk. The value of gold can go up or down. Past performance is not indicative of future results. Nothing on this platform constitutes financial advice. You invest at your own risk.</p>
        </section>

        <section>
          <h2 className="text-xl font-serif text-gold-400 mb-3">8. User Accounts</h2>
          <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account. We reserve the right to suspend or terminate accounts that violate these terms.</p>
        </section>

        <section>
          <h2 className="text-xl font-serif text-gold-400 mb-3">9. Prohibited Activities</h2>
          <p>You may not use the platform for money laundering, fraud, or any illegal activity. You may not attempt to manipulate prices, hack systems, or misrepresent your identity. Violation of these terms may result in account termination and legal action.</p>
        </section>

        <section>
          <h2 className="text-xl font-serif text-gold-400 mb-3">10. Limitation of Liability</h2>
          <p>Amira Al Dahab shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform. Our total liability shall not exceed the value of your most recent transaction.</p>
        </section>

        <section>
          <h2 className="text-xl font-serif text-gold-400 mb-3">11. Changes to Terms</h2>
          <p>We reserve the right to update these Terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms. We will notify users of significant changes via email.</p>
        </section>

        <section>
          <h2 className="text-xl font-serif text-gold-400 mb-3">12. Contact</h2>
          <p>For any questions regarding these Terms, contact us at <a href="mailto:amiragoldinvestmentoffice@gmail.com" className="text-gold-400 hover:underline">amiragoldinvestmentoffice@gmail.com</a></p>
        </section>
      </div>
    </div>
  );
}
