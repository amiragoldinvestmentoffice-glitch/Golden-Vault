import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Link } from "wouter";
import { ShoppingCart, Search, Star, Mail, Sun, Moon } from "lucide-react";
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

const DARK = {
  pageBg: "#06080F", surfaceBg: "#0A0D18", cardBg: "#0F1420",
  text: "#EDE5D5", textSub: "#8899AA", textMuted: "#445566",
  gold: "#D4A820", goldLight: "#F0C940", goldDark: "#A88010",
  goldGlow: "rgba(212,168,32,0.25)", border: "rgba(212,168,32,0.1)",
  borderHover: "rgba(212,168,32,0.4)", inputBg: "#07090F",
  shadow: "0 4px 24px rgba(0,0,0,0.55)", shadowHover: "0 12px 36px rgba(212,168,32,0.18)",
  starEmpty: "#243040", btnTextColor: "#0A0700",
};
const LIGHT = {
  pageBg: "#FDF8F0", surfaceBg: "#FFFCF5", cardBg: "#FFFFFF",
  text: "#1A1208", textSub: "#6B5534", textMuted: "#9B8A60",
  gold: "#B8880A", goldLight: "#D4A820", goldDark: "#8C6808",
  goldGlow: "rgba(184,136,10,0.18)", border: "rgba(184,136,10,0.18)",
  borderHover: "rgba(184,136,10,0.5)", inputBg: "#F5EDD8",
  shadow: "0 4px 24px rgba(120,80,0,0.1)", shadowHover: "0 12px 36px rgba(184,136,10,0.16)",
  starEmpty: "#DDD0AA", btnTextColor: "#FFFFFF",
};

const STATS = [
  { icon: "🏅", value: "2,400+", label: "Happy Investors" },
  { icon: "💰", value: "$8.3M+", label: "in Gold Sold" },
  { icon: "🌍", value: "47", label: "Countries Served" },
  { icon: "⭐", value: "4.9/5", label: "Average Rating" },
];

const TESTIMONIALS = [
  { name: "Khalid Al-Rashid", location: "Riyadh, Saudi Arabia", rating: 5, text: "The spot pricing is always fair and transparent. No surprises, no hidden fees. I've been investing for 8 months now and my portfolio has grown steadily. Amira Al Dahab is the most trustworthy gold platform I've used.", avatar: "KA" },
  { name: "Fatima Al-Zahrani", location: "Jeddah, Saudi Arabia", rating: 5, text: "As a Saudi investor, gold is part of our culture. Amira Al Dahab modernizes that tradition perfectly. I love the real-time portfolio tracking and the ability to fund with crypto. Highly recommended.", avatar: "FZ" },
  { name: "James Whitfield", location: "New York, USA", rating: 5, text: "I've tried several gold investment platforms in the US and nothing comes close to this. The interface is clean, the pricing is live, and my gold arrived certified and verified. Genuinely impressive.", avatar: "JW" },
  { name: "Rachel Monroe", location: "Los Angeles, USA", rating: 5, text: "Started with a $500 investment just to test the waters. Six months later I'm all in. The DCA feature is a game changer — I just set it and let it grow. Best financial decision I've made this year.", avatar: "RM" },
  { name: "Sophie Beaumont", location: "Paris, France", rating: 5, text: "En Europe, il est rare de trouver une plateforme aussi fiable pour investir dans l'or. The English interface is flawless and the customer support responded within minutes. Très professionnel.", avatar: "SB" },
  { name: "Hans-Peter Müller", location: "Munich, Germany", rating: 5, text: "Germans take gold seriously, and so does Amira Al Dahab. The purity certifications are exactly what I expect, and the live spot pricing matches the global market perfectly. Sehr gut.", avatar: "HM" },
  { name: "Lorenzo Esposito", location: "Milan, Italy", rating: 5, text: "I discovered this platform through a friend in Dubai and I'm grateful every day. My portfolio is up significantly and the withdrawal process was smooth and professional. Gold investing made simple.", avatar: "LE" },
  { name: "Aisha Al-Mansoori", location: "Abu Dhabi, UAE", rating: 5, text: "Living in the UAE, I have access to gold everywhere — but Amira Al Dahab gives me something the souks can't: a digital portfolio I can track anytime, anywhere. Absolutely worth it.", avatar: "AM" },
  { name: "David Okafor", location: "London, UK", rating: 5, text: "The referral program alone got three of my colleagues investing. But the real reason I stay is the platform itself — reliable, transparent, and genuinely profitable. Best gold platform in the market.", avatar: "DO" },
];

const VIDEOS = [
  { src: "https://res.cloudinary.com/dstelf8tk/video/upload/v1780156247/video_2026-05-30_16-30-47_s9uzg8.mp4", label: "Gold Collection — Dubai 2026" },
  { src: "https://res.cloudinary.com/dstelf8tk/video/upload/v1780161849/video_2026-05-30_16-30-29_mh56he.mp4", label: "Luxury Jewelry — Amira Al Dahab" },
  { src: "https://res.cloudinary.com/dstelf8tk/video/upload/v1780161882/video_2026-05-30_16-29-30_qdhp0p.mp4", label: "18K Gold — Handcrafted in Dubai" },
  { src: "https://res.cloudinary.com/dstelf8tk/video/upload/v1780161912/video_2026-05-30_16-28-01_dk5d4b.mp4", label: "Premium Gold Sets — Dubai Collection" },
  { src: "https://res.cloudinary.com/dstelf8tk/video/upload/v1780162066/video_2026-05-30_16-28-08_slc89g.mp4", label: "Certified Gold — Amira Al Dahab" },
];

const FEATURES = [
  { icon: "✅", title: "Certified Gold", desc: "Every product is investment-grade with full authentication." },
  { icon: "💰", title: "Live Spot Pricing", desc: "We track the global gold market in real time — no hidden markups." },
  { icon: "🔒", title: "Secure Platform", desc: "Bank-level encryption protects your account and transactions." },
  { icon: "🌍", title: "Global Shipping", desc: "Fully insured delivery to customers worldwide." },
  { icon: "₿", title: "Crypto Friendly", desc: "Fund your account with BTC, ETH, SOL, or USDT." },
  { icon: "📊", title: "Portfolio Tracking", desc: "Watch your gold investment grow with real-time valuations." },
];

function TestimonialCard({ t, C }: { t: (typeof TESTIMONIALS)[0]; C: typeof DARK }) {
  return (
    <div style={{ flexShrink: 0, width: 320, background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 16, padding: "24px", display: "flex", flexDirection: "column", gap: 14, boxShadow: C.shadow }}>
      <div style={{ display: "flex", gap: 2 }}>
        {[1,2,3,4,5].map((s) => (
          <Star key={s} size={12} style={{ color: s <= t.rating ? C.gold : C.starEmpty, fill: s <= t.rating ? C.gold : "transparent" }} />
        ))}
      </div>
      <p style={{ color: C.textSub, fontSize: 13, lineHeight: 1.75, fontFamily: "'DM Sans', sans-serif", flex: 1 }}>"{t.text}"</p>
      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${C.goldGlow}, transparent)`, border: `1px solid ${C.borderHover}`, display: "flex", alignItems: "center", justifyContent: "center", color: C.gold, fontSize: 11, fontWeight: 700, flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>{t.avatar}</div>
        <div>
          <div style={{ color: C.text, fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>{t.name}</div>
          <div style={{ color: C.textMuted, fontSize: 11 }}>{t.location}</div>
        </div>
      </div>
    </div>
  );
}

function VideoCard({ src, label, isActive, onActivate, onEnded, C }: { src: string; label: string; isActive: boolean; onActivate: () => void; onEnded: () => void; C: typeof DARK }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    if (!ref.current) return;
    if (isActive) ref.current.play().catch(() => {});
    else { ref.current.pause(); ref.current.currentTime = 0; }
  }, [isActive]);

  const goFullscreen = () => {
    const v = ref.current;
    if (!v) return;
    if (v.requestFullscreen) v.requestFullscreen();
    else if ((v as any).webkitRequestFullscreen) (v as any).webkitRequestFullscreen();
  };

  return (
    <div
      onClick={onActivate}
      style={{
        border: `1px solid ${isActive ? C.gold : C.border}`,
        borderRadius: 12, overflow: "hidden", cursor: "pointer",
        transition: "all 0.3s ease",
        transform: isActive ? "scale(1.02)" : "scale(1)",
        boxShadow: isActive ? `0 6px 24px ${C.goldGlow}` : "none",
        opacity: isActive ? 1 : 0.65,
        position: "relative", zIndex: isActive ? 2 : 1,
      }}
    >
      <video ref={ref} src={src} loop={false} muted={muted} playsInline onEnded={onEnded} style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", backgroundColor: "#000", display: "block" }} />
      {isActive && (
        <div style={{ position: "absolute", top: 8, left: 8 }}>
          <span style={{ background: C.gold, color: "#0A0700", fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 20, letterSpacing: "0.1em", fontFamily: "'DM Sans', sans-serif" }}>▶ PLAYING</span>
        </div>
      )}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 55%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: 8, left: 8, right: 8, display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 4 }}>
        <p style={{ color: C.goldLight, fontSize: 10, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif" }}>{label}</p>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {[{ label: muted ? "🔇" : "🔊", onClick: (e: React.MouseEvent) => { e.stopPropagation(); setMuted(!muted); } }, { label: "⛶", onClick: (e: React.MouseEvent) => { e.stopPropagation(); goFullscreen(); } }].map((btn) => (
            <button key={btn.label} onClick={btn.onClick} style={{ background: "rgba(0,0,0,0.75)", border: `1px solid ${C.border}`, color: C.goldLight, fontSize: 11, padding: "3px 7px", borderRadius: 8, cursor: "pointer", backdropFilter: "blur(4px)" }}>{btn.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function VideoSection({ C }: { C: typeof DARK }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const handleEnded = () => setActiveIndex((prev) => (prev + 1) % VIDEOS.length);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-10">
      {VIDEOS.map((v, i) => (
        <VideoCard key={v.src} src={v.src} label={v.label} isActive={i === activeIndex} onActivate={() => setActiveIndex(i)} onEnded={handleEnded} C={C} />
      ))}
    </div>
  );
}

export default function ShopPage() {
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const { user } = useAuth() as any;
  const qc = useQueryClient();

  const [isDark, setIsDark] = useState<boolean>(() => {
    try { return localStorage.getItem("amira-theme") !== "light"; }
    catch { return true; }
  });

  const [nlName, setNlName] = useState("");
  const [nlEmail, setNlEmail] = useState("");
  const [nlLoading, setNlLoading] = useState(false);
  const [nlStatus, setNlStatus] = useState<"idle" | "success" | "already" | "error">("idle");

  const C = isDark ? DARK : LIGHT;

  useEffect(() => {
    const preconnect1 = document.createElement("link");
    preconnect1.rel = "preconnect"; preconnect1.href = "https://fonts.googleapis.com";
    document.head.appendChild(preconnect1);
    const preconnect2 = document.createElement("link");
    preconnect2.rel = "preconnect"; preconnect2.href = "https://fonts.gstatic.com";
    preconnect2.crossOrigin = "anonymous"; document.head.appendChild(preconnect2);
    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href = "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&family=Cinzel+Decorative:wght@400;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&family=Scheherazade+New:wght@400;700&display=swap";
    document.head.appendChild(fontLink);

    const styleEl = document.createElement("style");
    styleEl.id = "amira-luxury-styles-v4";
    styleEl.textContent = `
      @keyframes goldShimmer {
        0%   { background-position: -300% center; }
        100% { background-position:  300% center; }
      }
      @keyframes goldPulse {
        0%, 100% { filter: drop-shadow(0 0  8px rgba(212,168,32,0.45)); }
        50%       { filter: drop-shadow(0 0 28px rgba(212,168,32,0.9)) drop-shadow(0 0 60px rgba(240,200,64,0.35)); }
      }
      @keyframes arabicGlow {
        0%, 100% {
          text-shadow: 0 0 10px rgba(212,168,32,0.55), 0 0 22px rgba(240,200,64,0.2);
          filter: brightness(1);
        }
        50% {
          text-shadow: 0 0 22px rgba(212,168,32,1), 0 0 55px rgba(240,200,64,0.55), 0 0 90px rgba(212,168,32,0.25);
          filter: brightness(1.15);
        }
      }
      @keyframes shimmerSweep {
        0%   { transform: translateX(-220%) skewX(-20deg); opacity: 0; }
        20%  { opacity: 1; }
        100% { transform: translateX(220%) skewX(-20deg); opacity: 0; }
      }
      @keyframes marqueeLeft  { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      @keyframes marqueeRight { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
      @keyframes borderGlow {
        0%, 100% { box-shadow: 0 0 20px rgba(212,168,32,0.15); }
        50%       { box-shadow: 0 0 40px rgba(212,168,32,0.45), 0 0 80px rgba(240,200,64,0.15); }
      }
      @keyframes dropIn {
        from { opacity: 0; transform: translateY(-8px) scale(0.97); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
      .amira-gold-text {
        background: linear-gradient(90deg, #6B4F10, #C9991A, #F0C940, #FFEDA0, #F0C940, #C9991A, #6B4F10);
        background-size: 300% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: goldShimmer 5s linear infinite;
      }
      .amira-logo-pulse { animation: goldPulse 3.5s ease-in-out infinite; }
      .amira-arabic-glow { animation: arabicGlow 3.2s ease-in-out infinite; }
      .amira-card { transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease; }
      .amira-card:hover { transform: translateY(-4px); }
      .amira-btn { position: relative; overflow: hidden; }
      .amira-btn::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.22) 50%, transparent 100%); transform: translateX(-220%) skewX(-20deg); }
      .amira-btn:hover::after { animation: shimmerSweep 0.65s ease forwards; }
      .amira-marquee-l { display: flex; gap: 20px; animation: marqueeLeft 55s linear infinite; }
      .amira-marquee-r { display: flex; gap: 20px; animation: marqueeRight 60s linear infinite; }
      .amira-marquee-wrap:hover .amira-marquee-l,
      .amira-marquee-wrap:hover .amira-marquee-r { animation-play-state: paused; }
      .amira-cert { animation: borderGlow 4s ease-in-out infinite; }
      .amira-rule { height: 1px; background: linear-gradient(90deg, transparent, #D4A820, transparent); opacity: 0.35; border: none; margin: 0; }
      .amira-vbar { width: 3px; height: 22px; border-radius: 3px; background: linear-gradient(to bottom, #D4A820, #7A5C08); flex-shrink: 0; }
    `;
    document.head.appendChild(styleEl);
    return () => { const el = document.getElementById("amira-luxury-styles-v4"); if (el) el.remove(); };
  }, []);

  useEffect(() => {
    try { localStorage.setItem("amira-theme", isDark ? "dark" : "light"); } catch {}
  }, [isDark]);

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
    if (!user) { alert("Please sign in to add items to cart"); return; }
    await api.post("/cart", { productId, quantity: 1 });
    qc.invalidateQueries({ queryKey: ["cart"] });
  };

  const submitNewsletter = async () => {
    if (!nlName.trim() || !nlEmail.trim()) return;
    setNlLoading(true); setNlStatus("idle");
    try {
      const res = await api.post("/newsletter/subscribe", { name: nlName.trim(), email: nlEmail.trim() });
      const msg = res.data?.message;
      if (msg === "already_subscribed") { setNlStatus("already"); }
      else { setNlStatus("success"); setNlName(""); setNlEmail(""); }
    } catch { setNlStatus("error"); }
    finally { setNlLoading(false); }
  };

  const goldBtn = (disabled = false): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: 6,
    background: disabled ? C.cardBg : C.gold,
    color: disabled ? C.textMuted : C.btnTextColor,
    border: `1px solid ${disabled ? C.border : C.gold}`,
    borderRadius: 10, padding: "8px 16px", fontSize: 13, fontWeight: 600,
    cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1,
    fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.04em",
    transition: "all 0.2s ease", textDecoration: "none",
  });

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 16px", background: C.inputBg,
    border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14,
    outline: "none", fontFamily: "'DM Sans', sans-serif",
    transition: "border-color 0.2s ease", boxSizing: "border-box",
  };

  return (
    <div style={{ backgroundColor: C.pageBg, color: C.text, fontFamily: "'DM Sans', -apple-system, sans-serif", minHeight: "100vh", transition: "background-color 0.4s ease, color 0.4s ease" }}>
      <SEO title="Shop Premium Gold" description="Browse investment-grade gold bars, coins and bullion. Live spot prices. Secure shipping worldwide from Dubai." path="/" />

      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px 100px" }}>

        {/* ── Header ── */}
        <div style={{ paddingTop: 52 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>

            {/* Logo block */}
            <div>
              <div className="amira-logo-pulse" style={{ display: "inline-block" }}>
                <h1 className="amira-gold-text" style={{ fontFamily: "'Cinzel Decorative', 'Cormorant Garamond', Georgia, serif", fontSize: "clamp(18px, 3vw, 30px)", fontWeight: 700, letterSpacing: "0.07em", margin: 0, lineHeight: 1.2 }}>
                  ✦ AMIRA AL DAHAB ✦
                </h1>
              </div>
              <p
                className="amira-arabic-glow"
                style={{
                  fontFamily: "'Scheherazade New', 'Noto Naskh Arabic', 'Arabic Typesetting', serif",
                  color: C.gold, fontSize: 20, fontWeight: 700, letterSpacing: "0.04em",
                  marginTop: 4, marginBottom: 2, direction: "rtl", lineHeight: 1.3,
                }}
              >
                أميرة الذهب
              </p>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic", color: C.textSub, fontSize: 13, letterSpacing: "0.18em", marginTop: 2 }}>
                Premium Gold — Est. Dubai
              </p>
            </div>

            {/* Right controls — spot price + theme toggle only */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>

              {/* Spot price */}
              {price && (
                <div style={{ padding: "8px 16px", background: C.surfaceBg, border: `1px solid ${C.border}`, borderRadius: 12, display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <span style={{ color: C.textMuted }}>Spot</span>
                  <span style={{ color: C.gold, fontWeight: 600 }}>${parseFloat(price.perOz).toLocaleString()}/oz</span>
                  <span style={{ color: C.textMuted, fontSize: 11 }}>${parseFloat(price.perGram).toFixed(2)}/g</span>
                </div>
              )}

              {/* Theme toggle */}
              <button
                onClick={() => setIsDark(!isDark)}
                style={{ width: 42, height: 42, borderRadius: "50%", background: C.surfaceBg, border: `1px solid ${C.border}`, color: C.gold, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.3s ease", flexShrink: 0 }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.gold; (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 0 16px ${C.goldGlow}`; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}
              >
                {isDark ? <Sun size={17} /> : <Moon size={17} />}
              </button>
            </div>
          </div>
          <hr className="amira-rule" style={{ margin: "0 0 40px" }} />
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14">
          {STATS.map((stat) => (
            <div key={stat.label} className="amira-card" style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 18, padding: "22px 16px", textAlign: "center", boxShadow: C.shadow, cursor: "default" }}
              onMouseEnter={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = `${C.gold}55`; el.style.boxShadow = C.shadowHover; }}
              onMouseLeave={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = C.border; el.style.boxShadow = C.shadow; }}
            >
              <div style={{ fontSize: 30, marginBottom: 8 }}>{stat.icon}</div>
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 700, color: C.gold, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ color: C.textMuted, fontSize: 11, marginTop: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── Videos ── */}
        <VideoSection C={C} />

        {/* ── Search & Filter ── */}
        <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
            <Search style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: C.textMuted, pointerEvents: "none" }} size={16} />
            <input type="text" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ ...inputStyle, paddingLeft: 38 }} onFocus={(e) => (e.target.style.borderColor = C.gold)} onBlur={(e) => (e.target.style.borderColor = C.border)} />
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CATEGORIES.map((cat) => {
              const active = category === cat;
              return (
                <button key={cat} onClick={() => setCategory(cat)} className="amira-btn" style={{ padding: "9px 18px", borderRadius: 10, background: active ? C.gold : C.cardBg, border: `1px solid ${active ? C.gold : C.border}`, color: active ? C.btnTextColor : C.textSub, fontSize: 13, fontWeight: 500, cursor: "pointer", textTransform: "capitalize", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.04em", transition: "all 0.2s ease" }}
                  onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.borderColor = C.gold; }}
                  onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLButtonElement).style.borderColor = C.border; }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Product Grid ── */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse" style={{ background: C.cardBg, borderRadius: 18, height: 340, border: `1px solid ${C.border}` }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="amira-card" style={{ background: C.cardBg, border: `1px solid ${C.border}`, borderRadius: 18, overflow: "hidden", boxShadow: C.shadow }}
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = `${C.gold}50`; el.style.boxShadow = C.shadowHover; }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = C.border; el.style.boxShadow = C.shadow; }}
              >
                <Link href={`/products/${product.id}`}>
                  <div style={{ height: 200, overflow: "hidden", cursor: "pointer", background: isDark ? "#070A12" : "#F5EDD8" }}>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s ease", display: "block" }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLImageElement).style.transform = "scale(1.06)")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLImageElement).style.transform = "scale(1)")}
                      />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52 }}>🥇</div>
                    )}
                  </div>
                </Link>
                <div style={{ padding: "16px 18px 20px" }}>
                  <span style={{ fontSize: 9, color: C.gold, textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 700 }}>{product.category} · {product.purity}</span>
                  <Link href={`/products/${product.id}`}>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, fontWeight: 600, color: C.text, margin: "5px 0 2px", lineHeight: 1.35, cursor: "pointer", transition: "color 0.2s ease" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLHeadingElement).style.color = C.gold)}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLHeadingElement).style.color = C.text)}
                    >{product.name}</h3>
                  </Link>
                  <p style={{ color: C.textMuted, fontSize: 12, margin: 0 }}>{parseFloat(product.weight_grams).toFixed(1)}g</p>
                  {(reviewsSummary[product.id]?.count ?? 0) > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 7 }}>
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} size={11} style={{ color: s <= Math.round(reviewsSummary[product.id].avgRating) ? C.gold : C.starEmpty, fill: s <= Math.round(reviewsSummary[product.id].avgRating) ? C.gold : "transparent" }} />
                      ))}
                      <span style={{ fontSize: 11, color: C.textMuted }}>({reviewsSummary[product.id].count})</span>
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14 }}>
                    <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 700, color: C.gold, lineHeight: 1 }}>${parseFloat(product.price_usd).toLocaleString()}</span>
                    <button onClick={() => addToCart(product.id)} disabled={!product.in_stock} className="amira-btn" style={goldBtn(!product.in_stock)}>
                      <ShoppingCart size={13} />Add
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && products.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0", color: C.textMuted, fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontStyle: "italic" }}>No products found.</div>
        )}

        {/* ── Certificate ── */}
        <div style={{ marginTop: 88, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ color: C.textMuted, fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: 8 }}>Official Documentation</p>
            <p className="amira-gold-text" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 700, margin: 0 }}>Verified Gold Owner</p>
          </div>
          <div className="amira-cert" style={{ maxWidth: 390, width: "100%", borderRadius: 20, overflow: "hidden", border: `1px solid ${C.gold}50` }}>
            <img src="https://i.imgur.com/KFi4n7z.jpeg" alt="Gold Ownership Certificate — Amira Aldahab" style={{ width: "100%", display: "block" }} />
          </div>
          <p style={{ color: C.textSub, fontSize: 13, textAlign: "center", fontStyle: "italic", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            Amira Aldahab — Certified 1kg Fine Gold Owner · Serial AA01357
          </p>
        </div>

        {/* ── Testimonials ── */}
        <div style={{ marginTop: 88 }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <p style={{ color: C.gold, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.28em", marginBottom: 10 }}>What Our Investors Say</p>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(24px, 4vw, 36px)", fontWeight: 600, color: C.text, margin: 0 }}>Trusted by Thousands Worldwide</h2>
          </div>
          <div className="amira-marquee-wrap" style={{ overflow: "hidden", marginBottom: 16 }}>
            <div className="amira-marquee-l">
              {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => <TestimonialCard key={`l-${i}`} t={t} C={C} />)}
            </div>
          </div>
          <div className="amira-marquee-wrap" style={{ overflow: "hidden" }}>
            <div className="amira-marquee-r">
              {[...TESTIMONIALS.slice(4), ...TESTIMONIALS.slice(0, 4), ...TESTIMONIALS.slice(4), ...TESTIMONIALS.slice(0, 4)].map((t, i) => <TestimonialCard key={`r-${i}`} t={t} C={C} />)}
            </div>
          </div>
        </div>

        {/* ── Newsletter ── */}
        <div style={{ marginTop: 88 }}>
          <div style={{ borderRadius: 24, border: `1px solid ${C.gold}30`, background: isDark ? "linear-gradient(145deg, #0F1420 0%, #0A0D18 50%, #0F1420 100%)" : "linear-gradient(145deg, #FFFCF5 0%, #FDF8EC 50%, #FFFCF5 100%)", padding: "64px 40px", textAlign: "center", position: "relative", overflow: "hidden", boxShadow: `0 0 120px ${C.goldGlow}` }}>
            <div style={{ position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)", width: 400, height: 400, background: `radial-gradient(circle, ${C.goldGlow} 0%, transparent 65%)`, pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: isDark ? "rgba(212,168,32,0.08)" : "rgba(184,136,10,0.08)", border: `1px solid ${C.gold}40`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 22px" }}>
                <Mail size={24} style={{ color: C.gold }} />
              </div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 32, fontWeight: 600, color: C.gold, margin: "0 0 10px" }}>Stay Ahead of the Market</h2>
              <p style={{ color: C.textSub, fontSize: 15, maxWidth: 440, margin: "0 auto 36px", lineHeight: 1.75 }}>Get weekly gold market updates, price alerts, and exclusive investment insights delivered to your inbox.</p>
              {nlStatus === "success" ? (
                <div style={{ background: isDark ? "rgba(16,185,129,0.08)" : "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 14, padding: "20px 32px", maxWidth: 480, margin: "0 auto" }}>
                  <p style={{ color: "#10B981", fontWeight: 600, margin: "0 0 4px" }}>🎉 You're in! Welcome to the Amira Al Dahab community.</p>
                  <p style={{ color: C.textMuted, fontSize: 12, margin: 0 }}>Check your inbox for a welcome message.</p>
                </div>
              ) : nlStatus === "already" ? (
                <div style={{ background: isDark ? "rgba(212,168,32,0.07)" : "rgba(184,136,10,0.07)", border: `1px solid ${C.gold}25`, borderRadius: 14, padding: "20px 32px", maxWidth: 480, margin: "0 auto" }}>
                  <p style={{ color: C.gold, fontWeight: 600, margin: "0 0 4px" }}>✓ You're already subscribed!</p>
                  <p style={{ color: C.textMuted, fontSize: 12, margin: 0 }}>You'll keep receiving our gold market updates.</p>
                </div>
              ) : (
                <div style={{ maxWidth: 520, margin: "0 auto" }}>
                  <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                    <input type="text" placeholder="Your name" value={nlName} onChange={(e) => setNlName(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 140 }} onFocus={(e) => (e.target.style.borderColor = C.gold)} onBlur={(e) => (e.target.style.borderColor = C.border)} />
                    <input type="email" placeholder="Your email address" value={nlEmail} onChange={(e) => setNlEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitNewsletter()} style={{ ...inputStyle, flex: 1, minWidth: 180 }} onFocus={(e) => (e.target.style.borderColor = C.gold)} onBlur={(e) => (e.target.style.borderColor = C.border)} />
                  </div>
                  <button onClick={submitNewsletter} disabled={nlLoading || !nlName.trim() || !nlEmail.trim()} className="amira-btn" style={{ width: "100%", padding: "14px", borderRadius: 10, background: C.gold, color: C.btnTextColor, border: "none", fontSize: 14, fontWeight: 600, cursor: nlLoading || !nlName.trim() || !nlEmail.trim() ? "not-allowed" : "pointer", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.05em", opacity: nlLoading || !nlName.trim() || !nlEmail.trim() ? 0.5 : 1, transition: "opacity 0.2s ease" }}>
                    {nlLoading ? "Subscribing…" : "Get Gold Market Updates →"}
                  </button>
                  {nlStatus === "error" && <p style={{ color: "#F87171", fontSize: 12, marginTop: 8 }}>Something went wrong. Please try again.</p>}
                  <p style={{ color: C.textMuted, fontSize: 12, marginTop: 12 }}>No spam, ever. Unsubscribe anytime.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── About ── */}
        <div style={{ marginTop: 100, paddingTop: 80, borderTop: `1px solid ${C.border}` }}>
          <div style={{ borderRadius: 22, marginBottom: 64, background: isDark ? "linear-gradient(145deg, #0A0D18 0%, #111827 50%, #0A0D18 100%)" : "linear-gradient(145deg, #FDF8EC 0%, #FFFCF5 50%, #FDF8EC 100%)", border: `1px solid ${C.border}`, padding: "64px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", bottom: -60, left: "50%", transform: "translateX(-50%)", width: 350, height: 350, background: `radial-gradient(circle, ${C.goldGlow} 0%, transparent 65%)`, pointerEvents: "none" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: 60, marginBottom: 18 }}>🏅</div>
              <h2 className="amira-gold-text" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(22px, 3.5vw, 32px)", fontWeight: 700, margin: "0 0 14px" }}>Born from a Passion for Gold</h2>
              <p style={{ color: C.textSub, maxWidth: 540, margin: "0 auto", lineHeight: 1.85, fontSize: 16 }}>Founded in Dubai — the world's gold capital — Amira Al Dahab was built to make premium gold investment accessible to everyone, everywhere.</p>
            </div>
          </div>

          <div style={{ maxWidth: 760, margin: "0 auto" }}>
            {[
              { title: "Our Story", paragraphs: ['Amira Al Dahab — meaning "Amira of Gold" in Arabic — was established with a single mission: to give everyday investors direct access to real, certified gold at transparent prices.', "Rooted in Dubai's thriving gold trade and inspired by the region's deep cultural connection to precious metals, we bridge the gap between traditional gold markets and modern digital investment."] },
              { title: "Why Gold?", paragraphs: ["Gold has preserved wealth for thousands of years. It hedges against inflation, protects against currency collapse, and remains one of the most liquid assets in the world. In uncertain times, gold endures. We believe everyone deserves a piece of that security."] },
              { title: "Based in Dubai", paragraphs: ["Dubai is home to the famous Gold Souk — one of the largest gold markets in the world. Our roots in this city give us unparalleled access to certified refineries, competitive pricing, and a deep understanding of the global gold trade."] },
              { title: "Our Commitment", paragraphs: ["Transparency, security, and trust are at the core of everything we do. We publish live gold prices, provide full product documentation, and are always available to answer your questions. Your wealth is safe with us."] },
            ].map((section) => (
              <div key={section.title} style={{ marginBottom: 52 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                  <div className="amira-vbar" />
                  <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 600, color: C.gold, margin: 0 }}>{section.title}</h2>
                </div>
                {section.paragraphs.map((p, i) => <p key={i} style={{ color: C.textSub, lineHeight: 1.9, fontSize: 15, marginBottom: 12 }}>{p}</p>)}
              </div>
            ))}

            <div style={{ marginBottom: 52 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <div className="amira-vbar" />
                <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 600, color: C.gold, margin: 0 }}>Why Amira Al Dahab?</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {FEATURES.map((item) => (
                  <div key={item.title} className="amira-card" style={{ border: `1px solid ${C.border}`, borderRadius: 16, padding: 22, background: C.cardBg, boxShadow: C.shadow }}
                    onMouseEnter={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = `${C.gold}45`; el.style.boxShadow = C.shadowHover; }}
                    onMouseLeave={(e) => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = C.border; el.style.boxShadow = C.shadow; }}
                  >
                    <div style={{ fontSize: 26, marginBottom: 10 }}>{item.icon}</div>
                    <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, fontWeight: 600, color: C.text, marginBottom: 6 }}>{item.title}</div>
                    <div style={{ color: C.textMuted, fontSize: 13, lineHeight: 1.65 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ border: `1px solid ${C.gold}30`, borderRadius: 22, padding: "52px 40px", textAlign: "center", background: isDark ? "linear-gradient(145deg, #0A0D18, #111827)" : "linear-gradient(145deg, #FFFCF5, #FDF8EC)", maxWidth: 700, margin: "0 auto", boxShadow: `0 0 100px ${C.goldGlow}` }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 28, fontWeight: 600, color: C.gold, margin: "0 0 10px" }}>Ready to Start Investing?</h3>
            <p style={{ color: C.textSub, fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>Browse our certified gold collection or start with a fractional investment today.</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
              <Link href="/invest"><span className="amira-btn" style={{ ...goldBtn(false), padding: "12px 34px", fontSize: 14, borderRadius: 11 }}>Invest Now →</span></Link>
              <Link href="/wallet">
                <span style={{ display: "inline-block", padding: "12px 34px", borderRadius: 11, border: `1px solid ${C.gold}50`, color: C.gold, fontWeight: 500, fontSize: 14, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textDecoration: "none", transition: "background 0.2s ease" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLSpanElement).style.background = isDark ? "rgba(212,168,32,0.07)" : "rgba(184,136,10,0.07)")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLSpanElement).style.background = "transparent")}
                >Deposit Crypto</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
