import { Link, useLocation } from "wouter";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/clerk-react";
import { ShoppingCart, TrendingUp, Package, BarChart2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export default function Navbar() {
  const [location] = useLocation();

  const { data: cartItems } = useQuery({
    queryKey: ["cart"],
    queryFn: () => api.get("/cart").then((r) => r.data),
    enabled: true,
    retry: false,
  });

  const cartCount = Array.isArray(cartItems)
    ? cartItems.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0)
    : 0;

  const navLink = (href: string, label: string, icon?: React.ReactNode) => {
    const active = location === href;
    return (
      <Link href={href}>
        <span
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer
            ${active ? "bg-gold-500/20 text-gold-400" : "text-stone-400 hover:text-gold-400"}`}
        >
          {icon}
          {label}
        </span>
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-50 bg-stone-950/90 backdrop-blur border-b border-stone-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <span className="flex items-center gap-2 cursor-pointer">
            <span className="text-2xl">🥇</span>
            <span className="font-serif text-xl text-gold-400 font-bold tracking-wide">
              Amira Al Dahab
            </span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLink("/", "Shop")}
          {navLink("/invest", "Invest", <TrendingUp size={14} />)}
          {navLink("/portfolio", "Portfolio", <BarChart2 size={14} />)}
          {navLink("/orders", "Orders", <Package size={14} />)}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/cart">
            <span className="relative cursor-pointer text-stone-400 hover:text-gold-400 transition-colors">
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-gold-500 text-stone-900 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </span>
          </Link>

          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="btn-gold text-sm">Sign In</button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </nav>
  );
}
