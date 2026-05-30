import { Link } from "wouter";
import SEO from "../components/SEO";

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <SEO title="About Us" description="Learn about Amira Al Dahab, Dubai's trusted gold investment office. Premium gold trading with integrity and expertise." path="/about" />

      <Link href="/"><span className="text-gold-400 hover:underline cursor-pointer text-sm">← Back to Shop</span></Link>

      <h1 className="text-3xl font-serif text-gold-400 mt-4 mb-2">About Amira Al Dahab</h1>
      <p className="text-stone-500 text-sm mb-10">Your trusted partner in gold investment</p>

      <div className="relative rounded-2xl overflow-hidden mb-10 border border-stone-800">
        <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 px-8 py-14 text-center">
          <div className="text-5xl mb-4">🏅</div>
          <h2 className="text-2xl font-serif text-gold-400 mb-3">Born from a Passion for Gold</h2>
          <p className="text-stone-300 max-w-lg mx-auto leading-relaxed">
            Founded in Dubai — the world's gold capital — Amira Al Dahab was built to make
            premium gold investment accessible to everyone, everywhere.
          </p>
        </div>
      </div>

      <div className="space-y-8 text-stone-300 leading-relaxed">
        <section>
          <h2 className="text-gold-400 font-semibold text-lg mb-3">Our Story</h2>
          <p className="mb-3">
            Amira Al Dahab — meaning <em>"Amira of Gold"</em> in Arabic — was established with a single
            mission: to give everyday investors direct access to real, certified gold at transparent prices.
          </p>
          <p>
            Rooted in Dubai's thriving gold trade and inspired by the region's deep cultural connection
            to precious metals, we bridge the gap between traditional gold markets and modern digital
            investment. Whether you're buying your first gold coin or building a serious portfolio,
            we're here to guide you every step of the way.
          </p>
        </section>

        <section>
          <h2 className="text-gold-400 font-semibold text-lg mb-3">Why Gold?</h2>
          <p>
            Gold has preserved wealth for thousands of years. It hedges against inflation, protects
            against currency collapse, and remains one of the most liquid assets in the world. In
            uncertain times, gold endures. We believe everyone deserves a piece of that security.
          </p>
        </section>

        <section>
          <h2 className="text-gold-400 font-semibold text-lg mb-3">Why Amira Al Dahab?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            {[
              { icon: "✅", title: "Certified Gold", desc: "Every product is investment-grade with full authentication." },
              { icon: "💰", title: "Live Spot Pricing", desc: "We track the global gold market in real time — no hidden markups." },
              { icon: "🔒", title: "Secure Platform", desc: "Bank-level encryption protects your account and transactions." },
              { icon: "🌍", title: "Global Shipping", desc: "Fully insured delivery to customers worldwide." },
              { icon: "₿", title: "Crypto Friendly", desc: "Fund your account with BTC, ETH, SOL, or USDT." },
              { icon: "📊", title: "Portfolio Tracking", desc: "Watch your gold investment grow with real-time valuations." },
            ].map((item) => (
              <div key={item.title} className="border border-stone-800 rounded-xl p-4 bg-stone-900/40">
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="font-semibold text-stone-100 mb-1">{item.title}</div>
                <div className="text-stone-400 text-sm">{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-gold-400 font-semibold text-lg mb-3">Based in Dubai</h2>
          <p>
            Dubai is home to the famous Gold Souk — one of the largest gold markets in the world.
            Our roots in this city give us unparalleled access to certified refineries, competitive
            pricing, and a deep understanding of the global gold trade. When you invest with
            Amira Al Dahab, you're connected to the heart of the world's gold market.
          </p>
        </section>

        <section>
          <h2 className="text-gold-400 font-semibold text-lg mb-3">Our Commitment</h2>
          <p>
            Transparency, security, and trust are at the core of everything we do. We publish
            live gold prices, provide full product documentation, and are always available to
            answer your questions. Your wealth is safe with us.
          </p>
        </section>
      </div>

      <div className="mt-12 border border-gold-500/20 rounded-2xl p-8 text-center bg-stone-900/30">
        <h3 className="text-xl font-serif text-gold-400 mb-2">Ready to Start Investing?</h3>
        <p className="text-stone-400 mb-5 text-sm">Browse our certified gold collection or start with a fractional investment today.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/"><span className="btn-gold px-6 py-2 cursor-pointer">Shop Gold</span></Link>
          <Link href="/invest"><span className="border border-gold-500/40 text-gold-400 hover:bg-stone-800 px-6 py-2 rounded-lg cursor-pointer transition-colors">Invest Now</span></Link>
        </div>
      </div>
    </div>
  );
}
