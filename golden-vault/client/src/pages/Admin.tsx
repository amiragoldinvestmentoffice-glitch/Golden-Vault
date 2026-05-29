import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";

type Order = {
  id: number;
  userId: string;
  totalUsd: string;
  status: string;
  shippingName: string;
  shippingCity: string;
  shippingCountry: string;
  paymentMethod: string;
  createdAt: string;
};

type ClerkUser = {
  id: string;
  email: string;
  name: string;
  createdAt: number;
};

const ALL_STATUSES = ["confirmed", "pending", "processing", "shipped", "delivered"] as const;

const STATUS_COLORS: Record<string, string> = {
  confirmed: "text-blue-400",
  pending: "text-yellow-400",
  processing: "text-orange-400",
  shipped: "text-purple-400",
  delivered: "text-green-400",
};

export default function Admin() {
  const [tab, setTab] = useState<"orders" | "users">("orders");
  const { getToken } = useAuth();
  const qc = useQueryClient();

  const authFetch = async (url: string, options?: RequestInit) => {
    const token = await getToken();
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options?.headers ?? {}),
      },
    });
    if (res.status === 403) throw new Error("FORBIDDEN");
    if (!res.ok) throw new Error("Failed");
    return res.json();
  };

  const ordersQuery = useQuery<Order[]>({
    queryKey: ["admin-orders"],
    queryFn: () => authFetch("/api/admin/orders"),
    retry: false,
  });

  const usersQuery = useQuery<ClerkUser[]>({
    queryKey: ["admin-users"],
    queryFn: () => authFetch("/api/admin/users"),
    retry: false,
    enabled: tab === "users",
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      authFetch(`/api/admin/orders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-orders"] }),
  });

  if (ordersQuery.error?.message === "FORBIDDEN") {
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
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalUsd), 0);

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
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
            <p className="text-stone-500 text-xs uppercase tracking-wider mb-1">Total Orders</p>
            <p className="text-3xl font-bold text-yellow-500">{orders.length}</p>
          </div>
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
            <p className="text-stone-500 text-xs uppercase tracking-wider mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-yellow-500">${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
            <p className="text-stone-500 text-xs uppercase tracking-wider mb-1">Registered Users</p>
            <p className="text-3xl font-bold text-yellow-500">{users.length > 0 ? users.length : "—"}</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 border-b border-stone-800">
          {(["orders", "users"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-5 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${tab === t ? "border-yellow-500 text-yellow-500" : "border-transparent text-stone-400 hover:text-stone-200"}`}>
              {t}{t === "orders" ? ` (${orders.length})` : ""}
            </button>
          ))}
        </div>

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
                        <td className="px-4 py-3 text-stone-200">{order.shippingName}</td>
                        <td className="px-4 py-3 text-stone-400">{order.shippingCity}, {order.shippingCountry}</td>
                        <td className="px-4 py-3 text-stone-400 capitalize">{order.paymentMethod}</td>
                        <td className="px-4 py-3 text-right font-bold text-yellow-500">${Number(order.totalUsd).toFixed(2)}</td>
                        <td className="px-4 py-3 text-stone-500 text-xs whitespace-nowrap">{new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                        <td className="px-4 py-3">
                          <select value={order.status} onChange={(e) => updateStatus.mutate({ id: order.id, status: e.target.value })} className={`text-xs rounded-lg px-2.5 py-1.5 border border-stone-700 bg-stone-800 focus:outline-none focus:border-yellow-500 cursor-pointer ${STATUS_COLORS[order.status] ?? "text-stone-300"}`}>
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
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-stone-900/30 transition-colors">
                        <td className="px-4 py-3 text-stone-200">{user.name}</td>
                        <td className="px-4 py-3 text-stone-300">{user.email}</td>
                        <td className="px-4 py-3 font-mono text-stone-600 text-xs">{user.id.slice(0, 20)}…</td>
                        <td className="px-4 py-3 text-stone-500 text-xs">{new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
