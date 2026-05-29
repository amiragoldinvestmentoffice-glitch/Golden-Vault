import { useState } from "react";
import { Link } from "wouter";
import { ChevronDown, ChevronUp } from "lucide-react";

const faqs = [
  { q: "How do I buy gold?", a: "Browse our Shop, add items to your cart, sign in, and proceed to checkout. We accept bank transfer, cryptocurrency, and credit/debit card." },
  { q: "Is the gold certified and authentic?", a: "Yes. All our gold products are certified investment-grade gold from reputable refineries. Each bar and coin comes with an assay certificate and serial number." },
  { q: "How long does delivery take?", a: "Orders are processed within 2-5 business days. Delivery times vary by location — typically 5-10 business days internationally. All shipments are fully insured." },
  { q: "What is store credit / wallet?", a: "You can fund your account by sending cryptocurrency to our wallet addresses. The equivalent USD value is added to your balance and can be used to purchase gold on the platform." },
  { q: "Can I withdraw my store credit?", a: "Yes. You can submit a withdrawal request from your wallet page. Withdrawals are subject to verification and approval, typically within 1-3 business days." },
  { q: "How does gold investment work?", a: "On the Invest page, enter a USD amount and we allocate the equivalent grams of gold to your account at the current spot price. You can track your portfolio value in real time." },
  { q: "What cryptocurrencies do you accept?", a: "We accept Bitcoin (BTC), Ethereum (ETH), Solana (SOL), and USDT (TRC20/Tron network)." },
  { q: "Is my personal data safe?", a: "Yes. We use industry-standard encryption and never sell your data to third parties. Read our Privacy Policy for full details." },
  { q: "What if my order arrives damaged?", a: "Contact us within 48 hours of delivery with photos. We will arrange a replacement or store credit. See our Refund Policy for details." },
  { q: "How do I contact support?", a: "Email us at amiragoldinvestmentoffice@gmail.com or use the Contact page. We respond within 24 hours." },
];

export default function FaqPage() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link href="/"><span className="text-gold-400 hover:underline cursor-pointer text-sm">← Back to Shop</span></Link>
      <h1 className="text-3xl font-serif text-gold-400 mt-4 mb-2">Frequently Asked Questions</h1>
      <p className="text-stone-400 mb-8">Everything you need to know about Amira Al Dahab.</p>

      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <div key={i} className="border border-stone-800 rounded-xl overflow-hidden">
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-stone-800/50 transition-colors">
              <span className="font-medium text-stone-100">{faq.q}</span>
              {open === i ? <ChevronUp size={18} className="text-gold-400 flex-shrink-0" /> : <ChevronDown size={18} className="text-stone-500 flex-shrink-0" />}
            </button>
            {open === i && (
              <div className="px-5 pb-4 text-stone-400 text-sm leading-relaxed border-t border-stone-800 pt-3">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-10 p-6 text-center border border-gold-500/20 rounded-2xl bg-stone-900/30">
        <p className="text-stone-400 mb-3">Still have questions?</p>
        <a href="mailto:amiragoldinvestmentoffice@gmail.com" className="btn-gold inline-block px-6 py-2">Contact Us</a>
      </div>
    </div>
  );
}
