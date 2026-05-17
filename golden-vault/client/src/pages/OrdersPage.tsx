import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Link } from "wouter";
import { useAuth, SignInButton } from "@clerk/clerk-react";
import { Package } from "lucide-react";

interface Order {
  id: number;
  status: string;
  totalUsd: string;
  createdAt: string;
  shippingCity: string;
  shippingCountry: string;
}

export default function OrdersPage() {
  const { isSignedIn } = useAuth();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["orders"],
    queryFn: () => api.get("/orders").then((r) => r.data),
    enabled: isSignedIn === true,
  });

  if (!isSignedIn) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="text-stone-400 mb-4">Sign in to view your orders</p>
        <SignInButton mode="modal">
          <button className="btn-gold">Sign In</button>
        </SignInButton>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-serif text-gold-400 mb-6">Order History</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="card h-20 animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-stone-500">
          <Package size={40} className="mx-auto mb-3 opacity-30" />
          <p className="mb-4">No orders yet</p>
          <Link href="/">
            <span className="btn-gold cursor-pointer">Start Shopping</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <div className="card p-4 hover:border-gold-500/50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-stone-100">Order #{order.id}</div>
                    <div className="text-stone-500 text-sm mt-0.5">
                      {order.shippingCity}, {order.shippingCountry} ·{" "}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-gold-400 font-semibold">
                      ${parseFloat(order.totalUsd).toLocaleString()}
                    </div>
                    <span className="text-xs text-emerald-400 uppercase tracking-wide">
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
