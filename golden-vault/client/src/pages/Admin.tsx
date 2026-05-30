import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";

type Order = {
  id: number;
  user_id: string;
  user_email: string;
  user_name: string;
  total_usd: string;
  status: string;
  shipping_address: any;
  created_at: string;
};

type SupabaseUser = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

type KycRequest = {
  id: string;
  user_id: string;
  full_name: string;
  country: string;
  id_type: string;
  id_number: string;
  selfie_note: string | null;
  status: "pending" | "approved" | "rejected";
  admin_note: string | null;
  submitted_at: string;
  reviewed_at: string | null;
};

type Subscriber = {
  id: number;
  name: string;
  email: string;
  active: boolean;
  created_at: string;
};

type Withdrawal = {
  id: number;
  user_id: string;
  amount_usd: number;
  crypto_address: string;
  network: string;
  currency: string;
  status: string;
  admin_note: string | null;
  created_at: string;
};

const ALL_STATUSES = ["confirmed", "pending", "processing", "shipped", "delivered"] as const;

const STATUS_COLORS: Record<string, string> = {
  confirmed: "text-blue-400",
  pending: "text-yellow-400",
  processing: "text-orange-400",
  shipped: "text-purple-400",
  delivered: "text-green-400",
};

const KYC_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  approved: "bg-green-500/10 text-green-400 border border-green-500/20",
  rejected: "bg-red-500/10 text-red-400 border border-red-500/20",
};

const W_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  approved: "bg-green-500/10 text-green-400 border border-green-500/20",
  rejected: "bg-red-500/10 text-red-400 border border-red-500/20",
};

type Tab = "orders" | "users" | "kyc" | "newsletter" | "withdrawals";

export default function Admin() {
  const [tab, setTab] = useState<Tab>("orders");
  const { user } = useAuth();
  const qc = useQueryClient();

  // KYC action state
  const [kycNote, setKycNote] = useState<Record<string, string>>({});

  const ordersQuery = useQuery<Order[]>({
    queryKey: ["admin-orders"],
    queryFn: () => api.get("/admin/orders").then(r => r.data),
    retry: false,
    enabled: !!user,
  });

  const usersQuery = useQuery<SupabaseUser[]>({
    queryKey: ["admin-users"],
    queryFn: () => api.get("/admin/users").then(r => r.data),
    retry: false,
    enabled: tab === "users" && !!user,
  });

  const kycQuery = useQuery<KycRequest[]>({
    queryKey: ["admin-kyc"],
    queryFn: () => api.get("/kyc/admin/all").then(r => r.data),
    retry: false,
    enabled: tab === "kyc" && !!user,
  });

  const newsletterQuery = useQuery<Subscriber[]>({
    queryKey: ["admin-newsletter"],
    queryFn: () => api.get("/newsletter/subscribers").then(r => r.data),
    retry: false,
    enabled: tab === "newsletter" && !!user,
  });

  const withdrawalsQuery = useQuery<Withdrawal[]>({
    queryKey: ["admin-withdrawals"],
    queryFn: () => api.get("/admin/withdrawals").then(r => r.data),
    retry: false,
    enabled: tab === "withdrawals" && !!user,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.patch(`/admin/orders/${id}`, { status }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-orders"] }),
  });

  const updateKyc = useMutation({
    mutationFn: ({ id, status, adminNote }: { id: string; status: string; adminNote?: string }) =>
      api.patch(`/kyc/${id}`, { status, adminNote }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-kyc"] }),
  });

  const updateWithdrawal = useMutation({
    mutationFn: ({ id, status, adminNote }: { id: number; status: string; adminNote?: string }) =>
      api.patch(`/withdrawals/${id}`, { status, adminNote }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-withdrawals"] }),
  });

  if (ordersQuery.error) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-yellow-500 mb-2">Access Denied</h1>
          <p className="text-stone-400">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const orders = ordersQuery.data ?? [];
  const users = usersQuery.data ?? [];
  const kyc = kycQuery.data ?? [];
  const subscribers = newsletterQuery.data ?? [];
  const withdrawals = withdrawalsQuery.data ?? [];
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_usd), 0);

  const exportCsv = () => {
    const rows = [
      ["Name", "Email", "Subscribed"],
      ...subscribers.map(s => [s.name, s.email, new Date(s.created_at).toLocaleDateString()]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "newsletter_subscribers.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: "orders", label: "Orders", count: orders.length },
    { key: "users", label: "Users" },
    { key: "kyc", label: "KYC", count: kyc.filter(k => k.status === "pending").length },
    { key: "withdrawals", label: "Withdrawals", count: withdrawals.filter(w => w.status === "pending").length },
    { key: "newsletter", label: "Newsletter", count: subscribers.length },
  ];

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <div className="border-b border-stone-800 bg-stone-900/50 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-xl">⚙️</div>
            <div>
              <h1 className="text-xl font-bold text-yellow-500">Admin Panel</h1>
              <p className="text-stone-500 text-xs">Amira Al Dahab — Internal Dashboard</p>
            </div>
          </div>
          <a href="/" className="text-stone-400 hover:text-stone-200 text-sm transition-colors">← Back to site</a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
            <p className="text-stone-500 text-xs uppercase tracking-wider mb-1">Total Orders</p>
            <p className="text-3xl font-bold text-yellow-500">{orders.length}</p>
          </div>
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
            <p className="text-stone-500 text-xs uppercase tracking-wider mb-1">Revenue</p>
            <p className="text-3xl font-bold text-yellow-500">${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
            <p className="text-stone-500 text-xs uppercase tracking-wider mb-1">Subscribers</p>
            <p className="text-3xl font-bold text-yellow-500">{subscribers.length > 0 ? subscribers.length : "—"}</p>
          </div>
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
            <p className="text-stone-500 text-xs uppercase tracking-wider mb-1">Pending KYC</p>
            <p className="text-3xl font-bold text-yellow-500">{kyc.filter(k => k.status === "pending").length || "—"}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-stone-800 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${tab === t.key ? "border-yellow-500 text-yellow-500" : "border-transparent text-stone-400 hover:text-stone-200"}`}>
              {t.label}{t.count !== undefined && t.count > 0 ? ` (${t.count})` : ""}
            </button>
          ))}
        </div>

        {/* ── Orders Tab ── */}
        {tab === "orders" && (
          <>
            {ordersQuery.isLoading && <p className="text-stone-500 py-8 text-center">Loading orders…</p>}
            {!ordersQuery.isLoading && orders.length === 0 && <p className="text-stone-500 py-8 text-center">No orders yet.</p>}
            {orders.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-stone-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-stone-900/80 text-stone-400 text-xs uppercase tracking-wider">
                      <th className="px-4 py-3 text-left">Order</th>
                      <th className="px-4 py-3 text-left">Customer</th>
                      <th className="px-4 py-3 text-left">Location</th>
                      <th className="px-4 py-3 text-left">Payment</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/50">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-stone-900/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-yellow-500 font-bold">#{order.id}</td>
                        <td className="px-4 py-3 text-stone-200">{order.user_name || order.shipping_address?.name || "—"}</td>
                        <td className="px-4 py-3 text-stone-400">{order.shipping_address?.city}, {order.shipping_address?.country}</td>
                        <td className="px-4 py-3 text-stone-400 capitalize">{order.shipping_address?.paymentMethod || "—"}</td>
                        <td className="px-4 py-3 text-right font-bold text-yellow-500">${Number(order.total_usd).toFixed(2)}</td>
                        <td className="px-4 py-3 text-stone-500 text-xs whitespace-nowrap">{new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                        <td className="px-4 py-3">
                          <select value={order.status} onChange={(e) => updateStatus.mutate({ id: order.id, status: e.target.value })}
                            className={`text-xs rounded-lg px-2.5 py-1.5 border border-stone-700 bg-stone-800 focus:outline-none focus:border-yellow-500 cursor-pointer ${STATUS_COLORS[order.status] ?? "text-stone-300"}`}>
                            {ALL_STATUSES.map((s) => (
                              <option key={s} value={s} className="bg-stone-800 text-stone-200">{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── Users Tab ── */}
        {tab === "users" && (
          <>
            {usersQuery.isLoading && <p className="text-stone-500 py-8 text-center">Loading users…</p>}
            {!usersQuery.isLoading && users.length === 0 && <p className="text-stone-500 py-8 text-center">No users found.</p>}
            {users.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-stone-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-stone-900/80 text-stone-400 text-xs uppercase tracking-wider">
                      <th className="px-4 py-3 text-left">Name</th>
                      <th className="px-4 py-3 text-left">Email</th>
                      <th className="px-4 py-3 text-left">User ID</th>
                      <th className="px-4 py-3 text-left">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/50">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-stone-900/30 transition-colors">
                        <td className="px-4 py-3 text-stone-200">{u.name}</td>
                        <td className="px-4 py-3 text-stone-300">{u.email}</td>
                        <td className="px-4 py-3 font-mono text-stone-600 text-xs">{u.id.slice(0, 20)}…</td>
                        <td className="px-4 py-3 text-stone-500 text-xs">{new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── KYC Tab ── */}
        {tab === "kyc" && (
          <>
            {kycQuery.isLoading && <p className="text-stone-500 py-8 text-center">Loading KYC requests…</p>}
            {!kycQuery.isLoading && kyc.length === 0 && <p className="text-stone-500 py-8 text-center">No KYC requests yet.</p>}
            {kyc.length > 0 && (
              <div className="space-y-4">
                {kyc.map((k) => (
                  <div key={k.id} className="bg-stone-900 border border-stone-800 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <p className="text-stone-100 font-semibold">{k.full_name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${KYC_COLORS[k.status]}`}>
                            {k.status.charAt(0).toUpperCase() + k.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-stone-400 text-sm">{k.country} · {k.id_type.replace("_", " ")} · {k.id_number}</p>
                        <p className="text-stone-600 text-xs font-mono">{k.user_id}</p>
                        {k.selfie_note && <p className="text-stone-500 text-xs italic">Note: {k.selfie_note}</p>}
                        {k.admin_note && <p className="text-amber-400/80 text-xs">Admin note: {k.admin_note}</p>}
                        <p className="text-stone-600 text-xs">Submitted {new Date(k.submitted_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                      </div>
                      {k.status === "pending" && (
                        <div className="flex flex-col gap-2 min-w-[200px]">
                          <input
                            type="text"
                            placeholder="Admin note (optional)"
                            value={kycNote[k.id] ?? ""}
                            onChange={e => setKycNote(n => ({ ...n, [k.id]: e.target.value }))}
                            className="px-3 py-1.5 bg-stone-800 border border-stone-700 rounded-lg text-stone-200 text-xs focus:outline-none focus:border-yellow-500"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateKyc.mutate({ id: k.id, status: "approved", adminNote: kycNote[k.id] })}
                              className="flex-1 px-3 py-1.5 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg text-xs font-medium hover:bg-green-500/20 transition-colors">
                              ✓ Approve
                            </button>
                            <button
                              onClick={() => updateKyc.mutate({ id: k.id, status: "rejected", adminNote: kycNote[k.id] })}
                              className="flex-1 px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs font-medium hover:bg-red-500/20 transition-colors">
                              ✕ Reject
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Withdrawals Tab ── */}
        {tab === "withdrawals" && (
          <>
            {withdrawalsQuery.isLoading && <p className="text-stone-500 py-8 text-center">Loading withdrawals…</p>}
            {!withdrawalsQuery.isLoading && withdrawals.length === 0 && <p className="text-stone-500 py-8 text-center">No withdrawal requests yet.</p>}
            {withdrawals.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-stone-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-stone-900/80 text-stone-400 text-xs uppercase tracking-wider">
                      <th className="px-4 py-3 text-left">ID</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-left">Currency</th>
                      <th className="px-4 py-3 text-left">Address</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Status</th>
                      <th className="px-4 py-3 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800/50">
                    {withdrawals.map((w) => (
                      <tr key={w.id} className="hover:bg-stone-900/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-yellow-500 font-bold">#{w.id}</td>
                        <td className="px-4 py-3 text-right font-bold text-red-400">${Number(w.amount_usd).toFixed(2)}</td>
                        <td className="px-4 py-3 text-stone-300">{w.currency} · {w.network}</td>
                        <td className="px-4 py-3 font-mono text-stone-500 text-xs">{w.crypto_address.slice(0, 12)}…{w.crypto_address.slice(-6)}</td>
                        <td className="px-4 py-3 text-stone-500 text-xs whitespace-nowrap">{new Date(w.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${W_STATUS_COLORS[w.status] ?? "bg-stone-700/40 text-stone-400 border border-stone-700"}`}>
                            {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {w.status === "pending" && (
                            <div className="flex gap-2">
                              <button onClick={() => updateWithdrawal.mutate({ id: w.id, status: "approved" })}
                                className="px-2.5 py-1 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg text-xs hover:bg-green-500/20 transition-colors">
                                Approve
                              </button>
                              <button onClick={() => updateWithdrawal.mutate({ id: w.id, status: "rejected" })}
                                className="px-2.5 py-1 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs hover:bg-red-500/20 transition-colors">
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ── Newsletter Tab ── */}
        {tab === "newsletter" && (
          <>
            {newsletterQuery.isLoading && <p className="text-stone-500 py-8 text-center">Loading subscribers…</p>}
            {!newsletterQuery.isLoading && subscribers.length === 0 && <p className="text-stone-500 py-8 text-center">No subscribers yet.</p>}
            {subscribers.length > 0 && (
              <>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-stone-400 text-sm">{subscribers.length} subscriber{subscribers.length !== 1 ? "s" : ""}</p>
                  <button onClick={exportCsv}
                    className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-lg text-sm font-medium hover:bg-yellow-500/20 transition-colors">
                    ↓ Export CSV
                  </button>
                </div>
                <div className="overflow-x-auto rounded-xl border border-stone-800">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-stone-900/80 text-stone-400 text-xs uppercase tracking-wider">
                        <th className="px-4 py-3 text-left">Name</th>
                        <th className="px-4 py-3 text-left">Email</th>
                        <th className="px-4 py-3 text-left">Status</th>
                        <th className="px-4 py-3 text-left">Subscribed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/50">
                      {subscribers.map((s) => (
                        <tr key={s.id} className="hover:bg-stone-900/30 transition-colors">
                          <td className="px-4 py-3 text-stone-200">{s.name}</td>
                          <td className="px-4 py-3 text-stone-300">{s.email}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.active ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-stone-700/40 text-stone-500 border border-stone-700"}`}>
                              {s.active ? "Active" : "Unsubscribed"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-stone-500 text-xs">{new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
