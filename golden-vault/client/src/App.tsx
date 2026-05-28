import { Route, Switch } from "wouter";
import { useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";
import { setAuthToken } from "./lib/api";
import Navbar from "./components/Navbar";
import TrustPopup from "./components/TrustPopup";
import ShopPage from "./pages/ShopPage";
import ProductPage from "./pages/ProductPage";
import CartPage from "./pages/CartPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import InvestPage from "./pages/InvestPage";
import PortfolioPage from "./pages/PortfolioPage";
import CheckoutPage from "./pages/CheckoutPage";
import SignInPage from "./pages/SignInPage";
import WalletPage from "./pages/WalletPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";
import RefundPage from "./pages/RefundPage";
import FaqPage from "./pages/FaqPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";

export default function App() {
  const { getToken, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    const refresh = async () => {
      const token = await getToken();
      setAuthToken(token);
    };
    refresh();
    const interval = setInterval(refresh, 50_000);
    return () => clearInterval(interval);
  }, [isLoaded, getToken]);

  return (
    <div className="min-h-screen bg-stone-950">
      <Navbar />
      <TrustPopup />
      <Switch>
        <Route path="/" component={ShopPage} />
        <Route path="/products/:id" component={ProductPage} />
        <Route path="/cart" component={CartPage} />
        <Route path="/checkout" component={CheckoutPage} />
        <Route path="/orders" component={OrdersPage} />
        <Route path="/orders/:id" component={OrderDetailPage} />
        <Route path="/invest" component={InvestPage} />
        <Route path="/portfolio" component={PortfolioPage} />
        <Route path="/wallet" component={WalletPage} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/refund" component={RefundPage} />
        <Route path="/faq" component={FaqPage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/contact" component={ContactPage} />
        <Route path="/sign-in" component={SignInPage} />
        <Route>
          <div className="flex items-center justify-center h-96 text-stone-400">
            404 — Page not found
          </div>
        </Route>
      </Switch>

      <footer className="border-t border-stone-800 mt-16 py-8 text-center text-stone-500 text-sm">
        <p className="mb-2">© 2026 Amira Al Dahab. All rights reserved.</p>
        <div className="flex justify-center gap-4 flex-wrap">
          <a href="/about" className="hover:text-gold-400 transition-colors">About</a>
          <a href="/contact" className="hover:text-gold-400 transition-colors">Contact</a>
          <a href="/faq" className="hover:text-gold-400 transition-colors">FAQ</a>
          <a href="/terms" className="hover:text-gold-400 transition-colors">Terms</a>
          <a href="/privacy" className="hover:text-gold-400 transition-colors">Privacy</a>
          <a href="/refund" className="hover:text-gold-400 transition-colors">Refund Policy</a>
        </div>
      </footer>
    </div>
  );
}
