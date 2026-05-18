import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { Link } from "wouter";
import { ShoppingCart, Search } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { useQueryClient } from "@tanstack/react-query";

const CATEGORIES = ["all", "bar", "coin", "jewelry"] as const;

interface Product {
  id: number;
  name: string;
  description: string;
  priceUsd: string;
  weightGrams: string;
  purity: string;
  category: string;
  imageUrl: string;
  inStock: boolean;
}

export default function ShopPage() {
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const { isSignedIn } = useAuth();
  const qc = useQueryClient();

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ["products", category, search],
    queryFn: () =>
      api.get("/products", { params: { category, search } }).then((r) => r.data),
  });

  const { data: price } = useQuery({
    queryKey: ["price"],
    queryFn: () => api.get("/price").then((r) => r.data),
    refetchInterval: 30_000,
  });

  const addToCart = async (productId: number) => {
    if (!isSignedIn) {
      alert("Please sign in to add items to cart");
      return;
    }
    await api.post("/cart", { productId, quantity: 1 });
    qc.invalidateQueries({ queryKey: ["cart"] });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-gold-400">Gold Store</h1>
          <p className="text-stone-400 mt-1">
            Premium gold products — bars, coins, and jewelry
          </p>
        </div>
        {price && (
          <div className="card px-4 py-3 text-sm">
            <span className="text-stone-400">Spot Price: </span>
            <span className="text-gold-400 font-semibold">
              ${parseFloat(price.perOz).toLocaleString()}/oz
            </span>
            <span className="text-stone-500 ml-2">
              (${parseFloat(price.perGram).toFixed(2)}/g)
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" size={16} />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-stone-900 border border-stone-800 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-gold-500"
          />
        </div>
        <div className="flex gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors
                ${category === cat ? "bg-gold-500 text-stone-900" : "bg-stone-900 border border-stone-800 text-stone-400 hover:border-gold-500"}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card h-80 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id} className="card overflow-hidden group hover:border-gold-500/50 transition-colors">
              <Link href={`/products/${product.id}`}>
                <div className="h-48 bg-stone-800 overflow-hidden cursor-pointer">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🥇</div>
                  )}
                </div>
              </Link>
              <div className="p-4">
                <span className="text-xs text-gold-600 uppercase tracking-wide font-medium">
                  {product.category} · {product.purity}
                </span>
                <Link href={`/products/${product.id}`}>
                  <h3 className="font-medium text-stone-100 mt-1 hover:text-gold-400 cursor-pointer line-clamp-2">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-stone-500 text-xs mt-1">
                  {parseFloat(product.weightGrams).toFixed(1)}g
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-gold-400 font-semibold">
                    ${parseFloat(product.priceUsd).toLocaleString()}
                  </span>
                  <button
                    onClick={() => addToCart(product.id)}
                    disabled={!product.inStock}
                    className="flex items-center gap-1.5 btn-gold text-xs py-1.5 px-3 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart size={13} />
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && products.length === 0 && (
        <div className="text-center py-24 text-stone-500">No products found.</div>
      )}

      {/* Trust Banner */}
      <div className="mt-16 flex flex-col items-center">
        <p className="text-gold-400 font-serif text-xl font-bold mb-4">Verified Gold Owner</p>
        <div className="max-w-sm w-full rounded-2xl overflow-hidden border border-gold-500/30 shadow-xl">
          <img
            src="https://i.imgur.com/KFi4n7z.jpeg"
            alt="Gold Ownership Certificate - Amira Aldahab"
            className="w-full"
          />
        </div>
        <p className="text-stone-400 text-sm text-center mt-3">
          Amira Aldahab — Certified 1kg Fine Gold Owner · Serial AA01357
        </p>
      </div>
    </div>
  );
}
