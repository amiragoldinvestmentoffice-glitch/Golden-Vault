import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../lib/auth";
import { ShoppingCart, Menu, X, Coins, BarChart2, Wallet, Package, Home, Info, Mail, HelpCircle, LogOut, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading, signOut } = useAuth();
  const [location] = useLocation();

  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: () => api.get("/cart").then(r => r.data),
    enabled: !!user,
  });

  const cartCount = Array.isArray(cart) ? cart.reduce((sum: number, item: any) => sum + item.quantity, 0) : 0;

  const navLinks = [
    { href: "/", label: "Shop", icon: <Home size={16} /> },
    { href: "/invest", label: "Invest", icon: <Coins size={16} /> },
    { href: "/portfolio", label: "Portfolio", icon: <BarChart2 size={16} /> },
    { href: "/wallet", label: "Wallet", icon: <Wallet size={16} /> },
    { href: "/orders", label: "Orders", icon: <Package size={16} /> },
  ];

  const moreLinks = [
    { href: "/about", label: "About", icon: <Info size={16} /> },
    { href: "/contact", label: "Contact", icon: <Mail size={16} /> },
    { href: "/faq", label: "FAQ", icon: <HelpCircle size={16} /> },
  ];

  const isActive = (href: string) =>
    href === "/" ? location === "/" : location.startsWith(href);

  return (
    <>
      <nav className="sticky top-0 z-40 bg-stone-950/95 backdrop-blur border-b border-stone-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link href="/">
              <span className="font-serif text-gold-400 text-lg font-semibold cursor-pointer tracking-wide">✦ Amira Al Dahab</span>
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <span className={`px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${isActive(link.href) ? "text-gold-400 bg-stone-800" : "text-stone-400 hover:text-stone-100 hover:bg-stone-800/60"}`}>
                    {link.label}
                  </span>
                </Link>
              ))}
              {moreLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <span className={`px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${isActive(link.href) ? "text-gold-400 bg-stone-800" : "text-stone-400 hover:text-stone-100 hover:bg-stone-800/60"}`}>
                    {link.label}
                  </span>
                </Link>
              ))}
            </div>

            {/* Right side — cart + auth + hamburger */}
            <div className="flex items-center gap-3">
              {/* Cart */}
              <Link href="/cart">
                <span className="relative cursor-pointer text-stone-400 hover:text-gold-400 transition-colors">
                  <ShoppingCart size={22} />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-gold-500 text-stone-950 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </span>
              </Link>

              {/* Auth */}
              {!loading && (
                user ? (
                  <div className="hidden md:flex items-center gap-2">
                    <span className="text-stone-400 text-sm flex items-center gap-1"><User size={14} />{user.email?.split("@")[0]}</span>
                    <button onClick={() => signOut()} className="text-stone-400 hover:text-red-400 transition-colors" title="Sign out"><LogOut size={18} /></button>
                  </div>
                ) : (
                  <Link href="/sign-in">
                    <button className="btn-gold px-4 py-1.5 text-sm hidden md:block">Sign In</button>
                  </Link>
                )
              )}

              {/* Hamburger — mobile only */}
              <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-stone-400 hover:text-gold-400 transition-colors p-1" aria-label="Toggle menu">
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-stone-800 bg-stone-950 px-4 pb-5 pt-3 space-y-1 animate-fade-in">
            <p className="text-stone-600 text-xs uppercase tracking-widest px-3 pb-1">Navigation</p>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <span onClick={() => setMenuOpen(false)} className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm cursor-pointer transition-colors ${isActive(link.href) ? "text-gold-400 bg-stone-800" : "text-stone-300 hover:text-stone-100 hover:bg-stone-800/60"}`}>
                  {link.icon}{link.label}
                </span>
              </Link>
            ))}
            <div className="border-t border-stone-800 my-2" />
            <p className="text-stone-600 text-xs uppercase tracking-widest px-3 pb-1">More</p>
            {moreLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <span onClick={() => setMenuOpen(false)} className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm cursor-pointer transition-colors ${isActive(link.href) ? "text-gold-400 bg-stone-800" : "text-stone-300 hover:text-stone-100 hover:bg-stone-800/60"}`}>
                  {link.icon}{link.label}
                </span>
              </Link>
            ))}
            <div className="border-t border-stone-800 my-2" />
            {!loading && (
              user ? (
                <button onClick={() => { signOut(); setMenuOpen(false); }} className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-red-400 hover:bg-stone-800/60 w-full transition-colors">
                  <LogOut size={16} />Sign Out
                </button>
              ) : (
                <Link href="/sign-in">
                  <button onClick={() => setMenuOpen(false)} className="btn-gold w-full py-3 text-sm mt-1">Sign In</button>
                </Link>
              )
            )}
          </div>
        )}
      </nav>
    </>
  );
}
