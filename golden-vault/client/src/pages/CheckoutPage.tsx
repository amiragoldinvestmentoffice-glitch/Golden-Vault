import { useState } from "react";
import { useLocation } from "wouter";
import { api } from "../lib/api";
import { useQueryClient } from "@tanstack/react-query";

export default function CheckoutPage() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    shippingName: "",
    shippingAddress: "",
    shippingCity: "",
    shippingCountry: "",
    paymentMethod: "bank_transfer",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: order } = await api.post("/orders/checkout", form);
      qc.invalidateQueries({ queryKey: ["cart"] });
      navigate(`/orders/${order.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Checkout failed. Please try again.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form, label: string, type = "text") => (
    <div>
      <label className="block text-sm text-stone-400 mb-1">{label}</label>
      <input
        type={type}
        required
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-lg text-stone-100 focus:outline-none focus:border-gold-500 text-sm"
      />
    </div>
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-serif text-gold-400 mb-6">Checkout</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="card p-5">
          <h2 className="font-medium text-stone-200 mb-4">Shipping Information</h2>
          <div className="space-y-3">
            {field("shippingName", "Full Name")}
            {field("shippingAddress", "Address")}
            {field("shippingCity", "City")}
            {field("shippingCountry", "Country")}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-medium text-stone-200 mb-4">Payment Method</h2>
          <div className="space-y-2">
            {[
              ["bank_transfer", "Bank Transfer (Wire)"],
              ["crypto", "Cryptocurrency (BTC / ETH)"],
              ["card", "Credit / Debit Card"],
            ].map(([value, label]) => (
              <label key={value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value={value}
                  checked={form.paymentMethod === value}
                  onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                  className="accent-gold-500"
                />
                <span className="text-sm text-stone-300">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-gold py-3 text-base disabled:opacity-60"
        >
          {loading ? "Processing..." : "Place Order"}
        </button>
      </form>
    </div>
  );
}
