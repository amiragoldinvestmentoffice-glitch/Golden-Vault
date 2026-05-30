import { useState, useEffect, useRef } from "react";
import { Copy, Check, Loader2, RefreshCw, ChevronRight, Shield, Zap, Clock, History, ArrowUpRight } from "lucide-react";
import { useAuth } from "../lib/auth";
import { Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";

const API_BASE = import.meta.env.VITE_API_URL || "";

const CURRENCIES = [
  { id: "USDTTRC20", label: "USDT", network: "TRC-20 (Tron)", icon: "₮", color: "#26A17B", popular: true },
  { id: "BTC",       label: "Bitcoin", network: "Bitcoin Network", icon: "₿", color: "#F7931A" },
  { id: "ETH",       label: "Ethereum", network: "ERC-20", icon: "Ξ", color: "#627EEA" },
];

const WITHDRAW_CURRENCIES = [
  { id: "USDTTRC20", label: "USDT TRC-20", network: "TRC-20 (Tron)" },
  { id: "BTC",       label: "Bitcoin",      network: "Bitcoin Network" },
  { id: "ETH",       label: "Ethereum",     network: "ERC-20" },
];

const PRESET_AMOUNTS = [50, 100, 250, 500, 1000];

type Step = "select" | "paying" | "confirmed";

interface PaymentData {
  paymentId: string;
  payAddress: string;
  payAmount: string;
  payCurrency: string;
  expiresAt: string;
}

interface Deposit {
  id: number;
  amount_usd: number;
  pay_currency: string;
  pay_amount: string;
  status: string;
  created_at: string;
}

interface Withdrawal {
  id: number;
  amount_usd: number;
  crypto_address: string;
  network: string;
  currency: string;
  status: string;
  admin_note: string | null;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: "bg-green-500/10 text-green-400 border border-green-500/20",
  finished:  "bg-green-500/10 text-green-400 border border-green-500/20",
  approved:  "bg-green-500/10 text-green-400 border border-green-500/20",
  waiting:   "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  pending:   "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  failed:    "bg-red-500/10 text-red-400 border border-red-500/20",
  rejected:  "bg-red-500/10 text-red-400 border border-red-500/20",
  expired:   "bg-stone-700/40 text-stone-500 border border-stone-700",
};

const STATUS_LABEL: Record<string, string> = {
  confirmed: "Confirmed",
  finished:  "Confirmed",
  approved:  "Approved",
  waiting:   "Pending",
  pending:   "Pending",
  failed:    "Failed",
  rejected:  "Rejected",
  expired:   "Expired",
};

const CURRENCY_ICON: Record<string, string> = {
  USDTTRC20: "₮",
  BTC: "₿",
  ETH: "Ξ",
};

export default function WalletPage() {
  const { user, session } = useAuth();
  const qc = useQueryClient();
  const [step, setStep]           = useState<Step>("select");
  const [amount, setAmount]       = useState<string>("100");
  const [currency, setCurrency]   = useState(CURRENCIES[0]);
  const [payment, setPayment]     = useState<PaymentData | null>(null);
  const [copied, setCopied]       = useState<"address" | "amount" | null>(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [timeLeft, setTimeLeft]   = useState<number | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const pollRef                   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Withdrawal form state
  const [wAmount, setWAmount]       = useState("");
  const [wAddress, setWAddress]     = useState("");
  const [wCurrency, setWCurrency]   = useState(WITHDRAW_CURRENCIES[0]);
  const [wLoading, setWLoading]     = useState(false);
  const [wError, setWError]         = useState<string | null>(null);
  const [wSuccess, setWSuccess]     = useState(false);

  // Fetch deposit history
  const { data: deposits = [], isLoading: depositsLoading } = useQuery<Deposit[]>({
    queryKey: ["deposits"],
    queryFn: () => api.get("/payments/history").then((r) => r.data),
    enabled: !!user,
    refetchInterval: 30_000,
  });

  // Fetch withdrawal history
  const { data: withdrawals = [], isLoading: withdrawalsLoading } = useQuery<Withdrawal[]>({
    queryKey: ["withdrawals"],
    queryFn: () => api.get("/withdrawals").then((r) => r.data),
    enabled: !!user,
    refetchInterval: 30_000,
  });

  // Countdown timer
  useEffect(() => {
    if (!payment?.expiresAt) return;
    const interval = setInterval(() => {
      const secs = Math.max(0, Math.floor((new Date(payment.expiresAt).getTime() - Date.now()) / 1000));
      setTimeLeft(secs);
      if (secs === 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [payment?.expiresAt]);

  // Poll payment status every 15s
  useEffect(() => {
    if (step !== "paying" || !payment) return;
    pollRef.current = setTimeout(async function poll() {
      try {
        const res = await fetch(`${API_BASE}/api/payments/status/${payment.paymentId}`, {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        const data = await res.json();
        if (data.payment_status === "finished" || data.payment_status === "confirmed") {
          setStep("confirmed");
          return;
        }
      } catch {}
      setPollCount(c => c + 1);
      pollRef.current = setTimeout(poll, 15000);
    }, 15000);
    return () => { if (pollRef.current) clearTimeout(pollRef.current); };
  }, [step, payment, pollCount]);

  const createPayment = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 10) { setError("Minimum deposit is $10"); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/payments/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ amountUsd: amt, payCurrency: currency.id }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Failed to create payment");
      }
      const data = await res.json();
      setPayment(data);
      setStep("paying");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const submitWithdrawal = async () => {
    const amt = parseFloat(wAmount);
    if (!amt || amt < 10) { setWError("Minimum withdrawal is $10"); return; }
    if (!wAddress.trim()) { setWError("Please enter your crypto address"); return; }
    setWLoading(true);
    setWError(null);
    try {
      await api.post("/withdrawals", {
        amountUsd: amt,
        cryptoAddress: wAddress.trim(),
        network: wCurrency.network,
        currency: wCurrency.id,
      });
      setWSuccess(true);
      setWAmount("");
      setWAddress("");
      qc.invalidateQueries({ queryKey: ["withdrawals"] });
    } catch (e: any) {
      setWError(e.response?.data?.error || e.message || "Withdrawal request failed");
    } finally {
      setWLoading(false);
    }
  };

  const copy = (text: string, key: "address" | "amount") => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const reset = () => {
    setStep("select");
    setPayment(null);
    setError(null);
    setTimeLeft(null);
    if (pollRef.current) clearTimeout(pollRef.current);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
      " · " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="text-stone-400 mb-4">Sign in to deposit funds</p>
        <Link href="/sign-in"><button className="btn-gold">Sign In</button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-serif text-gold-400 mb-1">Wallet</h1>
        <p className="text-stone-400 text-sm">
          Deposit or withdraw funds from your account
        </p>
      </div>

      {/* ── STEP 1: SELECT ── */}
      {step === "select" && (
        <div className="space-y-6">
          <div className="card p-6 border border-stone-700/60">
            <label className="block text-stone-300 text-sm font-medium mb-3">
              Deposit Amount (USD)
            </label>
            <div className="flex gap-2 mb-3 flex-wrap">
              {PRESET_AMOUNTS.map(p => (
                <button
                  key={p}
                  onClick={() => setAmount(String(p))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
                    amount === String(p)
                      ? "bg-gold-500 text-stone-900 border-gold-500"
                      : "border-stone-600 text-stone-400 hover:border-gold-500/50 hover:text-stone-200"
                  }`}
                >
                  ${p}
                </button>
              ))}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-medium">$</span>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min="10"
                className="w-full bg-stone-800/70 border border-stone-600 rounded-lg pl-8 pr-4 py-3 text-stone-100 focus:outline-none focus:border-gold-500 transition-colors"
                placeholder="Enter amount"
              />
            </div>
            {parseFloat(amount) < 10 && amount !== "" && (
              <p className="text-red-400 text-xs mt-1.5">Minimum deposit is $10</p>
            )}
          </div>

          <div className="card p-6 border border-stone-700/60">
            <label className="block text-stone-300 text-sm font-medium mb-3">Pay With</label>
            <div className="space-y-2">
              {CURRENCIES.map(c => (
                <button
                  key={c.id}
                  onClick={() => setCurrency(c)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                    currency.id === c.id
                      ? "border-gold-500/70 bg-gold-500/5"
                      : "border-stone-700/50 hover:border-stone-500"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl w-7 text-center" style={{ color: c.color }}>{c.icon}</span>
                    <div className="text-left">
                      <p className="text-stone-200 text-sm font-medium">{c.label}</p>
                      <p className="text-stone-500 text-xs">{c.network}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.popular && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gold-500/15 text-gold-400 border border-gold-500/30">
                        Lowest fees
                      </span>
                    )}
                    <div className={`w-4 h-4 rounded-full border-2 transition-all ${
                      currency.id === c.id ? "border-gold-500 bg-gold-500" : "border-stone-600"
                    }`} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={createPayment}
            disabled={loading || !amount || parseFloat(amount) < 10}
            className="w-full btn-gold py-3.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-base font-medium"
          >
            {loading ? (
              <><Loader2 size={18} className="animate-spin" /> Generating Address...</>
            ) : (
              <>Continue <ChevronRight size={18} /></>
            )}
          </button>

          <div className="flex items-center justify-center gap-6 text-stone-500 text-xs pt-2">
            <span className="flex items-center gap-1.5"><Shield size={12} /> Secure</span>
            <span className="flex items-center gap-1.5"><Zap size={12} /> Instant confirmation</span>
            <span className="flex items-center gap-1.5"><Clock size={12} /> 5–20 min processing</span>
          </div>
        </div>
      )}

      {/* ── STEP 2: PAYING ── */}
      {step === "paying" && payment && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
            <p className="text-amber-300 text-sm font-medium">Waiting for your payment…</p>
            {timeLeft !== null && timeLeft > 0 && (
              <span className="ml-auto text-amber-400/70 text-xs font-mono">{formatTime(timeLeft)}</span>
            )}
          </div>

          <div className="card p-6 border border-stone-700/60 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-stone-700/50">
              <div>
                <p className="text-stone-400 text-xs mb-0.5">You deposit</p>
                <p className="text-gold-400 text-2xl font-semibold">${parseFloat(amount).toLocaleString()}</p>
              </div>
              <ChevronRight size={20} className="text-stone-600" />
              <div className="text-right">
                <p className="text-stone-400 text-xs mb-0.5">You send</p>
                <p className="text-stone-100 text-xl font-semibold">
                  {payment.payAmount} <span style={{ color: currency.color }}>{currency.label}</span>
                </p>
                <p className="text-stone-500 text-xs">{currency.network}</p>
              </div>
            </div>

            <div>
              <p className="text-stone-400 text-xs mb-2 font-medium uppercase tracking-wider">Send exactly</p>
              <div className="flex items-center gap-2 bg-stone-800/70 rounded-lg px-4 py-3 border border-stone-700/50">
                <span className="text-stone-100 font-mono text-sm flex-1">{payment.payAmount} {currency.label}</span>
                <button
                  onClick={() => copy(payment.payAmount, "amount")}
                  className="flex items-center gap-1 text-gold-400 hover:text-gold-300 text-xs transition-colors"
                >
                  {copied === "amount" ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                </button>
              </div>
              <p className="text-amber-400/80 text-xs mt-1.5">⚠ Send the exact amount — under/over payments may delay processing</p>
            </div>

            <div>
              <p className="text-stone-400 text-xs mb-2 font-medium uppercase tracking-wider">To this address</p>
              <div className="bg-stone-800/70 rounded-lg px-4 py-3 border border-stone-700/50">
                <p className="text-stone-200 font-mono text-xs break-all leading-relaxed">{payment.payAddress}</p>
              </div>
              <button
                onClick={() => copy(payment.payAddress, "address")}
                className="mt-2 w-full flex items-center justify-center gap-2 btn-gold py-2.5 text-sm"
              >
                {copied === "address"
                  ? <><Check size={15} /> Address Copied!</>
                  : <><Copy size={15} /> Copy Address</>}
              </button>
            </div>

            <div className="bg-stone-800/40 rounded-lg px-3 py-2.5 border border-stone-700/30">
              <p className="text-stone-400 text-xs">
                <strong className="text-stone-300">Network:</strong> {currency.network} only.
                Sending on the wrong network will result in lost funds.
              </p>
            </div>
          </div>

          <div className="card p-5 border border-stone-700/40 bg-stone-800/20">
            <p className="text-stone-300 text-sm font-medium mb-3">What happens after you send?</p>
            <ol className="text-stone-400 text-sm space-y-1.5 list-decimal list-inside">
              <li>Network confirms your transaction (5–20 min)</li>
              <li>We automatically buy BTC on your behalf</li>
              <li>Your portfolio updates instantly</li>
            </ol>
          </div>

          <button
            onClick={reset}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-stone-400 hover:text-stone-200 text-sm transition-colors border border-stone-700/40 rounded-xl hover:border-stone-500"
          >
            <RefreshCw size={14} /> Start over
          </button>
        </div>
      )}

      {/* ── STEP 3: CONFIRMED ── */}
      {step === "confirmed" && (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto">
            <Check size={36} className="text-green-400" />
          </div>
          <div>
            <h2 className="text-2xl font-serif text-stone-100 mb-2">Payment Confirmed!</h2>
            <p className="text-stone-400">
              ${parseFloat(amount).toLocaleString()} has been received. BTC is being purchased and added to your portfolio.
            </p>
          </div>
          <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 text-sm text-stone-400">
            Your portfolio will reflect the new balance within a few minutes.
          </div>
          <div className="flex gap-3">
            <button onClick={reset} className="flex-1 py-3 border border-stone-600 rounded-xl text-stone-300 hover:border-stone-400 transition-colors text-sm">
              Make Another Deposit
            </button>
            <Link href="/portfolio" className="flex-1">
              <button className="w-full btn-gold py-3 text-sm">View Portfolio</button>
            </Link>
          </div>
        </div>
      )}

      {/* ── Withdrawal Form ── */}
      <div className="mt-14">
        <div className="flex items-center gap-2 mb-5">
          <ArrowUpRight size={18} className="text-gold-400" />
          <h2 className="text-gold-400 font-semibold">Request Withdrawal</h2>
        </div>

        {wSuccess ? (
          <div className="text-center py-10 border border-green-500/20 rounded-xl bg-green-500/5">
            <Check size={32} className="text-green-400 mx-auto mb-3" />
            <p className="text-stone-200 font-medium mb-1">Withdrawal Request Submitted</p>
            <p className="text-stone-500 text-sm">Our team will process your request within 24 hours.</p>
            <button
              onClick={() => setWSuccess(false)}
              className="mt-5 text-gold-400 text-sm hover:underline"
            >
              Submit another request
            </button>
          </div>
        ) : (
          <div className="card p-6 border border-stone-700/60 space-y-4">
            <p className="text-stone-400 text-xs">
              Withdrawals are processed manually within 24 hours. Minimum withdrawal is $10.
            </p>

            {/* Amount */}
            <div>
              <label className="block text-stone-300 text-sm font-medium mb-2">Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">$</span>
                <input
                  type="number"
                  min="10"
                  value={wAmount}
                  onChange={e => setWAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-4 py-3 bg-stone-800 border border-stone-700 rounded-lg text-stone-100 focus:outline-none focus:border-gold-500 transition-colors"
                />
              </div>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-stone-300 text-sm font-medium mb-2">Receive In</label>
              <div className="flex gap-2 flex-wrap">
                {WITHDRAW_CURRENCIES.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setWCurrency(c)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      wCurrency.id === c.id
                        ? "bg-gold-500 text-stone-900 border-gold-500"
                        : "border-stone-700 text-stone-400 hover:border-gold-500"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-stone-300 text-sm font-medium mb-2">
                Your {wCurrency.label} Address
              </label>
              <input
                type="text"
                value={wAddress}
                onChange={e => setWAddress(e.target.value)}
                placeholder={`Enter your ${wCurrency.network} address`}
                className="w-full px-4 py-3 bg-stone-800 border border-stone-700 rounded-lg text-stone-100 text-sm font-mono focus:outline-none focus:border-gold-500 transition-colors placeholder-stone-600"
              />
              <p className="text-stone-600 text-xs mt-1">
                Network: {wCurrency.network} — double-check your address before submitting.
              </p>
            </div>

            {wError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
                {wError}
              </div>
            )}

            <button
              onClick={submitWithdrawal}
              disabled={wLoading || !wAmount || parseFloat(wAmount) < 10 || !wAddress.trim()}
              className="w-full btn-gold py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {wLoading ? (
                <><Loader2 size={16} className="animate-spin" /> Submitting...</>
              ) : (
                <>Request Withdrawal <ArrowUpRight size={16} /></>
              )}
            </button>
          </div>
        )}
      </div>
      {/* ── End Withdrawal Form ── */}

      {/* ── Withdrawal History ── */}
      {withdrawals.length > 0 && (
        <div className="mt-10">
          <h3 className="text-stone-400 text-sm font-medium mb-3">Withdrawal Requests</h3>
          <div className="space-y-3">
            {withdrawals.map((w) => {
              const status = w.status?.toLowerCase() ?? "pending";
              const styleClass = STATUS_STYLES[status] ?? STATUS_STYLES["pending"];
              const label = STATUS_LABEL[status] ?? "Pending";
              const icon = CURRENCY_ICON[w.currency] ?? "◈";
              return (
                <div
                  key={w.id}
                  className="flex items-center justify-between px-4 py-4 rounded-xl border border-stone-800 bg-stone-900/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-sm font-bold text-red-400 shrink-0">
                      {icon}
                    </div>
                    <div>
                      <div className="text-stone-200 text-sm font-medium">{w.currency} · {w.network}</div>
                      <div className="text-stone-500 text-xs mt-0.5">{formatDate(w.created_at)}</div>
                      {w.admin_note && (
                        <div className="text-stone-500 text-xs mt-0.5 italic">Note: {w.admin_note}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <div className="text-red-400 font-semibold text-sm">
                      -${Number(w.amount_usd).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styleClass}`}>
                      {label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Deposit History ── */}
      <div className="mt-10">
        <div className="flex items-center gap-2 mb-5">
          <History size={18} className="text-gold-400" />
          <h2 className="text-gold-400 font-semibold">Deposit History</h2>
        </div>

        {depositsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-stone-900 animate-pulse border border-stone-800" />
            ))}
          </div>
        ) : deposits.length === 0 ? (
          <div className="text-center py-12 border border-stone-800 rounded-xl bg-stone-900/30">
            <p className="text-stone-500 text-sm">No deposits yet.</p>
            <p className="text-stone-600 text-xs mt-1">Your transaction history will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {deposits.map((d) => {
              const status = d.status?.toLowerCase() ?? "pending";
              const styleClass = STATUS_STYLES[status] ?? STATUS_STYLES["pending"];
              const label = STATUS_LABEL[status] ?? "Pending";
              const icon = CURRENCY_ICON[d.pay_currency] ?? "◈";
              return (
                <div
                  key={d.id}
                  className="flex items-center justify-between px-4 py-4 rounded-xl border border-stone-800 bg-stone-900/50 hover:border-stone-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-sm font-bold text-gold-400 shrink-0">
                      {icon}
                    </div>
                    <div>
                      <div className="text-stone-200 text-sm font-medium">{d.pay_currency}</div>
                      <div className="text-stone-500 text-xs mt-0.5">{formatDate(d.created_at)}</div>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <div className="text-gold-400 font-semibold text-sm">
                      +${Number(d.amount_usd).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styleClass}`}>
                      {label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
