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
        <Route path="/sign-in" component={SignInPage} />
        <Route>
          <div className="flex items-center justify-center h-96 text-stone-400">
            404 — Page not found
          </div>
        </Route>
      </Switch>
    </div>
  );
}
