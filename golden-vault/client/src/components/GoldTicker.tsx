import { useEffect, useState } from "react";

interface Prices {
  gold: number;
  silver: number;
  platinum: number;
}

export default function GoldTicker() {
  const [prices, setPrices] = useState<Prices | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("");

  const fetchPrices = async () => {
    try {
      const res = await fetch("/api/gold-price");
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.gold) {
        setPrices(data);
        setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="h-8 bg-stone-900 border-b border-stone-800 flex items-center justify-center">
        <span className="text-stone-600 text-xs animate-pulse">Fetching live prices…</span>
      </div>
    );
  }

  if (!prices || !prices.gold) return null;

  const fmt = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const metals = [
    { symbol: "XAU/USD", label: "GOLD", value: fmt(prices.gold) },
    { symbol: "XAG/USD", label: "SILVER", value: fmt(prices.silver) },
    { symbol: "XPT/USD", label: "PLATINUM", value: fmt(prices.platinum) },
  ];

  const row = [...metals, ...metals, ...metals, ...metals];

  return (
    <div className="relative bg-stone-900 border-b border-stone-800 h-9 flex items-center overflow-hidden">
      <div className="shrink-0 flex items-center gap-1.5 px-3 h-full border-r border-stone-800 bg-stone-900 z-10">
        <span className="w-1.5 h-1.5 bg-gold-400 rounded-full animate-pulse inline-block" />
        <span className="text-xs text-stone-400 uppercase tracking-widest font-semibold select-none">Live</span>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="flex items-center" style={{ width: "max-content", animation: "gold-ticker 30s linear infinite" }}>
          {row.map((m, i) => (
            <span key={i} className="flex items-center gap-2 px-8 whitespace-nowrap">
              <span className="text-stone-500 text-xs font-mono">{m.symbol}</span>
              <span className="text-gold-400 font-bold font-mono text-sm">{m.value}</span>
              <span className="text-stone-600 text-xs">/ troy oz</span>
              <span className="text-stone-800 ml-6 text-base">·</span>
            </span>
          ))}
        </div>
      </div>

      <div className="absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-stone-900 to-transparent pointer-events-none z-10" />

      {lastUpdated && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 hidden sm:block">
          <span className="text-stone-700 text-xs">↻ {lastUpdated}</span>
        </div>
      )}

      <style>{`
        @keyframes gold-ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
