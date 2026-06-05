import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { supabaseAuth } from "./middleware/auth";
import { productsRouter } from "./routes/products";
import { cartRouter } from "./routes/cart";
import { ordersRouter } from "./routes/orders";
import { investmentsRouter } from "./routes/investments";
import { priceRouter } from "./routes/price";
import adminRouter from "./routes/admin";
import { reviewsRouter } from "./routes/reviews";
import { paymentsRouter } from "./routes/payments";
import { withdrawalsRouter } from "./routes/withdrawals";
import { priceAlertsRouter, checkPriceAlerts } from "./routes/priceAlerts";
import { referralsRouter } from "./routes/referrals";
import { recurringRouter, runRecurringInvestments } from "./routes/recurring";
import { newsletterRouter } from "./routes/newsletter";
import { kycRouter } from "./routes/kyc";
import { profileRouter } from "./routes/profile";

// ── Supabase client ──────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Crawler detection (case-insensitive) ─────────────────────────────────────
const CRAWLER_PATTERNS = [
  "telegrambot",
  "whatsapp",
  "facebookexternalhit",
  "facebookcatalog",
  "twitterbot",
  "linkedinbot",
  "slackbot",
  "discordbot",
  "googlebot",
  "bingbot",
  "applebot",
  "pinterest",
  "vkshare",
  "ogimager",     // opengraph.xyz
  "opengraph",
  "iframely",
  "embedly",
  "w3c_validator",
];

const isCrawler = (ua: string): boolean => {
  const lower = ua.toLowerCase();
  return CRAWLER_PATTERNS.some((p) => lower.includes(p));
};

// ── HTML escape (prevents broken tags from product names/descriptions) ────────
const esc = (s: string): string =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// ── OG HTML builder ──────────────────────────────────────────────────────────
const SITE_URL = "https://www.amira-al-dahab.com";
const DEFAULT_IMAGE = "https://i.imgur.com/dfaNHce.jpeg"; // Gold Charm Bracelets — Dubai Collection

function buildOgHtml({
  title,
  description,
  image,
  url,
  type = "website",
  priceUsd,
}: {
  title: string;
  description: string;
  image: string;
  url: string;
  type?: string;
  priceUsd?: string;
}): string {
  const t = esc(title);
  const d = esc(description);
  const i = esc(image || DEFAULT_IMAGE);
  const u = esc(url);

  const priceMetaTags = priceUsd
    ? `
  <meta property="og:price:amount"       content="${esc(priceUsd)}"/>
  <meta property="og:price:currency"     content="USD"/>
  <meta property="product:price:amount"  content="${esc(priceUsd)}"/>
  <meta property="product:price:currency" content="USD"/>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${t}</title>
  <meta name="description" content="${d}"/>

  <!-- Open Graph -->
  <meta property="og:site_name"    content="Amira Al Dahab"/>
  <meta property="og:type"         content="${type}"/>
  <meta property="og:title"        content="${t}"/>
  <meta property="og:description"  content="${d}"/>
  <meta property="og:image"        content="${i}"/>
  <meta property="og:image:secure_url" content="${i}"/>
  <meta property="og:image:width"  content="1200"/>
  <meta property="og:image:height" content="630"/>
  <meta property="og:url"          content="${u}"/>
  <meta property="og:locale"       content="en_AE"/>${priceMetaTags}

  <!-- Twitter / X -->
  <meta name="twitter:card"        content="summary_large_image"/>
  <meta name="twitter:title"       content="${t}"/>
  <meta name="twitter:description" content="${d}"/>
  <meta name="twitter:image"       content="${i}"/>

  <!-- Redirect real browsers to the SPA -->
  <meta http-equiv="refresh" content="0;url=${u}"/>
</head>
<body>
  <h1>${t}</h1>
  <p>${d}</p>
  <a href="${u}">View on Amira Al Dahab →</a>
</body>
</html>`;
}

// ── Express app ──────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: true, credentials: true }));
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(supabaseAuth);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── API routes ───────────────────────────────────────────────────────────────
app.use("/api/products", productsRouter);
app.use("/api/products", reviewsRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/investments", investmentsRouter);
app.use("/api/price", priceRouter);
app.use("/api/admin", adminRouter);
app.use("/api/payments", paymentsRouter);
app.use("/api/withdrawals", withdrawalsRouter);
app.use("/api/price-alerts", priceAlertsRouter);
app.use("/api/referrals", referralsRouter);
app.use("/api/recurring", recurringRouter);
app.use("/api/newsletter", newsletterRouter);
app.use("/api/kyc", kycRouter);
app.use("/api/user", profileRouter);

// ── Background jobs ──────────────────────────────────────────────────────────
setInterval(checkPriceAlerts, 5 * 60 * 1000);
checkPriceAlerts();
setInterval(runRecurringInvestments, 60 * 60 * 1000);
runRecurringInvestments();

// ── Production: crawler middleware + React SPA ───────────────────────────────
if (process.env.NODE_ENV === "production") {
  const clientDist = path.resolve(process.cwd(), "..", "client", "dist");

  // ── CRAWLER MIDDLEWARE — must come BEFORE express.static ──────────────────
  // Static serving would otherwise return index.html before this runs,
  // and crawlers would see a bare HTML shell with no OG tags.
  app.use(async (req, res, next) => {
    // Only intercept GET requests; skip API routes
    if (req.method !== "GET") return next();
    if (req.path.startsWith("/api/")) return next();

    const ua = req.headers["user-agent"] ?? "";
    if (!isCrawler(ua)) return next();

    // ── Product page: /products/:id  or  /product/:id ──────────────────────
    const productMatch = req.path.match(/^\/products?\/([\d]+)/);

    if (productMatch) {
      const productId = productMatch[1];
      try {
        const { data: product, error } = await supabase
          .from("products")
          .select("id, name, description, price_usd, image_url, purity, weight_grams, category")
          .eq("id", productId)
          .single();

        if (!error && product) {
          const priceUsd = product.price_usd ? String(product.price_usd) : undefined;
          const priceLabel = priceUsd
            ? ` Price: $${parseFloat(priceUsd).toLocaleString("en-US", { minimumFractionDigits: 2 })} USD.`
            : "";
          const category = product.category ? `${product.category} — ` : "";
          const description =
            product.description ||
            `${category}Certified gold from Dubai.${priceLabel}`;

          res.setHeader("Content-Type", "text/html");
          return res.send(
            buildOgHtml({
              title: `${product.name} | Amira Al Dahab`,
              description,
              image: product.image_url || DEFAULT_IMAGE,
              url: `${SITE_URL}/products/${product.id}`,
              type: "product",
              priceUsd,
            })
          );
        }
      } catch (err) {
        console.error("[OG] Supabase error for product", productId, err);
      }
      // Product not found — fall through to default OG
    }

    // ── Default OG for homepage + all other non-product pages ──────────────
    res.setHeader("Content-Type", "text/html");
    return res.send(
      buildOgHtml({
        title: "Amira Al Dahab — Premium Gold Jewellery & Investment",
        description:
          "Buy certified gold jewellery, bars and coins with live prices. Secure worldwide shipping from Dubai.",
        image: DEFAULT_IMAGE,
        url: SITE_URL,
      })
    );
  });

  // Static files (JS, CSS, images) — after crawler middleware
  app.use(express.static(clientDist));

  // Catch-all: serve React SPA for real browsers
  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// ── Error handler ────────────────────────────────────────────────────────────
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    if (err.name === "ZodError") {
      res.status(400).json({ error: "Validation error", details: err.message });
      return;
    }
    res.status(500).json({ error: err.message || "Internal server error" });
  }
);

app.listen(PORT, () => {
  console.log(`🥇 Golden Vault API running on port ${PORT}`);
});
