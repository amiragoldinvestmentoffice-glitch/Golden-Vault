import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { api } from "../lib/api";
import { CheckCircle, ArrowLeft } from "lucide-react";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => api.get(`/orders/${id}`).then((r) => r.data),
  });

  if (isLoading) return <div className="max-w-2xl mx-auto px-4 py-8"><div className="card h-60 animate-pulse" /></div>;
  if (!order) return <div className="max-w-2xl mx-auto px-4 py-8 text-center text-stone-400">Order not found</div>;

  const shipping = order.shipping_address ?? {};

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href="/orders">
        <span className="flex items-center gap-2 text-stone-400 hover:text-gold-400 mb-6 cursor-pointer text-sm">
          <ArrowLeft size={16} /> All Orders
        </span>
      </Link>

      <div className="card p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="text-emerald-400" size={24} />
          <div>
            <h1 className="text-xl font-serif text-stone-100">Order #{order.id} Confirmed</h1>
            <p className="text-stone-500 text-sm">{new Date(order.created_at).toLocaleString()}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            ["Ship to", shipping.name ?? "—"],
            ["Address", `${shipping.city ?? "—"}, ${shipping.country ?? "—"}`],
            ["Payment", (shipping.paymentMethod ?? "—").replace("_", " ")],
            ["Status", order.status],
          ].map(([label, value]) => (
            <div key={label} className="bg-stone-800/50 rounded-lg p-3">
              <div className="text-xs text-stone-500 uppercase tracking-wide">{label}</div>
              <div className="text-stone-200 text-sm font-medium mt-0.5 capitalize">{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-medium text-stone-200 mb-3">Items</h2>
        <div className="space-y-2">
          {order.items?.map((item: { productId: number; name: string; quantity: number; price: number }, idx: number) => (
            <div key={idx} className="flex justify-between py-2 border-b border-stone-800 last:border-0">
              <span className="text-stone-300 text-sm">{item.name} × {item.quantity}</span>
              <span className="text-gold-400 text-sm font-medium">${(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-3 pt-3 border-t border-stone-700">
          <span className="font-medium text-stone-300">Total</span>
          <span className="text-gold-400 font-semibold text-lg">${parseFloat(order.total_usd).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
