import { Route, Switch } from "wouter";
import { useAuth } from "./lib/auth";
import Navbar from "./components/Navbar";
import TrustPopup from "./components/TrustPopup";
import GoldTicker from "./components/GoldTicker";
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
import AdminPage from "./pages/Admin";

const waLink = "https://wa.me/971500000000?text=Hello%20Amira%20Al%20Dahab";
const waStyle: React.CSSProperties = {
  position: "fixed",
  bottom: "24px",
  right: "24px",
  zIndex: 50,
  width: "56px",
  height: "56px",
  borderRadius: "50%",
  backgroundColor: "#25D366",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
  textDecoration: "none",
  fontSize: "26px",
};

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-amber-400 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950">
      <Navbar />
      <GoldTicker />
      <TrustPopup />
      <a href={waLink} style={waStyle} aria-label="WhatsApp">💬</a>
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
        <Route path="/admin" component={AdminPage} />
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
