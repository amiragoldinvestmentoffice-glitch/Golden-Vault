import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { api } from "../lib/api";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { useAuth } from "../lib/auth";
import ReviewSection from "../components/ReviewSection";
import SEO from "../components/SEO";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => api.get(`/products/${id}`).then((r) => r.data),
  });

  const addToCart = async () => {
    if (!user) {
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
      <SEO title={product.name} description={product.description} />
      <Link href="/">
        <span className="flex items-center gap-2 text-stone-400 hover:text-gold-400 mb-6 cursor-pointer text-sm">
          <ArrowLeft size={16} /> Back to Shop
        </span>
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="card overflow-hidden h-80">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">🥇</div>
          )}
        </div>
        <div>
          <span className="text-xs text-gold-600 uppercase tracking-wider font-medium">{product.category}</span>
          <h1 className="text-2xl font-serif text-stone-100 mt-2">{product.name}</h1>
          <p className="text-stone-400 mt-3 leading-relaxed">{product.description}</p>
          <div className="grid grid-cols-2 gap-3 mt-6">
            {[
              ["Weight", `${parseFloat(product.weight_grams).toFixed(3)}g`],
              ["Purity", product.purity],
              ["Category", product.category],
              ["Stock", product.in_stock ? "In Stock" : "Out of Stock"],
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
              <div className="text-3xl font-semibold text-gold-400">${parseFloat(product.price_usd).toLocaleString()}</div>
            </div>
            <button onClick={addToCart} disabled={!product.in_stock} className="flex items-center gap-2 btn-gold disabled:opacity-40">
              <ShoppingCart size={16} />Add to Cart
            </button>
          </div>
        </div>
      </div>

      <ReviewSection productId={parseInt(id)} />
    </div>
  );
}
