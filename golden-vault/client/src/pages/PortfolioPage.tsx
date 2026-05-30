import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, BarChart2, Bitcoin } from "lucide-react";
import { useAuth } from "../lib/auth";
import { Link } from "wouter";

interface GoldSummary {
  totalGrams: number;
  totalInvested: number;
  currentValue: number;
  gainLoss: number;
  gainLossPct: number;
  spotPricePerGram: number;
}

interface BtcPayment {
  id: string;
  amount_usd: number;
  btc_purchased: number;
  status: string;
  created_at: string;
}

export default function PortfolioPage() {
  const { user, session } = useAuth();

  // Gold portfolio
  const { data: goldData, isLoading: goldLoading } = useQuery<{
    investments: unknown[];
    summary: GoldSummary;
  }>({
    queryKey: ["investments"],
    queryFn: () => api.get("/investments").then((r) => r.data),
    enabled: !!user,
  });

  // Gold price history
  const { data: history = [] } = useQuery<Array<{ date: string; price: number }>>({
    queryKey: ["price-history"],
    queryFn: () => api.get("/investments/price-history").then((r) => r.data),
  });

  // BTC payment history
  const { data: btcPayments = [] } = useQuery<BtcPayment[]>({
    queryKey: ["crypto-payments"],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL || ""}/api/payments/history`,
        { headers: { Authorization: `Bearer ${session?.access_token}` } }
      );
      return res.json();
    },
    enabled: !!user && !!session,
  });

  // BTC price (live)
  const { data: btcPrice } = useQuery<{ price: number }>({
    queryKey: ["btc-price"],
    queryFn: async () => {
      const res = await fetch(
        "https://api.coinbase.com/v2/prices/BTC-USD/spot"
      );
      const d = await res.json();
      return { price: parseFloat(d.data?.amount || "0") };
    },
    refetchInterval: 60000, // refresh every minute
  });

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <BarChart2 size={40} className="mx-auto mb-4 text-gold-500 opacity-70" />
        <p className="text-stone-400 mb-4">Sign in to view your portfolio</p>
        <Link href="/sign-in">
          <button className="btn-gold">Sign In</button>
        </Link>
      </div>
    );
  }

  const s = goldData?.summary;
  const goldGain = s && s.gainLoss >= 0;

  // BTC calculations
  const confirmedBtcPayments = btcPayments.filter(
    (p) => p.status === "finished" || p.status === "confirmed"
  );
  const totalBtc = confirmedBtcPayments.reduce(
    (sum, p) => sum + (parseFloat(String(p.btc_purchased)) || 0),
    0
  );
  const totalBtcInvested = confirmedBtcPayments.reduce(
    (sum, p) => sum + (parseFloat(String(p.amount_usd)) || 0),
    0
  );
  const btcCurrentValue = totalBtc * (btcPrice?.price || 0);
  const btcGainLoss = btcCurrentValue - totalBtcInvested;
  const btcGainPct =
    totalBtcInvested > 0 ? (btcGainLoss / totalBtcInvested) * 100 : 0;
  const btcGain = btcGainLoss >= 0;

  // Total portfolio
  const totalInvested = (s?.totalInvested || 0) + totalBtcInvested;
  const totalCurrentValue = (s?.currentValue || 0) + btcCurrentValue;
  const totalGainLoss = totalCurrentValue - totalInvested;
  const totalGainPct =
    totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;
  const totalGain = totalGainLoss >= 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-serif text-gold-400">My Portfolio</h1>

      {/* ── TOTAL PORTFOLIO SUMMARY ── */}
      {totalInvested > 0 && (
        <div className="card p-5 border border-gold-500/20 bg-gold-500/5">
          <p className="text-xs text-stone-500 uppercase tracking-wider mb-3">
            Total Portfolio
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-stone-400 text-xs mb-1">Invested</p>
              <p className="text-stone-100 text-lg font-semibold">
                ${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-stone-400 text-xs mb-1">Current Value</p>
              <p className="text-stone-100 text-lg font-semibold">
                ${totalCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-stone-400 text-xs mb-1">Total Gain / Loss</p>
              <p className={`text-lg font-semibold ${totalGain ? "text-emerald-400" : "text-red-400"}`}>
                {totalGain ? "+" : ""}${totalGainLoss.toFixed(2)}
              </p>
              <div className={`flex items-center gap-1 text-xs ${totalGain ? "text-emerald-500" : "text-red-500"}`}>
                {totalGain ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {totalGainPct.toFixed(2)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── GOLD SECTION ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🥇</span>
          <h2 className="text-lg font-serif text-gold-400">Gold Holdings</h2>
        </div>

        {goldLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card h-24 animate-pulse" />
            ))}
          </div>
        ) : s && s.totalInvested > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ["Total Grams", `${s.totalGrams.toFixed(4)}g`, null],
              ["Invested", `$${s.totalInvested.toLocaleString()}`, null],
              ["Current Value", `$${s.currentValue.toLocaleString()}`, null],
              ["Gain / Loss", `${goldGain ? "+" : ""}$${s.gainLoss.toFixed(2)}`, goldGain],
            ].map(([label, value, isGain]) => (
              <div key={label as string} className="card p-4">
                <div className="text-xs text-stone-500 uppercase tracking-wide">{label}</div>
                <div className={`text-lg font-semibold mt-1 ${isGain === null ? "text-stone-100" : isGain ? "text-emerald-400" : "text-red-400"}`}>
                  {value}
                </div>
                {label === "Gain / Loss" && s && (
                  <div className={`flex items-center gap-1 text-xs mt-0.5 ${goldGain ? "text-emerald-500" : "text-red-500"}`}>
                    {goldGain ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {s.gainLossPct.toFixed(2)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-6 text-center text-stone-500 border border-stone-700/40">
            No gold investments yet.{" "}
            <Link href="/invest">
              <a className="text-gold-400 hover:underline">Start investing →</a>
            </Link>
          </div>
        )}
      </div>

      {/* ── BTC SECTION ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl" style={{ color: "#F7931A" }}>₿</span>
          <h2 className="text-lg font-serif text-gold-400">Bitcoin Holdings</h2>
          {btcPrice && (
            <span className="ml-auto text-xs text-stone-500">
              BTC = ${btcPrice.price.toLocaleString()}
            </span>
          )}
        </div>

        {totalBtc > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              ["Total BTC", `₿ ${totalBtc.toFixed(8)}`, null],
              ["Invested", `$${totalBtcInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, null],
              ["Current Value", `$${btcCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, null],
              ["Gain / Loss", `${btcGain ? "+" : ""}$${btcGainLoss.toFixed(2)}`, btcGain],
            ].map(([label, value, isGain]) => (
              <div key={label as string} className="card p-4">
                <div className="text-xs text-stone-500 uppercase tracking-wide">{label}</div>
                <div className={`text-lg font-semibold mt-1 ${isGain === null ? "text-stone-100" : isGain ? "text-emerald-400" : "text-red-400"}`}>
                  {value}
                </div>
                {label === "Gain / Loss" && (
                  <div className={`flex items-center gap-1 text-xs mt-0.5 ${btcGain ? "text-emerald-500" : "text-red-500"}`}>
                    {btcGain ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {btcGainPct.toFixed(2)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-6 text-center text-stone-500 border border-stone-700/40">
            No BTC holdings yet.{" "}
            <Link href="/wallet">
              <a className="text-gold-400 hover:underline">Deposit crypto →</a>
            </Link>
          </div>
        )}
      </div>

      {/* ── GOLD PRICE CHART ── */}
      <div className="card p-5">
        <h2 className="font-medium text-stone-200 mb-4">30-Day Gold Price (USD/oz)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={history}>
            <defs>
              <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fill: "#78716c", fontSize: 11 }} tickFormatter={(d) => d.slice(5)} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#78716c", fontSize: 11 }} domain={["auto", "auto"]} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toLocaleString()}`} />
            <Tooltip contentStyle={{ background: "#1c1917", border: "1px solid #292524", borderRadius: 8 }} labelStyle={{ color: "#a8a29e" }} itemStyle={{ color: "#eab308" }} formatter={(v: number) => [`$${v.toLocaleString()}`, "Price"]} />
            <Area type="monotone" dataKey="price" stroke="#eab308" strokeWidth={2} fill="url(#goldGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── BTC TRANSACTION HISTORY ── */}
      {confirmedBtcPayments.length > 0 && (
        <div className="card p-5">
          <h2 className="font-medium text-stone-200 mb-4">BTC Deposit History</h2>
          <div className="space-y-2">
            {confirmedBtcPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-stone-800 last:border-0">
                <div>
                  <p className="text-stone-200 text-sm">
                    ₿ {parseFloat(String(p.btc_purchased)).toFixed(8)}
                  </p>
                  <p className="text-stone-500 text-xs">
                    {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-stone-300 text-sm">${parseFloat(String(p.amount_usd)).toFixed(2)}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    confirmed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
