import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function TrustPopup() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = () => setVisible(true);

    // Show on first visit
    const last = localStorage.getItem("trust_popup_last");
    const now = Date.now();
    if (!last || now - parseInt(last) > 30 * 60 * 1000) {
      setTimeout(show, 2000);
    }

    // Show every 30 minutes
    const interval = setInterval(() => {
      setVisible(true);
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  const close = () => {
    localStorage.setItem("trust_popup_last", Date.now().toString());
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="relative bg-stone-900 border border-gold-500/40 rounded-2xl max-w-sm w-full p-4 shadow-2xl">
        <button
          onClick={close}
          className="absolute top-3 right-3 text-stone-400 hover:text-gold-400 transition-colors"
        >
          <X size={20} />
        </button>
        <p className="text-gold-400 font-serif text-center text-lg font-bold mb-3">
          Verified Gold Owner
        </p>
        <img
          src="https://i.imgur.com/REPLACE_WITH_IMGUR_LINK.jpg"
          alt="Gold Ownership Certificate - Amira Aldahab"
          className="w-full rounded-xl border border-gold-500/20"
        />
        <p className="text-stone-400 text-xs text-center mt-3">
          Amira Aldahab — Certified 1kg Fine Gold Owner · Serial AA01357
        </p>
      </div>
    </div>
  );
}
