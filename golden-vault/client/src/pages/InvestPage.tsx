import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { TrendingUp } from "lucide-react";
import { useAuth } from "../lib/auth";
import { Link } from "wouter";
import SEO from "../components/SEO";

export default function InvestPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const { data: price } = useQuery({
    queryKey: ["price"],
    queryFn: () => api.get("/price").then((r) => r.data),
    refetchInterval: 30_000,
  });

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: () => api.get("/investments/wallet").then((r) => r.data),
    enabled: !!user,
  });

  const balance = wallet ? parseFloat(wallet.balanceUsd ?? "0") : 0;
  const amountNum = parseFloat(amount) || 0;
  const gramsEstimate = price ? amountNum / parseFloat(price.perGram) : 0;

  const insufficientFunds = amountNum > 0 && amountNum > balance;
  const belowMinimum = amountNum > 0 && amountNum < 10;

  const handleInvest = async () => {
    if (amountNum < 10) { alert("Minimum investment is $10"); return; }
    if (insufficientFunds) { alert("Insufficient funds. Please deposit to continue."); return; }
    setLoading(true);
    try {
      await api.post("/investments", { amountUsd: amountNum });
      qc.invalidateQueries({ queryKey: ["investments"] });
      qc.invalidateQueries({ queryKey: ["wallet"] });
      setAmount("");
      alert(`Investment confirmed! You acquired ${gramsEstimate.toFixed(4)}g of gold.`);
    } catch {
      alert("Investment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const presets = [100, 500, 1000, 5000, 10000];

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <SEO title="Gold Investment Plans" description="Grow your wealth with gold. Explore fractional gold investment plans with Amira Al Dahab." />
        <TrendingUp size={40} className="mx-auto mb-4 text-gold-500 opacity-70" />
        <p className="text-stone-400 mb-4">Sign in to invest in gold</p>
        <Link href="/sign-in"><button className="btn-gold">Sign In</button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <SEO title="Gold Investment Plans" description="Grow your wealth with gold. Explore fractional gold investment plans with Amira Al Dahab." />

      <h1 className="text-2xl font-serif text-gold-400 mb-2">Invest in Gold</h1>
      <p className="text-stone-400 mb-8 text-sm">Buy fractional gold by USD amount. Holdings tracked as grams at current spot price.</p>

      {price && (
        <div className="card p-4 mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-stone-500 uppercase tracking-wide">Live Spot Price</div>
            <div className="text-gold-400 text-xl font-semibold mt-0.5">${parseFloat(price.perGram).toFixed(4)}/g</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-stone-500 uppercase tracking-wide">Per Troy Oz</div>
            <div className="text-stone-200 font-medium mt-0.5">${parseFloat(price.perOz).toLocaleString()}</div>
          </div>
        </div>
      )}

      <div className={`card p-4 mb-6 flex items-center justify-between ${insufficientFunds ? "border-red-500/50" : ""}`}>
        <div>
          <div className="text-xs text-stone-500 uppercase tracking-wide">Your Wallet Balance</div>
          <div className={`text-xl font-semibold mt-0.5 ${insufficientFunds ? "text-red-400" : "text-stone-100"}`}>
            ${balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          {insufficientFunds && <div className="text-red-400 text-xs mt-1">⚠ Insufficient funds</div>}
        </div>
        <Link href="/wallet">
          <span className="text-xs text-gold-400 hover:underline cursor-pointer border border-gold-500/30 rounded-lg px-3 py-1.5 hover:bg-stone-800 transition-colors">+ Deposit</span>
        </Link>
      </div>

      <div className="card p-5">
        <label className="block text-sm text-stone-400 mb-2">Investment Amount (USD)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">$</span>
          <input type="number" min="10" step="10" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className={`w-full pl-7 pr-4 py-3 bg-stone-800 border rounded-lg text-stone-100 text-lg focus:outline-none transition-colors ${insufficientFunds ? "border-red-500 focus:border-red-400" : "border-stone-700 focus:border-gold-500"}`} />
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {presets.map((p) => (
            <button key={p} onClick={() => setAmount(p.toString())} className={`px-3 py-1 bg-stone-800 border rounded text-sm transition-colors ${p > balance ? "border-stone-700 text-stone-600 cursor-not-allowed" : "border-stone-700 hover:border-gold-500 text-stone-400"}`}>
              ${p.toLocaleString()}
            </button>
          ))}
        </div>

        {amountNum > 0 && !insufficientFunds && !belowMinimum && (
          <div className="mt-4 p-3 bg-gold-500/10 rounded-lg border border-gold-500/20">
            <div className="text-sm text-gold-300">You will receive approximately <span className="font-semibold">{gramsEstimate.toFixed(4)}g</span> of gold</div>
          </div>
        )}

        {belowMinimum && (
          <div className="mt-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
            <div className="text-sm text-red-400">Minimum investment is $10</div>
          </div>
        )}

        {insufficientFunds && (
          <div className="mt-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
            <div className="text-sm text-red-400 font-medium">Insufficient funds — you need ${(amountNum - balance).toFixed(2)} more</div>
            <Link href="/wallet"><span className="text-xs text-gold-400 hover:underline cursor-pointer mt-1 block">Deposit to your wallet →</span></Link>
          </div>
        )}

        <button onClick={handleInvest} disabled={loading || amountNum < 10 || insufficientFunds} className="w-full btn-gold py-3 mt-4 text-base disabled:opacity-60 disabled:cursor-not-allowed">
          {loading ? "Processing..." : insufficientFunds ? "Insufficient Funds — Deposit to Continue" : `Invest $${amountNum > 0 ? amountNum.toLocaleString() : "—"}`}
        </button>
      </div>
    </div>
  );
}
