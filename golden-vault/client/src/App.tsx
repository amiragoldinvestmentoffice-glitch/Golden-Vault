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
import NotFoundPage from "./pages/NotFoundPage";

const waNumber = "971500000000";
const waMessage = encodeURIComponent("Hello! I'm interested in investing in gold with Amira Al Dahab.");
const waLink = `https://wa.me/${waNumber}?text=${waMessage}`;

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

      {/* WhatsApp Floating Button */}
      <a
      
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        style={{ zIndex: 9999 }}
        className="fixed bottom-6 right-6 flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white pl-4 pr-5 py-3 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 group"
      >
        <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-30 animate-ping" />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5 relative z-10 shrink-0"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        <span className="relative z-10 text-sm font-semibold tracking-wide">Chat with us</span>
      </a>

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
        <Route component={NotFoundPage} />
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
