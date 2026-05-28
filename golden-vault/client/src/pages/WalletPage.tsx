import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useAuth, SignInButton } from "@clerk/clerk-react";

export default function WalletPage() {
  const { isSignedIn } = useAuth();
  const [copied, setCopied] = useState<string | null>(null);

  const wallets = [
    { symbol: "BTC", name: "Bitcoin", address: "15BqtCJYF8Xfu4U75bWMyckNVP37wpJsdC", icon: "₿" },
    { symbol: "ETH", name: "Ethereum", address: "0x9dc83740e1b00ba61203b1082a8e4a5a3b6f522", icon: "Ξ" },
    { symbol: "SOL", name: "Solana", address: "HDTPtx1FkmVo9wyV9ijpTCXlQWS5U6zGooHj8kGmGWe", icon: "◎" },
    { symbol: "USDT", name: "USDT (Tron)", address: "TJg6t9D4EnnhAH1ZbYkAfKlEFAW1tdx8M", icon: "₮" },
  ];

  const copyAddress = (address: string, symbol: string) => {
    navigator.clipboard.writeText(address);
    setCopied(symbol);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!isSignedIn) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <p className="text-stone-400 mb-4">Sign in to buy store credit</p>
        <SignInButton mode="modal">
          <button className="btn-gold">Sign In</button>
        </SignInButton>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-serif text-gold-400 mb-2">Buy Store Credit</h1>
      <p className="text-stone-400 mb-8">Send crypto to any address below. Your balance will update automatically and can be used to purchase gold.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {wallets.map((wallet) => (
          <div key={wallet.symbol} className="card p-6 border border-gold-500/30">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{wallet.icon}</span>
              <div>
                <h2 className="font-semibold text-stone-100">{wallet.name}</h2>
                <p className="text-stone-500 text-sm">{wallet.symbol}</p>
              </div>
            </div>

            <div className="bg-stone-800/50 rounded-lg p-3 mb-3">
              <p className="text-xs text-stone-500 mb-1">Send to this address:</p>
              <p className="text-stone-200 text-xs font-mono break-all">{wallet.address}</p>
            </div>

            <button
              onClick={() => copyAddress(wallet.address, wallet.symbol)}
              className="w-full flex items-center justify-center gap-2 btn-gold py-2 text-sm"
            >
              {copied === wallet.symbol ? (
                <>
                  <Check size={16} /> Copied!
                </>
              ) : (
                <>
                  <Copy size={16} /> Copy Address
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 card p-6 bg-gold-500/5 border border-gold-500/20">
        <h3 className="text-gold-400 font-semibold mb-3">How it works</h3>
        <ol className="text-stone-300 text-sm space-y-2 list-decimal list-inside">
          <li>Copy a wallet address above</li>
          <li>Send crypto from your exchange (Bitget, Coinbase, etc.)</li>
          <li>Wait 5-10 minutes for confirmation</li>
          <li>Your store credit balance updates automatically</li>
          <li>Use it to buy gold at checkout</li>
        </ol>
      </div>

      <div className="mt-6 p-4 bg-stone-800/50 rounded-lg border border-stone-700">
        <p className="text-stone-400 text-sm">
          <strong>Your current balance:</strong> <span className="text-gold-400 font-semibold">$0.00</span>
        </p>
      </div>
    </div>
  );
}
