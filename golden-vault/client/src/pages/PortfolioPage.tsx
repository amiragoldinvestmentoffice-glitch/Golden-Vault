import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, BarChart2, Bell, BellOff, Trash2, Plus, Copy, Check, Gift } from "lucide-react";
import { useAuth } from "../lib/auth";
import { Link } from "wouter";
import SEO from "../components/SEO";

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

interface PriceAlert {
  id: number;
  target_price_per_oz: number;
  direction: "above" | "below";
  triggered: boolean;
  triggered_at: string | null;
  created_at: string;
}

interface ReferralCode {
  code: string;
  user_id: string;
}

interface ReferralStats {
  totalReferred: number;
  totalEarned: number;
  pendingRewards: number;
}

const OZ_PER_GRAM = 31.1035;

export default function PortfolioPage() {
  const { user, session } = useAuth();
  const qc = useQueryClient();

  const [alertTarget, setAlertTarget] = useState("");
  const [alertDirection, setAlertDirection] = useState<"above" | "below">("above");
  const [alertError, setAlertError] = useState<string | null>(null);
  const [alertSuccess, setAlertSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: goldData, isLoading: goldLoading } = useQuery<{
    investments: unknown[];
    summary: GoldSummary;
  }>({
    queryKey: ["investments"],
    queryFn: () => api.get("/investments").then((r) => r.data),
    enabled: !!user,
  });

  const { data: history = [] } = useQuery<Array<{ date: string; price: number }>>({
    queryKey: ["price-history"],
    queryFn: () => api.get("/investments/price-history").then((r) => r.data),
  });

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

  const { data: btcPrice } = useQuery<{ price: number }>({
    queryKey: ["btc-price"],
    queryFn: async () => {
      const res = await fetch("https://api.coinbase.com/v2/prices/BTC-USD/spot");
      const d = await res.json();
      return { price: parseFloat(d.data?.amount || "0") };
    },
    refetchInterval: 60000,
  });

  const { data: price } = useQuery({
    queryKey: ["price"],
    queryFn: () => api.get("/price").then((r) => r.data),
    refetchInterval: 30_000,
  });

  const { data: alerts = [], isLoading: alertsLoading } = useQuery<PriceAlert[]>({
    queryKey: ["price-alerts"],
    queryFn: () => api.get("/price-alerts").then((r) => r.data),
    enabled: !!user,
    refetchInterval: 60_000,
  });

  const { data: referralCode } = useQuery<ReferralCode>({
    queryKey: ["referral-code"],
    queryFn: () => api.get("/referrals/my-code").then((r) => r.data),
    enabled: !!user,
  });

  const { data: referralStats } = useQuery<ReferralStats>({
    queryKey: ["referral-stats"],
    queryFn: () => api.get("/referrals/stats").then((r) => r.data),
    enabled: !!user,
  });

  const createAlert = useMutation({
    mutationFn: (body: { targetPricePerOz: number; direction: "above" | "below" }) =>
      api.post("/price-alerts", body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["price-alerts"] });
      setAlertTarget("");
      setAlertError(null);
      setAlertSuccess(true);
      setTimeout(() => setAlertSuccess(false), 3000);
    },
    onError: (e: any) => {
      setAlertError(e.response?.data?.error || "Failed to create alert");
    },
  });

  const deleteAlert = useMutation({
    mutationFn: (id: number) => api.delete(`/price-alerts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["price-alerts"] }),
  });

  const submitAlert = () => {
    const target = parseFloat(alertTarget);
    if (!target || target < 100) {
      setAlertError("Please enter a valid price above $100/oz");
      return;
    }
    setAlertError(null);
    createAlert.mutate({ targetPricePerOz: target, direction: alertDirection });
  };

  const referralLink = referralCode
    ? `${window.location.origin}/sign-in?ref=${referralCode.code}`
    : null;

  const copyReferralLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <SEO
          title="My Portfolio"
          description="Track your gold and Bitcoin investments in real time with Amira Al Dahab."
          path="/portfolio"
        />
        <BarChart2 size={40} className="mx-auto mb-4 text-gold-500 opacity-70" />
        <p className="text-stone-400 mb-4">Sign in to view your portfolio</p>
        <Link href="/sign-in"><button className="btn-gold">Sign In</button></Link>
      </div>
    );
  }

  const s = goldData?.summary;
  const goldGain = s && s.gainLoss >= 0;

  const confirmedBtcPayments = btcPayments.filter(
    (p) => p.status === "finished" || p.status === "confirmed"
  );
  const totalBtc = confirmedBtcPayments.reduce(
    (sum, p) => sum + (parseFloat(String(p.btc_purchased)) || 0), 0
  );
  const totalBtcInvested = confirmedBtcPayments.reduce(
    (sum, p) => sum + (parseFloat(String(p.amount_usd)) || 0), 0
  );
  const btcCurrentValue = totalBtc * (btcPrice?.price || 0);
  const btcGainLoss = btcCurrentValue - totalBtcInvested;
  const btcGainPct = totalBtcInvested > 0 ? (btcGainLoss / totalBtcInvested) * 100 : 0;
  const btcGain = btcGainLoss >= 0;

  const totalInvested = (s?.totalInvested || 0) + totalBtcInvested;
  const totalCurrentValue = (s?.currentValue || 0) + btcCurrentValue;
  const totalGainLoss = totalCurrentValue - totalInvested;
  const totalGainPct = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;
  const totalGain = totalGainLoss >= 0;

  const currentSpotPerOz = price ? parseFloat(price.perOz) : null;
  const activeAlerts = alerts.filter((a) => !a.triggered);
  const triggeredAlerts = alerts.filter((a) => a.triggered);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <SEO
        title="My Portfolio"
        description="Track your gold and Bitcoin investments in real time with Amira Al Dahab."
        path="/portfolio"
      />
      <h1 className="text-2xl font-serif text-gold-400">My Portfolio</h1>

      {/* ── TOTAL PORTFOLIO SUMMARY ── */}
      {totalInvested > 0 && (
        <div className="card p-5 border border-gold-500/20 bg-gold-500/5">
          <p className="text-xs text-stone-500 uppercase tracking-wider mb-3">Total Portfolio</p>
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
            {[1, 2, 3, 4].map((i) => <div key={i} className="card h-24 animate-pulse" />)}
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
            <Link href="/invest"><a className="text-gold-400 hover:underline">Start investing →</a></Link>
          </div>
        )}
      </div>

      {/* ── BTC SECTION ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl" style={{ color: "#F7931A" }}>₿</span>
          <h2 className="text-lg font-serif text-gold-400">Bitcoin Holdings</h2>
          {btcPrice && (
            <span className="ml-auto text-xs text-stone-500">BTC = ${btcPrice.price.toLocaleString()}</span>
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
            <Link href="/wallet"><a className="text-gold-400 hover:underline">Deposit crypto →</a></Link>
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
                  <p className="text-stone-200 text-sm">₿ {parseFloat(String(p.btc_purchased)).toFixed(8)}</p>
                  <p className="text-stone-500 text-xs">{new Date(p.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-stone-300 text-sm">${parseFloat(String(p.amount_usd)).toFixed(2)}</p>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">confirmed</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PRICE ALERTS ── */}
      <div className="card p-5 border border-stone-700/60">
        <div className="flex items-center gap-2 mb-1">
          <Bell size={18} className="text-gold-400" />
          <h2 className="font-semibold text-gold-400">Price Alerts</h2>
          {currentSpotPerOz && (
            <span className="ml-auto text-xs text-stone-500">
              Current: ${currentSpotPerOz.toLocaleString()}/oz
            </span>
          )}
        </div>
        <p className="text-stone-500 text-xs mb-5">
          Get notified when gold hits your target price. Alerts are checked every 5 minutes.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setAlertDirection("above")}
              className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                alertDirection === "above"
                  ? "bg-emerald-500/15 border-emerald-500/50 text-emerald-400"
                  : "border-stone-700 text-stone-400 hover:border-stone-500"
              }`}
            >
              ▲ Above
            </button>
            <button
              onClick={() => setAlertDirection("below")}
              className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                alertDirection === "below"
                  ? "bg-red-500/15 border-red-500/50 text-red-400"
                  : "border-stone-700 text-stone-400 hover:border-stone-500"
              }`}
            >
              ▼ Below
            </button>
          </div>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
            <input
              type="number"
              min="100"
              value={alertTarget}
              onChange={(e) => setAlertTarget(e.target.value)}
              placeholder="Target price per oz"
              className="w-full pl-7 pr-4 py-2 bg-stone-800 border border-stone-700 rounded-lg text-stone-100 text-sm focus:outline-none focus:border-gold-500 transition-colors"
            />
          </div>
          <button
            onClick={submitAlert}
            disabled={createAlert.isPending || !alertTarget}
            className="flex items-center gap-1.5 btn-gold px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <Plus size={15} />
            {createAlert.isPending ? "Setting…" : "Set Alert"}
          </button>
        </div>

        {alertError && (
          <div className="mb-4 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{alertError}</div>
        )}
        {alertSuccess && (
          <div className="mb-4 text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
            ✓ Alert set! We'll notify you when gold hits your target.
          </div>
        )}

        {alertsLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <div key={i} className="h-12 rounded-lg bg-stone-800 animate-pulse" />)}
          </div>
        ) : activeAlerts.length === 0 && triggeredAlerts.length === 0 ? (
          <div className="text-center py-8 text-stone-600 text-sm border border-stone-800 rounded-xl">
            No alerts set yet. Create one above.
          </div>
        ) : (
          <div className="space-y-2">
            {activeAlerts.length > 0 && (
              <>
                <p className="text-stone-500 text-xs uppercase tracking-wide mb-2">Active</p>
                {activeAlerts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-stone-800 bg-stone-900/50">
                    <div className="flex items-center gap-3">
                      <Bell size={14} className="text-gold-400 shrink-0" />
                      <div>
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded mr-2 ${
                          a.direction === "above" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
                        }`}>
                          {a.direction === "above" ? "▲ above" : "▼ below"}
                        </span>
                        <span className="text-stone-200 text-sm font-medium">
                          ${Number(a.target_price_per_oz).toLocaleString()}/oz
                        </span>
                      </div>
                    </div>
                    <button onClick={() => deleteAlert.mutate(a.id)} className="text-stone-600 hover:text-red-400 transition-colors p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </>
            )}
            {triggeredAlerts.length > 0 && (
              <>
                <p className="text-stone-500 text-xs uppercase tracking-wide mb-2 mt-4">Triggered</p>
                {triggeredAlerts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-stone-800 bg-stone-900/30 opacity-60">
                    <div className="flex items-center gap-3">
                      <BellOff size={14} className="text-stone-500 shrink-0" />
                      <div>
                        <span className="text-xs text-stone-500 mr-2">
                          {a.direction === "above" ? "▲ above" : "▼ below"}
                        </span>
                        <span className="text-stone-400 text-sm">
                          ${Number(a.target_price_per_oz).toLocaleString()}/oz
                        </span>
                        {a.triggered_at && (
                          <span className="ml-2 text-xs text-stone-600">
                            · hit {new Date(a.triggered_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => deleteAlert.mutate(a.id)} className="text-stone-700 hover:text-red-400 transition-colors p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── REFERRAL PROGRAM ── */}
      <div className="card p-5 border border-stone-700/60">
        <div className="flex items-center gap-2 mb-1">
          <Gift size={18} className="text-gold-400" />
          <h2 className="font-semibold text-gold-400">Refer & Earn</h2>
        </div>
        <p className="text-stone-500 text-xs mb-5">
          Earn <span className="text-gold-400 font-semibold">$10 wallet credit</span> for every friend who signs up and makes their first deposit.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Friends Referred", value: referralStats?.totalReferred ?? 0 },
            { label: "Pending Rewards", value: referralStats?.pendingRewards ?? 0 },
            { label: "Total Earned", value: `$${(referralStats?.totalEarned ?? 0).toFixed(2)}` },
          ].map((stat) => (
            <div key={stat.label} className="bg-stone-800/50 rounded-xl p-3 text-center border border-stone-700/40">
              <div className="text-gold-400 font-bold text-lg">{stat.value}</div>
              <div className="text-stone-500 text-xs mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {referralLink ? (
          <div>
            <p className="text-stone-400 text-xs mb-2 font-medium uppercase tracking-wider">Your Referral Link</p>
            <div className="flex items-center gap-2 bg-stone-800 border border-stone-700 rounded-lg px-4 py-3">
              <span className="text-stone-300 text-sm font-mono flex-1 truncate">{referralLink}</span>
              <button
                onClick={copyReferralLink}
                className="flex items-center gap-1 text-gold-400 hover:text-gold-300 text-xs transition-colors shrink-0"
              >
                {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy</>}
              </button>
            </div>
            <p className="text-stone-600 text-xs mt-2">
              Share this link — when your friend signs up and deposits, you both benefit.
            </p>
          </div>
        ) : (
          <div className="h-12 rounded-lg bg-stone-800 animate-pulse" />
        )}
      </div>

    </div>
  );
}
