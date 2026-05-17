import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { api } from "../lib/api";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@clerk/clerk-react";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { isSignedIn } = useAuth();
  const qc = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => api.get(`/products/${id}`).then((r) => r.data),
  });

  const addToCart = async () => {
    if (!isSignedIn) {
      alert("Please sign in to add items to cart");
      return;
    }
    await api.post("/cart", { productId: parseInt(id), quantity: 1 });
    qc.invalidateQueries({ queryKey: ["cart"] });
    alert("Added to cart!");
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card h-96 animate-pulse" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center text-stone-400">
        Product not found.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/">
        <span className="flex items-center gap-2 text-stone-400 hover:text-gold-400 mb-6 cursor-pointer text-sm">
          <ArrowLeft size={16} /> Back to Shop
        </span>
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="card overflow-hidden h-80">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">🥇</div>
          )}
        </div>

        <div>
          <span className="text-xs text-gold-600 uppercase tracking-wider font-medium">
            {product.category}
          </span>
          <h1 className="text-2xl font-serif text-stone-100 mt-2">{product.name}</h1>
          <p className="text-stone-400 mt-3 leading-relaxed">{product.description}</p>

          <div className="grid grid-cols-2 gap-3 mt-6">
            {[
              ["Weight", `${parseFloat(product.weightGrams).toFixed(3)}g`],
              ["Purity", product.purity],
              ["Category", product.category],
              ["Stock", product.inStock ? "In Stock" : "Out of Stock"],
            ].map(([label, value]) => (
              <div key={label} className="card p-3">
                <div className="text-xs text-stone-500 uppercase tracking-wide">{label}</div>
                <div className="text-stone-200 font-medium mt-0.5">{value}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div>
              <div className="text-stone-500 text-sm">Price</div>
              <div className="text-3xl font-semibold text-gold-400">
                ${parseFloat(product.priceUsd).toLocaleString()}
              </div>
            </div>
            <button
              onClick={addToCart}
              disabled={!product.inStock}
              className="flex items-center gap-2 btn-gold disabled:opacity-40"
            >
              <ShoppingCart size={16} />
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
