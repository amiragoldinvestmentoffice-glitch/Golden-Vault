import { useState } from "react";
import { Link } from "wouter";
import SEO from "../components/SEO";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    if (!name || !email || !message) return;
    const body = encodeURIComponent("Name: " + name + "\nEmail: " + email + "\nSubject: " + subject + "\n\n" + message);
    const sub = encodeURIComponent(subject || "Contact from Amira Al Dahab");
    window.location.href = "mailto:amiragoldinvestmentoffice@gmail.com?subject=" + sub + "&body=" + body;
    setSent(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <SEO title="Contact Us" description="Get in touch with Amira Al Dahab for gold investment inquiries. Email or WhatsApp our Dubai office." path="/contact" />

      <Link href="/"><span className="text-gold-400 hover:underline cursor-pointer text-sm">← Back to Shop</span></Link>
      <h1 className="text-3xl font-serif text-gold-400 mt-4 mb-2">Contact Us</h1>
      <p className="text-stone-400 mb-10">We're here to help. Reach out and we'll respond within 24 hours.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        <div className="space-y-4">

          <div className="border border-stone-800 rounded-xl p-5 bg-stone-900/40">
            <div className="font-semibold text-stone-100 mb-1">📧 Email Us</div>
            <a href="mailto:amiragoldinvestmentoffice@gmail.com" className="text-gold-400 hover:underline text-sm break-all">amiragoldinvestmentoffice@gmail.com</a>
            <p className="text-stone-500 text-xs mt-1">Best for order issues, refunds, and account help.</p>
          </div>

          <div className="border border-stone-800 rounded-xl p-5 bg-stone-900/40">
            <div className="font-semibold text-stone-100 mb-1">💬 WhatsApp</div>
            <a href="https://wa.me/971500000000" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline text-sm">Chat on WhatsApp</a>
            <p className="text-stone-500 text-xs mt-1">Quick questions and order updates.</p>
          </div>

          <div className="border border-stone-800 rounded-xl p-5 bg-stone-900/40">
            <div className="font-semibold text-stone-100 mb-1">🕐 Response Time</div>
            <p className="text-stone-300 text-sm">Within 24 hours</p>
            <p className="text-stone-500 text-xs mt-1">Monday – Saturday, 9am – 9pm GST</p>
          </div>

          <div className="border border-stone-800 rounded-xl p-5 bg-stone-900/40">
            <div className="font-semibold text-stone-100 mb-1">📍 Based In</div>
            <p className="text-stone-300 text-sm">Dubai, United Arab Emirates</p>
            <p className="text-stone-500 text-xs mt-1">Heart of the global gold market</p>
          </div>

          <div className="border border-stone-800 rounded-xl p-5 bg-stone-900/40">
            <div className="font-semibold text-stone-100 mb-3">Common Topics</div>
            <div className="space-y-2">
              <a href="/faq" className="flex items-center justify-between text-sm text-stone-400 hover:text-gold-400 transition-colors py-1 border-b border-stone-800">Order & Shipping Questions <span>→</span></a>
              <a href="/refund" className="flex items-center justify-between text-sm text-stone-400 hover:text-gold-400 transition-colors py-1 border-b border-stone-800">Refund & Return Policy <span>→</span></a>
              <a href="/privacy" className="flex items-center justify-between text-sm text-stone-400 hover:text-gold-400 transition-colors py-1 border-b border-stone-800">Privacy Policy <span>→</span></a>
              <a href="/terms" className="flex items-center justify-between text-sm text-stone-400 hover:text-gold-400 transition-colors py-1">Terms & Conditions <span>→</span></a>
            </div>
          </div>

        </div>

        <div className="border border-stone-800 rounded-xl p-6 bg-stone-900/40">
          <h2 className="text-lg font-semibold text-stone-100 mb-5">Send a Message</h2>

          {sent ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-gold-400 font-semibold mb-2">Message Ready to Send!</p>
              <p className="text-stone-400 text-sm">Your email client opened with the message pre-filled.</p>
              <button onClick={() => setSent(false)} className="mt-5 text-sm text-stone-500 hover:text-gold-400 transition-colors">Send another message</button>
            </div>
          ) : (
            <div className="space-y-4">

              <div>
                <label className="block text-stone-400 text-sm mb-1">Your Name *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Smith" className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-2.5 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-gold-500 transition-colors text-sm" />
              </div>

              <div>
                <label className="block text-stone-400 text-sm mb-1">Your Email *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-2.5 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-gold-500 transition-colors text-sm" />
              </div>

              <div>
                <label className="block text-stone-400 text-sm mb-1">Subject</label>
                <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-2.5 text-stone-100 focus:outline-none focus:border-gold-500 transition-colors text-sm">
                  <option value="">Select a topic...</option>
                  <option>Order Enquiry</option>
                  <option>Refund Request</option>
                  <option>Wallet / Store Credit</option>
                  <option>Investment Question</option>
                  <option>Account Issue</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-400 text-sm mb-1">Message *</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} placeholder="Tell us how we can help..." className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-2.5 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-gold-500 transition-colors text-sm resize-none" />
              </div>

              <button onClick={handleSubmit} disabled={!name || !email || !message} className="btn-gold w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed">
                Send Message
              </button>

              <p className="text-stone-600 text-xs text-center">This will open your email client with the message pre-filled.</p>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
