import { Link } from "wouter";
import SEO from "../components/SEO";

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SEO title="Privacy Policy" description="How Amira Al Dahab collects, uses and protects your personal data." />

      <Link href="/"><span className="text-gold-400 hover:underline cursor-pointer text-sm">← Back to Shop</span></Link>
      <h1 className="text-3xl font-serif text-gold-400 mt-4 mb-2">Privacy Policy</h1>
      <p className="text-stone-500 text-sm mb-8">Last updated: May 2026</p>
      <div className="space-y-8 text-stone-300 leading-relaxed">
        <section>
          <h2 className="text-gold-400 font-semibold text-lg mb-2">1. Information We Collect</h2>
          <p>We collect information you provide when creating an account, placing orders, or contacting us. This includes your name, email address, shipping address, and payment information.</p>
        </section>
        <section>
          <h2 className="text-gold-400 font-semibold text-lg mb-2">2. How We Use Your Information</h2>
          <p>We use your information to process orders, manage your account, send order confirmations, and improve our services. We do not sell your personal data to third parties.</p>
        </section>
        <section>
          <h2 className="text-gold-400 font-semibold text-lg mb-2">3. Cookies</h2>
          <p>We use cookies to keep you signed in and remember your preferences. You can disable cookies in your browser settings, but some features may not work properly.</p>
        </section>
        <section>
          <h2 className="text-gold-400 font-semibold text-lg mb-2">4. Data Security</h2>
          <p>We use industry-standard encryption to protect your data. Passwords are never stored in plain text. Payment information is handled by secure third-party processors.</p>
        </section>
        <section>
          <h2 className="text-gold-400 font-semibold text-lg mb-2">5. Data Retention</h2>
          <p>We retain your account data for as long as your account is active. Order history is kept for 7 years for legal and accounting purposes. You may request deletion of your account at any time.</p>
        </section>
        <section>
          <h2 className="text-gold-400 font-semibold text-lg mb-2">6. Third-Party Services</h2>
          <p>We use Clerk for authentication and Neon for database storage. These services have their own privacy policies. We also use Imgur to host product images.</p>
        </section>
        <section>
          <h2 className="text-gold-400 font-semibold text-lg mb-2">7. Your Rights</h2>
          <p>You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at <a href="mailto:amiragoldinvestmentoffice@gmail.com" className="text-gold-400 hover:underline">amiragoldinvestmentoffice@gmail.com</a></p>
        </section>
        <section>
          <h2 className="text-gold-400 font-semibold text-lg mb-2">8. Changes to This Policy</h2>
          <p>We may update this policy from time to time. We will notify you of significant changes by email or by posting a notice on our website.</p>
        </section>
        <section>
          <h2 className="text-gold-400 font-semibold text-lg mb-2">9. Contact</h2>
          <p>For privacy questions, contact us at <a href="mailto:amiragoldinvestmentoffice@gmail.com" className="text-gold-400 hover:underline">amiragoldinvestmentoffice@gmail.com</a></p>
        </section>
      </div>
    </div>
  );
}
