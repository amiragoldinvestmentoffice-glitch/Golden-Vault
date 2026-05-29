import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, BarChart2 } from "lucide-react";
import { useAuth } from "../lib/auth";
import { Link } from "wouter";

interface Summary {
  totalGrams: number;
  totalInvested: number;
  currentValue: number;
  gainLoss: number;
  gainLossPct: number;
  spotPricePerGram: number;
}

export default function PortfolioPage() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery<{ investments: unknown[]; summary: Summary }>({
    queryKey: ["investments"],
    queryFn: () => api.get("/investments").then((r) => r.data),
    enabled: !!user,
  });

  const { data: history = [] } = useQuery<Array<{ date: string; price: number }>>({
    queryKey: ["price-history"],
    queryFn: () => api.get("/investments/price-history").then((r) => r.data),
  });

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <BarChart2 size={40} className="mx-auto mb-4 text-gold-500 opacity-70" />
        <p className="text-stone-400 mb-4">Sign in to view your portfolio</p>
        <Link href="/sign-in"><button className="btn-gold">Sign In</button></Link>
      </div>
    );
  }

  const s = data?.summary;
  const gain = s && s.gainLoss >= 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-serif text-gold-400 mb-6">Gold Portfolio</h1>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map(i => <div key={i} className="card h-24 animate-pulse" />)}
        </div>
      ) : s ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            ["Total Grams", `${s.totalGrams.toFixed(4)}g`, null],
            ["Invested", `$${s.totalInvested.toLocaleString()}`, null],
            ["Current Value", `$${s.currentValue.toLocaleString()}`, null],
            ["Gain / Loss", `${gain ? "+" : ""}$${s.gainLoss.toFixed(2)}`, gain],
          ].map(([label, value, isGain]) => (
            <div key={label as string} className="card p-4">
              <div className="text-xs text-stone-500 uppercase tracking-wide">{label}</div>
              <div className={`text-lg font-semibold mt-1 ${isGain === null ? "text-stone-100" : isGain ? "text-emerald-400" : "text-red-400"}`}>
                {value}
              </div>
              {label === "Gain / Loss" && s && (
                <div className={`flex items-center gap-1 text-xs mt-0.5 ${gain ? "text-emerald-500" : "text-red-500"}`}>
                  {gain ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {s.gainLossPct.toFixed(2)}%
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-8 text-center text-stone-500 mb-6">
          No investments yet. <Link href="/invest"><a href="/invest" className="text-gold-400 hover:underline">Start investing →</a></Link>
        </div>
      )}

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
    </div>
  );
}
