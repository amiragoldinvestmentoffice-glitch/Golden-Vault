import { useState } from "react";
import { Link } from "wouter";
import { Mail, MessageCircle, Clock, MapPin, Send } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    if (!form.name || !form.email || !form.message) return;
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\nSubject: ${form.subject}\n\n${form.message}`
    );
    window.location.href = `mailto:amiragoldinvestmentoffice@gmail.com?subject=${encodeURIComponent(form.subject || "Contact from Amira Al Dahab")}&body=${body}`;
    setSent(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link href="/"><span className="text-gold-400 hover:underline cursor-pointer text-sm">← Back to Shop</span></Link>
      <h1 className="text-3xl font-serif text-gold-400 mt-4 mb-2">Contact Us</h1>
      <p className="text-stone-400 mb-10">We're here to help. Reach out and we'll respond within 24 hours.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Left — Info cards */}
        <div className="space-y-4">
          <div className="border border-stone-800 rounded-xl p-5 bg-stone-900/40 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center flex-shrink-0">
              <Mail size={18} className="text-gold-400" />
            </div>
            <div>
              <div className="font-semibold text-stone-100 mb-1">Email Us</div>
              
                href="mailto:amiragoldinvestmentoffice@gmail.com"
                className="text-gold-400 hover:underline text-sm break-all"
              >
                amiragoldinvestmentoffice@gmail.com
              </a>
              <p className="text-stone-500 text-xs mt-1">Best for order issues, refunds, and account help.</p>
            </div>
          </div>

          <div className="border border-stone-800 rounded-xl p-5 bg-stone-900/40 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <MessageCircle size={18} className="text-green-400" />
            </div>
            <div>
              <div className="font-semibold text-stone-100 mb-1">WhatsApp</div>
              
                href="https://wa.me/971500000000"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:underline text-sm"
              >
                Chat on WhatsApp
              </a>
              <p className="text-stone-500 text-xs mt-1">Quick questions and order updates.</p>
            </div>
          </div>

          <div className="border border-stone-800 rounded-xl p-5 bg-stone-900/40 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center flex-shrink-0">
              <Clock size={18} className="text-gold-400" />
            </div>
            <div>
              <div className="font-semibold text-stone-100 mb-1">Response Time</div>
              <p className="text-stone-300 text-sm">Within 24 hours</p>
              <p className="text-stone-500 text-xs mt-1">Monday – Saturday, 9am – 9pm GST</p>
            </div>
          </div>

          <div className="border border-stone-800 rounded-xl p-5 bg-stone-900/40 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center flex-shrink-0">
              <MapPin size={18} className="text-gold-400" />
            </div>
            <div>
              <div className="font-semibold text-stone-100 mb-1">Based In</div>
              <p className="text-stone-300 text-sm">Dubai, United Arab Emirates</p>
              <p className="text-stone-500 text-xs mt-1">Heart of the global gold market</p>
            </div>
          </div>

          {/* Quick links */}
          <div className="border border-stone-800 rounded-xl p-5 bg-stone-900/40">
            <div className="font-semibold text-stone-100 mb-3">Common Topics</div>
            <div className="space-y-2">
              {[
                { label: "Order & Shipping Questions", href: "/faq" },
                { label: "Refund & Return Policy", href: "/refund" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms & Conditions", href: "/terms" },
              ].map((link) => (
                
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between text-sm text-stone-400 hover:text-gold-400 transition-colors py-1 border-b border-stone-800/50 last:border-0"
                >
                  {link.label}
                  <span className="text-xs">→</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Contact form */}
        <div className="border border-stone-800 rounded-xl p-6 bg-stone-900/40">
          <h2 className="text-lg font-semibold text-stone-100 mb-5">Send a Message</h2>

          {sent ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">✅</div>
              <p className="text-gold-400 font-semibold mb-2">Message Ready to Send!</p>
              <p className="text-stone-400 text-sm">Your email client opened with the message pre-filled. Hit send to reach us.</p>
              <button
                onClick={() => setSent(false)}
                className="mt-5 text-sm text-stone-500 hover:text-gold-400 transition-colors"
              >
                Send another message
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-stone-400 text-sm mb-1">Your Name *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. John Smith"
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-2.5 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-gold-500 transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-stone-400 text-sm mb-1">Your Email *</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@email.com"
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-2.5 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-gold-500 transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-stone-400 text-sm mb-1">Subject</label>
                <select
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-2.5 text-stone-100 focus:outline-none focus:border-gold-500 transition-colors text-sm"
                >
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
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Tell us how we can help..."
                  className="w-full bg-stone-800 border border-stone-700 rounded-lg px-4 py-2.5 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-gold-500 transition-colors text-sm resize-none"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={!form.name || !form.email || !form.message}
                className="btn-gold w-full py-3 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send size={16} />
                Send Message
              </button>

              <p className="text-stone-600 text-xs text-center">
                This will open your email client with the message pre-filled.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
