import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import { TrendingUp, Calculator, RefreshCw, Trash2 } from "lucide-react";
import { useAuth } from "../lib/auth";
import { Link } from "wouter";
import SEO from "../components/SEO";

interface RecurringPlan {
  id: number;
  amount_usd: number;
  frequency: "weekly" | "monthly";
  next_run_at: string;
  active: boolean;
  created_at: string;
}

export default function InvestPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [calcAmount, setCalcAmount] = useState("");

  // DCA state
  const [dcaAmount, setDcaAmount] = useState("");
  const [dcaFrequency, setDcaFrequency] = useState<"weekly" | "monthly">("monthly");
  const [dcaError, setDcaError] = useState<string | null>(null);
  const [dcaSuccess, setDcaSuccess] = useState(false);

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

  const { data: recurringPlans = [], isLoading: recurringLoading } = useQuery<RecurringPlan[]>({
    queryKey: ["recurring"],
    queryFn: () => api.get("/recurring").then((r) => r.data),
    enabled: !!user,
  });

  const createRecurring = useMutation({
    mutationFn: (body: { amountUsd: number; frequency: "weekly" | "monthly" }) =>
      api.post("/recurring", body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring"] });
      setDcaAmount("");
      setDcaError(null);
      setDcaSuccess(true);
      setTimeout(() => setDcaSuccess(false), 3000);
    },
    onError: (e: any) => {
      setDcaError(e.response?.data?.error || "Failed to set up plan");
    },
  });

  const cancelRecurring = useMutation({
    mutationFn: (id: number) => api.delete(`/recurring/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recurring"] }),
  });

  const submitDca = () => {
    const amt = parseFloat(dcaAmount);
    if (!amt || amt < 10) {
      setDcaError("Minimum recurring investment is $10");
      return;
    }
    setDcaError(null);
    createRecurring.mutate({ amountUsd: amt, frequency: dcaFrequency });
  };

  const balance = wallet ? parseFloat(wallet.balanceUsd ?? "0") : 0;
  const amountNum = parseFloat(amount) || 0;
  const gramsEstimate = price ? amountNum / parseFloat(price.perGram) : 0;
  const insufficientFunds = amountNum > 0 && amountNum > balance;
  const belowMinimum = amountNum > 0 && amountNum < 10;

  const calcNum = parseFloat(calcAmount) || 0;
  const calcGrams = price ? calcNum / parseFloat(price.perGram) : 0;
  const calcOz = calcGrams / 31.1035;
  const calcKg = calcGrams / 1000;

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
  const calcPresets = [50, 100, 500, 1000, 5000];
  const activePlan = recurringPlans.find((p) => p.active);

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <SEO title="Gold Investment Plans" description="Grow your wealth with gold. Explore fractional gold investment plans with Amira Al Dahab." />
        <TrendingUp size={40} className="mx-auto mb-4 text-gold-500 opacity-70" />
        <p className="text-stone-400 mb-4">Sign in to invest in gold</p>
        <Link href="/sign-in"><button className="btn-gold">Sign In</button></Link>
        {price && (
          <div className="mt-16 text-left">
            <GoldCalculator
              price={price}
              calcAmount={calcAmount}
              setCalcAmount={setCalcAmount}
              calcNum={calcNum}
              calcGrams={calcGrams}
              calcOz={calcOz}
              calcKg={calcKg}
              calcPresets={calcPresets}
            />
          </div>
        )}
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

      {/* One-time invest form */}
      <div className="card p-5">
        <label className="block text-sm text-stone-400 mb-2">Investment Amount (USD)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">$</span>
          <input
            type="number" min="10" step="10" value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className={`w-full pl-7 pr-4 py-3 bg-stone-800 border rounded-lg text-stone-100 text-lg focus:outline-none transition-colors ${insufficientFunds ? "border-red-500 focus:border-red-400" : "border-stone-700 focus:border-gold-500"}`}
          />
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => setAmount(p.toString())}
              className={`px-3 py-1 bg-stone-800 border rounded text-sm transition-colors ${p > balance ? "border-stone-700 text-stone-600 cursor-not-allowed" : "border-stone-700 hover:border-gold-500 text-stone-400"}`}
            >
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

        <button
          onClick={handleInvest}
          disabled={loading || amountNum < 10 || insufficientFunds}
          className="w-full btn-gold py-3 mt-4 text-base disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Processing..." : insufficientFunds ? "Insufficient Funds — Deposit to Continue" : `Invest $${amountNum > 0 ? amountNum.toLocaleString() : "—"}`}
        </button>
      </div>

      {/* Gold Calculator */}
      {price && (
        <GoldCalculator
          price={price}
          calcAmount={calcAmount}
          setCalcAmount={setCalcAmount}
          calcNum={calcNum}
          calcGrams={calcGrams}
          calcOz={calcOz}
          calcKg={calcKg}
          calcPresets={calcPresets}
        />
      )}

      {/* ── DCA / Recurring Investment ── */}
      <div className="mt-8 card p-5 border-gold-500/20">
        <div className="flex items-center gap-2 mb-1">
          <RefreshCw size={18} className="text-gold-400" />
          <h2 className="text-gold-400 font-semibold">Auto-Invest (DCA)</h2>
        </div>
        <p className="text-stone-500 text-xs mb-5">
          Set up automatic weekly or monthly gold purchases. Funds are deducted from your wallet balance on each cycle.
        </p>

        {/* Active plan display */}
        {activePlan ? (
          <div className="mb-5 p-4 rounded-xl border border-gold-500/30 bg-gold-500/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-stone-300 text-sm font-medium">
                  Active Plan — <span className="text-gold-400">${parseFloat(String(activePlan.amount_usd)).toLocaleString()}</span> / {activePlan.frequency}
                </p>
                <p className="text-stone-500 text-xs mt-1">
                  Next run: {new Date(activePlan.next_run_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <button
                onClick={() => cancelRecurring.mutate(activePlan.id)}
                disabled={cancelRecurring.isPending}
                className="flex items-center gap-1 text-red-400 hover:text-red-300 text-xs border border-red-500/30 rounded-lg px-3 py-1.5 transition-colors"
              >
                <Trash2 size={13} /> Cancel
              </button>
            </div>
          </div>
        ) : null}

        {/* Setup form */}
        <div className="space-y-4">
          <div>
            <label className="block text-stone-400 text-sm mb-2">Amount per cycle (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">$</span>
              <input
                type="number"
                min="10"
                value={dcaAmount}
                onChange={(e) => setDcaAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-7 pr-4 py-3 bg-stone-800 border border-stone-700 rounded-lg text-stone-100 focus:outline-none focus:border-gold-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-400 text-sm mb-2">Frequency</label>
            <div className="flex gap-2">
              {(["weekly", "monthly"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setDcaFrequency(f)}
                  className={`flex-1 py-2.5 rounded-lg text-sm border capitalize transition-colors ${
                    dcaFrequency === f
                      ? "bg-gold-500 text-stone-900 border-gold-500 font-semibold"
                      : "border-stone-700 text-stone-400 hover:border-gold-500"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {price && dcaAmount && parseFloat(dcaAmount) >= 10 && (
            <div className="p-3 bg-stone-800/50 rounded-lg border border-stone-700 text-xs text-stone-400">
              ≈ <span className="text-gold-400 font-medium">
                {(parseFloat(dcaAmount) / parseFloat(price.perGram)).toFixed(4)}g
              </span> of gold per {dcaFrequency} at current prices
            </div>
          )}

          {dcaError && (
            <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {dcaError}
            </div>
          )}
          {dcaSuccess && (
            <div className="text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
              ✓ Auto-invest plan activated! Your first purchase runs in one {dcaFrequency === "weekly" ? "week" : "month"}.
            </div>
          )}

          <button
            onClick={submitDca}
            disabled={createRecurring.isPending || !dcaAmount || parseFloat(dcaAmount) < 10}
            className="w-full btn-gold py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createRecurring.isPending
              ? "Activating…"
              : activePlan
              ? "Replace Current Plan"
              : "Activate Auto-Invest"}
          </button>
        </div>
      </div>
      {/* ── End DCA ── */}

    </div>
  );
}

// ── Gold Calculator Component ──────────────────────────────
function GoldCalculator({
  price, calcAmount, setCalcAmount, calcNum, calcGrams, calcOz, calcKg, calcPresets,
}: {
  price: { perGram: string; perOz: string };
  calcAmount: string;
  setCalcAmount: (v: string) => void;
  calcNum: number;
  calcGrams: number;
  calcOz: number;
  calcKg: number;
  calcPresets: number[];
}) {
  return (
    <div className="mt-8 card p-5 border-gold-500/20">
      <div className="flex items-center gap-2 mb-4">
        <Calculator size={18} className="text-gold-400" />
        <h2 className="text-gold-400 font-semibold">Gold Calculator</h2>
      </div>
      <p className="text-stone-500 text-xs mb-4">How much gold can your money buy? Enter any USD amount to find out.</p>

      <div className="relative mb-3">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">$</span>
        <input
          type="number" min="0" value={calcAmount}
          onChange={(e) => setCalcAmount(e.target.value)}
          placeholder="Enter USD amount..."
          className="w-full pl-7 pr-4 py-3 bg-stone-800 border border-stone-700 rounded-lg text-stone-100 text-lg focus:outline-none focus:border-gold-500 transition-colors"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {calcPresets.map((p) => (
          <button
            key={p}
            onClick={() => setCalcAmount(p.toString())}
            className="px-3 py-1 bg-stone-800 border border-stone-700 hover:border-gold-500 text-stone-400 rounded text-sm transition-colors"
          >
            ${p.toLocaleString()}
          </button>
        ))}
      </div>

      {calcNum > 0 ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-stone-800/60 rounded-xl p-4 text-center border border-stone-700">
              <div className="text-gold-400 font-bold text-lg">{calcGrams.toFixed(3)}</div>
              <div className="text-stone-500 text-xs mt-1">grams</div>
            </div>
            <div className="bg-stone-800/60 rounded-xl p-4 text-center border border-stone-700">
              <div className="text-gold-400 font-bold text-lg">{calcOz.toFixed(4)}</div>
              <div className="text-stone-500 text-xs mt-1">troy oz</div>
            </div>
            <div className="bg-stone-800/60 rounded-xl p-4 text-center border border-stone-700">
              <div className="text-gold-400 font-bold text-lg">{calcKg.toFixed(4)}</div>
              <div className="text-stone-500 text-xs mt-1">kilograms</div>
            </div>
          </div>
          <div className="p-3 bg-gold-500/10 rounded-lg border border-gold-500/20 text-sm text-gold-300 text-center">
            Based on live spot price of <span className="font-semibold">${parseFloat(price.perGram).toFixed(2)}/g</span>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-stone-600 text-sm">
          Enter an amount above to see how much gold you can buy
        </div>
      )}
    </div>
  );
}
