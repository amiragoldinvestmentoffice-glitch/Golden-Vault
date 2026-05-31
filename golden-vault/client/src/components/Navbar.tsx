import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../lib/auth";
import { ShoppingCart, Menu, X, Coins, BarChart2, Wallet, Package, Home, Info, Mail, HelpCircle, LogOut, ChevronDown, Shield, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import AccountDrawer from "./AccountDrawer";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [kycStatus, setKycStatus] = useState<string>("not_submitted");
  const { user, loading, signOut } = useAuth();
  const [location] = useLocation();

  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: () => api.get("/cart").then(r => r.data),
    enabled: !!user,
  });

  const cartCount = Array.isArray(cart)
    ? cart.reduce((sum: number, item: any) => sum + item.quantity, 0)
    : 0;

  // Load KYC status for badge
  useEffect(() => {
    if (!user) return;
    api.get("/user/kyc")
      .then(r => setKycStatus(r.data?.status || "not_submitted"))
      .catch(() => {});
  }, [user]);

  // Close user dropdown on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const close = () => setUserMenuOpen(false);
    setTimeout(() => window.addEventListener("click", close), 0);
    return () => window.removeEventListener("click", close);
  }, [userMenuOpen]);

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

  const displayName = user?.name || user?.email?.split("@")[0] || "Account";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <>
      {/* ── Inject navbar-specific keyframes once ── */}
      <style>{`
        @keyframes navDropIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .amira-nav-menu { animation: navDropIn 0.16s ease forwards; }
        .amira-nav-chip:hover { border-color: rgba(212,168,32,0.5) !important; }
      `}</style>

      <nav className="sticky top-0 z-40 bg-stone-950/95 backdrop-blur border-b border-stone-800">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">

            {/* ── Logo ── */}
            <Link href="/">
              <span className="cursor-pointer flex items-center">
                <img
                  src="/amira_logo.png"
                  alt="Amira Al Dahab"
                  className="h-10 w-auto object-contain"
                />
              </span>
            </Link>

            {/* ── Desktop nav links ── */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <span className={`px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${isActive(link.href) ? "text-amber-400 bg-stone-800" : "text-stone-400 hover:text-stone-100 hover:bg-stone-800/60"}`}>
                    {link.label}
                  </span>
                </Link>
              ))}
              {moreLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <span className={`px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${isActive(link.href) ? "text-amber-400 bg-stone-800" : "text-stone-400 hover:text-stone-100 hover:bg-stone-800/60"}`}>
                    {link.label}
                  </span>
                </Link>
              ))}
            </div>

            {/* ── Right side: Cart · Account · Hamburger ── */}
            <div className="flex items-center gap-3">

              {/* Cart */}
              <Link href="/cart">
                <span className="relative cursor-pointer text-stone-400 hover:text-amber-400 transition-colors">
                  <ShoppingCart size={22} />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-amber-500 text-stone-950 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </span>
              </Link>

              {/* ── Account chip (desktop) ── */}
              {!loading && user && (
                <div className="hidden md:block" style={{ position: "relative" }}>
                  <button
                    className="amira-nav-chip"
                    onClick={(e) => { e.stopPropagation(); setUserMenuOpen(v => !v); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 7,
                      padding: "6px 12px 6px 8px",
                      background: userMenuOpen ? "rgba(212,168,32,0.08)" : "rgba(255,255,255,0.04)",
                      border: `1px solid ${userMenuOpen ? "rgba(212,168,32,0.45)" : "rgba(255,255,255,0.08)"}`,
                      borderRadius: 10, cursor: "pointer",
                      transition: "border-color 0.2s ease, background 0.2s ease",
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%",
                      background: "linear-gradient(135deg, rgba(212,168,32,0.25), rgba(212,168,32,0.08))",
                      border: "1.5px solid rgba(212,168,32,0.5)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 700, color: "#D4A820",
                      fontFamily: "'DM Sans', sans-serif", flexShrink: 0,
                    }}>
                      {initials}
                    </div>

                    {/* Name + KYC badge */}
                    <div style={{ textAlign: "left", lineHeight: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#EDE5D5", fontFamily: "'DM Sans', sans-serif" }}>
                        {displayName}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 3 }}>
                        {kycStatus === "verified" && (
                          <>
                            <CheckCircle size={9} style={{ color: "#10B981" }} />
                            <span style={{ fontSize: 9, color: "#10B981", fontFamily: "'DM Sans', sans-serif" }}>Verified</span>
                          </>
                        )}
                        {kycStatus === "pending" && (
                          <>
                            <Shield size={9} style={{ color: "#F59E0B" }} />
                            <span style={{ fontSize: 9, color: "#F59E0B", fontFamily: "'DM Sans', sans-serif" }}>KYC pending</span>
                          </>
                        )}
                        {kycStatus === "not_submitted" && (
                          <>
                            <Shield size={9} style={{ color: "#445566" }} />
                            <span style={{ fontSize: 9, color: "#445566", fontFamily: "'DM Sans', sans-serif" }}>Unverified</span>
                          </>
                        )}
                      </div>
                    </div>

                    <ChevronDown
                      size={12}
                      style={{
                        color: "#8899AA", flexShrink: 0,
                        transform: userMenuOpen ? "rotate(180deg)" : "rotate(0)",
                        transition: "transform 0.2s ease",
                      }}
                    />
                  </button>

                  {/* ── Dropdown menu ── */}
                  {userMenuOpen && (
                    <div
                      className="amira-nav-menu"
                      style={{
                        position: "absolute", top: "calc(100% + 8px)", right: 0,
                        background: "#0A0D18",
                        border: "1px solid rgba(212,168,32,0.12)",
                        borderRadius: 14, minWidth: 210, zIndex: 50,
                        boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
                        overflow: "hidden",
                      }}
                    >
                      {/* Email header */}
                      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(212,168,32,0.08)" }}>
                        <p style={{ color: "#445566", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 3px", fontFamily: "'DM Sans', sans-serif" }}>
                          Signed in as
                        </p>
                        <p style={{ color: "#EDE5D5", fontSize: 12, fontWeight: 500, margin: 0, fontFamily: "'DM Sans', sans-serif", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {user.email}
                        </p>
                      </div>

                      {/* My Account */}
                      <button
                        onClick={() => { setUserMenuOpen(false); setAccountOpen(true); }}
                        style={{ width: "100%", padding: "11px 16px", background: "transparent", border: "none", color: "#EDE5D5", fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10, transition: "background 0.15s ease" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(212,168,32,0.06)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <span style={{ fontSize: 14 }}>👤</span> My Account
                      </button>

                      {/* KYC */}
                      <button
                        onClick={() => { setUserMenuOpen(false); setAccountOpen(true); }}
                        style={{ width: "100%", padding: "11px 16px", background: "transparent", border: "none", color: "#EDE5D5", fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, transition: "background 0.15s ease" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(212,168,32,0.06)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 14 }}>🛡️</span> KYC Verification
                        </span>
                        {kycStatus === "verified" && (
                          <span style={{ fontSize: 9, color: "#10B981", background: "rgba(16,185,129,0.1)", padding: "2px 7px", borderRadius: 10, fontWeight: 600, whiteSpace: "nowrap" }}>Verified</span>
                        )}
                        {kycStatus === "pending" && (
                          <span style={{ fontSize: 9, color: "#F59E0B", background: "rgba(245,158,11,0.1)", padding: "2px 7px", borderRadius: 10, fontWeight: 600, whiteSpace: "nowrap" }}>Pending</span>
                        )}
                        {kycStatus === "not_submitted" && (
                          <span style={{ fontSize: 9, color: "#445566", background: "rgba(255,255,255,0.05)", padding: "2px 7px", borderRadius: 10, whiteSpace: "nowrap" }}>Required</span>
                        )}
                      </button>

                      <div style={{ height: 1, background: "rgba(212,168,32,0.08)", margin: "3px 0" }} />

                      {/* Sign out */}
                      <button
                        onClick={() => { setUserMenuOpen(false); signOut(); }}
                        style={{ width: "100%", padding: "11px 16px", background: "transparent", border: "none", color: "#F87171", fontSize: 13, fontFamily: "'DM Sans', sans-serif", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10, transition: "background 0.15s ease" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(248,113,113,0.06)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <LogOut size={13} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Sign In button — desktop, unauthenticated */}
              {!loading && !user && (
                <Link href="/sign-in">
                  <button
                    className="hidden md:block"
                    style={{
                      padding: "7px 18px", borderRadius: 9,
                      background: "#D4A820", color: "#0A0700",
                      border: "none", fontSize: 13, fontWeight: 600,
                      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                      letterSpacing: "0.04em", transition: "opacity 0.2s ease",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = "0.85")}
                    onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
                  >
                    Sign In
                  </button>
                </Link>
              )}

              {/* Hamburger — mobile only */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden text-stone-400 hover:text-amber-400 transition-colors p-1"
                aria-label="Toggle menu"
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile dropdown ── */}
        {menuOpen && (
          <div className="md:hidden border-t border-stone-800 bg-stone-950 px-4 pb-5 pt-3 space-y-1">
            <p className="text-stone-600 text-xs uppercase tracking-widest px-3 pb-1">Navigation</p>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <span
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm cursor-pointer transition-colors ${isActive(link.href) ? "text-amber-400 bg-stone-800" : "text-stone-300 hover:text-stone-100 hover:bg-stone-800/60"}`}
                >
                  {link.icon}{link.label}
                </span>
              </Link>
            ))}
            <div className="border-t border-stone-800 my-2" />
            <p className="text-stone-600 text-xs uppercase tracking-widest px-3 pb-1">More</p>
            {moreLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <span
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm cursor-pointer transition-colors ${isActive(link.href) ? "text-amber-400 bg-stone-800" : "text-stone-300 hover:text-stone-100 hover:bg-stone-800/60"}`}
                >
                  {link.icon}{link.label}
                </span>
              </Link>
            ))}
            <div className="border-t border-stone-800 my-2" />

            {/* Mobile account section */}
            {!loading && (
              user ? (
                <>
                  {/* Account button — opens drawer */}
                  <button
                    onClick={() => { setMenuOpen(false); setAccountOpen(true); }}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm w-full transition-colors text-stone-300 hover:text-stone-100 hover:bg-stone-800/60"
                  >
                    <span style={{ fontSize: 14 }}>👤</span>
                    <span>My Account</span>
                    {kycStatus === "verified" && (
                      <CheckCircle size={12} style={{ color: "#10B981", marginLeft: "auto" }} />
                    )}
                    {kycStatus === "not_submitted" && (
                      <span style={{ marginLeft: "auto", fontSize: 9, color: "#445566", background: "rgba(255,255,255,0.05)", padding: "2px 7px", borderRadius: 10 }}>KYC needed</span>
                    )}
                  </button>

                  {/* KYC shortcut */}
                  <button
                    onClick={() => { setMenuOpen(false); setAccountOpen(true); }}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm w-full transition-colors text-stone-300 hover:text-stone-100 hover:bg-stone-800/60"
                  >
                    <Shield size={14} style={{ color: kycStatus === "verified" ? "#10B981" : kycStatus === "pending" ? "#F59E0B" : "#445566" }} />
                    KYC Verification
                  </button>

                  {/* Sign out */}
                  <button
                    onClick={() => { signOut(); setMenuOpen(false); }}
                    className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-red-400 hover:bg-stone-800/60 w-full transition-colors"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </>
              ) : (
                <Link href="/sign-in">
                  <button
                    onClick={() => setMenuOpen(false)}
                    style={{
                      width: "100%", padding: "12px", borderRadius: 10, marginTop: 4,
                      background: "#D4A820", color: "#0A0700",
                      border: "none", fontSize: 14, fontWeight: 600,
                      cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    Sign In
                  </button>
                </Link>
              )
            )}
          </div>
        )}
      </nav>

      {/* ── Account Drawer — rendered outside nav so it covers full page ── */}
      <AccountDrawer
        isOpen={accountOpen}
        onClose={() => setAccountOpen(false)}
        user={user}
        isDark={true}
      />
    </>
  );
}
