import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Trash2, Plus, Minus } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "../lib/auth";

interface CartRow {
  id: number;
  quantity: number;
  product_id: number;
  products: { id: number; name: string; price_usd: string; image_url: string; purity: string };
}

export default function CartPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: items = [], isLoading } = useQuery<CartRow[]>({
    queryKey: ["cart"],
    queryFn: () => api.get("/cart").then((r) => r.data),
    enabled: !!user,
  });

  const updateQty = async (id: number, quantity: number) => {
    await api.patch(`/cart/${id}`, { quantity });
    qc.invalidateQueries({ queryKey: ["cart"] });
  };

  const remove = async (id: number) => {
    await api.delete(`/cart/${id}`);
    qc.invalidateQueries({ queryKey: ["cart"] });
  };

  const total = items.reduce(
    (s, i) => s + parseFloat(i.products?.price_usd ?? "0") * i.quantity,
    0
  );

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="text-stone-400 mb-4">Sign in to view your cart</p>
        <Link href="/sign-in"><button className="btn-gold">Sign In</button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-serif text-gold-400 mb-6">Shopping Cart</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="card h-20 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-stone-500">
          <p className="text-lg mb-4">Your cart is empty</p>
          <Link href="/"><span className="btn-gold cursor-pointer">Browse Products</span></Link>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {items.map((item) => (
              <div key={item.id} className="card p-4 flex items-center gap-4">
                <div className="w-16 h-16 bg-stone-800 rounded-lg overflow-hidden flex-shrink-0">
                  {item.products?.image_url ? (
                    <img src={item.products.image_url} alt={item.products.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🥇</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-stone-100 truncate">{item.products?.name}</p>
                  <p className="text-stone-500 text-sm">{item.products?.purity}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.id, item.quantity - 1)} className="w-7 h-7 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-400">
                    <Minus size={12} />
                  </button>
                  <span className="w-5 text-center text-sm">{item.quantity}</span>
                  <button onClick={() => updateQty(item.id, item.quantity + 1)} className="w-7 h-7 rounded-full bg-stone-800 hover:bg-stone-700 flex items-center justify-center text-stone-400">
                    <Plus size={12} />
                  </button>
                </div>
                <div className="text-gold-400 font-semibold text-sm w-20 text-right">
                  ${(parseFloat(item.products?.price_usd ?? "0") * item.quantity).toLocaleString()}
                </div>
                <button onClick={() => remove(item.id)} className="text-stone-600 hover:text-red-400 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="card p-4 flex items-center justify-between mb-4">
            <span className="text-stone-400">Total</span>
            <span className="text-xl font-semibold text-gold-400">
              ${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <Link href="/checkout">
            <button className="w-full btn-gold py-3 text-base">Proceed to Checkout</button>
          </Link>
        </>
      )}
    </div>
  );
}
