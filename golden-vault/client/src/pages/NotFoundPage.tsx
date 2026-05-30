import { Link } from "wouter";

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      {/* Gold decorative element */}
      <div className="text-7xl mb-6">🥇</div>

      {/* 404 number */}
      <h1 className="text-8xl font-serif font-bold text-gold-400 mb-2 opacity-80">404</h1>

      {/* Message */}
      <h2 className="text-2xl font-serif text-stone-100 mb-3">Page Not Found</h2>
      <p className="text-stone-400 text-sm max-w-md mb-10 leading-relaxed">
        The page you're looking for doesn't exist or may have been moved.
        Let's get you back to the gold.
      </p>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-10 w-48">
        <div className="flex-1 h-px bg-gold-500/20" />
        <span className="text-gold-500/40 text-xs">✦</span>
        <div className="flex-1 h-px bg-gold-500/20" />
      </div>

      {/* CTA buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/">
          <span className="btn-gold px-8 py-3 cursor-pointer text-sm font-semibold">
            Back to Gold Store
          </span>
        </Link>
        <Link href="/invest">
          <span className="border border-gold-500/40 text-gold-400 hover:bg-stone-800 px-8 py-3 rounded-lg cursor-pointer transition-colors text-sm font-semibold">
            Start Investing
          </span>
        </Link>
      </div>

      {/* Subtle bottom hint */}
      <p className="mt-12 text-stone-600 text-xs">
        Need help?{" "}
        
          href="https://wa.me/971500000000"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold-500/60 hover:text-gold-400 transition-colors"
        >
          Chat with us on WhatsApp
        </a>
      </p>
    </div>
  );
}
