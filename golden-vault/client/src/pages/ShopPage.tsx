import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Link } from "wouter";
import { ShoppingCart, Search, Star } from "lucide-react";
import { useAuth } from "../lib/auth";
import SEO from "../components/SEO";

const CATEGORIES = ["all", "bar", "coin", "jewelry"] as const;

interface Product {
  id: number;
  name: string;
  description: string;
  price_usd: string;
  weight_grams: string;
  purity: string;
  category: string;
  image_url: string;
  in_stock: boolean;
}

interface ReviewSummary {
  avgRating: number;
  count: number;
}

export default function ShopPage() {
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["products", category, search],
    queryFn: () => api.get("/products", { params: { category, search } }).then((r) => r.data),
  });

  const { data: price } = useQuery({
    queryKey: ["price"],
    queryFn: () => api.get("/price").then((r) => r.data),
    refetchInterval: 30_000,
  });

  const { data: reviewsSummary = {} } = useQuery<Record<number, ReviewSummary>>({
    queryKey: ["reviews-summary"],
    queryFn: () => api.get("/products/reviews/summary").then((r) => r.data),
  });

  const addToCart = async (productId: number) => {
    if (!user) {
      alert("Please sign in to add items to cart");
      return;
    }
    await api.post("/cart", { productId, quantity: 1 });
    qc.invalidateQueries({ queryKey: ["cart"] });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <SEO title="Shop Premium Gold" description="Browse investment-grade gold bars, coins and bullion. Live spot prices. Secure shipping worldwide from Dubai." />

      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-gold-400">Gold Store</h1>
          <p className="text-stone-400 mt-1">Premium gold products — bars, coins, and jewelry</p>
        </div>
        {price && (
          <div className="card px-4 py-3 text-sm">
            <span className="text-stone-400">Spot Price: </span>
            <span className="text-gold-400 font-semibold">${parseFloat(price.perOz).toLocaleString()}/oz</span>
            <span className="text-stone-500 ml-2">(${parseFloat(price.perGram).toFixed(2)}/g)</span>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={16} />
          <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-stone-900 border border-stone-800 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-gold-500" />
        </div>
        <div className="flex gap-2">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${category === cat ? "bg-gold-500 text-stone-900" : "bg-stone-900 border border-stone-800 text-stone-400 hover:border-gold-500"}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="card h-80 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="card overflow-hidden group hover:border-gold-500/50 transition-colors">
              <Link href={`/products/${product.id}`}>
                <div className="h-48 bg-stone-800 overflow-hidden cursor-pointer">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🥇</div>
                  )}
                </div>
              </Link>
              <div className="p-4">
                <span className="text-xs text-gold-600 uppercase tracking-wide font-medium">{product.category} · {product.purity}</span>
                <Link href={`/products/${product.id}`}>
                  <h3 className="font-medium text-stone-100 mt-1 hover:text-gold-400 cursor-pointer line-clamp-2">{product.name}</h3>
                </Link>
                <p className="text-stone-500 text-xs mt-1">{parseFloat(product.weight_grams).toFixed(1)}g</p>
                {reviewsSummary[product.id]?.count > 0 && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={11} className={s <= Math.round(reviewsSummary[product.id].avgRating) ? "text-gold-400 fill-gold-400" : "text-stone-700"} />
                      ))}
                    </div>
                    <span className="text-xs text-stone-500">({reviewsSummary[product.id].count})</span>
                  </div>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-gold-400 font-semibold">${parseFloat(product.price_usd).toLocaleString()}</span>
                  <button onClick={() => addToCart(product.id)} disabled={!product.in_stock} className="flex items-center gap-1.5 btn-gold text-xs py-1.5 px-3 disabled:opacity-40 disabled:cursor-not-allowed">
                    <ShoppingCart size={13} />Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && products.length === 0 && (
        <div className="text-center py-24 text-stone-500">No products found.</div>
      )}

      {/* Verified Gold Owner Certificate */}
      <div className="mt-16 flex flex-col items-center">
        <p className="text-gold-400 font-serif text-xl font-bold mb-4">Verified Gold Owner</p>
        <div className="max-w-sm w-full rounded-2xl overflow-hidden border border-gold-500/30 shadow-xl">
          <img src="https://i.imgur.com/KFi4n7z.jpeg" alt="Gold Ownership Certificate - Amira Aldahab" className="w-full" />
        </div>
        <p className="text-stone-400 text-sm text-center mt-3">Amira Aldahab — Certified 1kg Fine Gold Owner · Serial AA01357</p>
      </div>

      {/* ── About Section ────────────────────────────────────── */}
      <div className="mt-24 border-t border-stone-800 pt-20">

        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden mb-14 border border-stone-800">
          <div className="bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 px-8 py-14 text-center">
            <div className="text-5xl mb-4">🏅</div>
            <h2 className="text-2xl font-serif text-gold-400 mb-3">Born from a Passion for Gold</h2>
            <p className="text-stone-300 max-w-lg mx-auto leading-relaxed">
              Founded in Dubai — the world's gold capital — Amira Al Dahab was built to make
              premium gold investment accessible to everyone, everywhere.
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto space-y-12 text-stone-300 leading-relaxed">

          {/* Our Story */}
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

          {/* Why Gold */}
          <section>
            <h2 className="text-gold-400 font-semibold text-lg mb-3">Why Gold?</h2>
            <p>
              Gold has preserved wealth for thousands of years. It hedges against inflation, protects
              against currency collapse, and remains one of the most liquid assets in the world. In
              uncertain times, gold endures. We believe everyone deserves a piece of that security.
            </p>
          </section>

          {/* Why Amira Al Dahab */}
          <section>
            <h2 className="text-gold-400 font-semibold text-lg mb-4">Why Amira Al Dahab?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {/* Based in Dubai */}
          <section>
            <h2 className="text-gold-400 font-semibold text-lg mb-3">Based in Dubai</h2>
            <p>
              Dubai is home to the famous Gold Souk — one of the largest gold markets in the world.
              Our roots in this city give us unparalleled access to certified refineries, competitive
              pricing, and a deep understanding of the global gold trade. When you invest with
              Amira Al Dahab, you're connected to the heart of the world's gold market.
            </p>
          </section>

          {/* Our Commitment */}
          <section>
            <h2 className="text-gold-400 font-semibold text-lg mb-3">Our Commitment</h2>
            <p>
              Transparency, security, and trust are at the core of everything we do. We publish
              live gold prices, provide full product documentation, and are always available to
              answer your questions. Your wealth is safe with us.
            </p>
          </section>
        </div>

        {/* CTA */}
        <div className="mt-14 border border-gold-500/20 rounded-2xl p-8 text-center bg-stone-900/30 max-w-3xl mx-auto">
          <h3 className="text-xl font-serif text-gold-400 mb-2">Ready to Start Investing?</h3>
          <p className="text-stone-400 mb-5 text-sm">Browse our certified gold collection or start with a fractional investment today.</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/invest"><span className="btn-gold px-6 py-2 cursor-pointer">Invest Now</span></Link>
            <Link href="/wallet"><span className="border border-gold-500/40 text-gold-400 hover:bg-stone-800 px-6 py-2 rounded-lg cursor-pointer transition-colors">Deposit Crypto</span></Link>
          </div>
        </div>

      </div>
      {/* ── End About Section ─────────────────────────────────── */}

    </div>
  );
}
