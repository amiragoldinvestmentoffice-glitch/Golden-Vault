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

// ── HTML escape helper ───────────────────────────────────────────────────────
const esc = (s: string): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// ── OG HTML builder ──────────────────────────────────────────────────────────
const SITE_URL = "https://www.amira-al-dahab.com";
const DEFAULT_IMAGE = "https://i.imgur.com/dfaNHce.jpeg";

function buildProductOgHtml(product: {
  id: number;
  name: string;
  description: string | null;
  price_usd: string | number | null;
  image_url: string | null;
  category: string | null;
  purity: string | null;
  weight_grams: number | null;
}): string {
  const productUrl = `${SITE_URL}/products/${product.id}`;
  // Browsers get redirected to ?_r=1 which bypasses this middleware
  // so the React SPA loads normally. Crawlers don't follow meta-refresh.
  const browserRedirect = `/products/${product.id}?_r=1`;

  const title = esc(`${product.name} | Amira Al Dahab`);
  const image = esc(product.image_url || DEFAULT_IMAGE);
  const priceUsd = product.price_usd ? String(product.price_usd) : null;
  const priceLabel = priceUsd
    ? ` Price: $${parseFloat(priceUsd).toLocaleString("en-US", {
        minimumFractionDigits: 2,
      })} USD.`
    : "";
  const rawDesc =
    product.description ||
    `${product.category ? product.category + " — " : ""}Certified gold from Dubai.${priceLabel}`;
  const description = esc(rawDesc);
  const url = esc(productUrl);

  const priceTags = priceUsd
    ? `
  <meta property="og:price:amount"        content="${esc(priceUsd)}"/>
  <meta property="og:price:currency"      content="USD"/>
  <meta property="product:price:amount"   content="${esc(priceUsd)}"/>
  <meta property="product:price:currency" content="USD"/>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>
  <meta name="description" content="${description}"/>

  <!-- Open Graph -->
  <meta property="og:site_name"        content="Amira Al Dahab"/>
  <meta property="og:type"             content="product"/>
  <meta property="og:title"            content="${title}"/>
  <meta property="og:description"      content="${description}"/>
  <meta property="og:image"            content="${image}"/>
  <meta property="og:image:secure_url" content="${image}"/>
  <meta property="og:image:width"      content="1200"/>
  <meta property="og:image:height"     content="630"/>
  <meta property="og:url"              content="${url}"/>
  <meta property="og:locale"           content="en_AE"/>${priceTags}

  <!-- Twitter / X -->
  <meta name="twitter:card"        content="summary_large_image"/>
  <meta name="twitter:title"       content="${title}"/>
  <meta name="twitter:description" content="${description}"/>
  <meta name="twitter:image"       content="${image}"/>

  <!-- Redirect real browsers to the SPA (crawlers ignore meta-refresh) -->
  <meta http-equiv="refresh" content="0;url=${browserRedirect}"/>
</head>
<body>
  <h1>${title}</h1>
  <img src="${image}" alt="${esc(product.name)}" style="max-width:600px"/>
  <p>${description}</p>
  <a href="${url}">View on Amira Al Dahab →</a>
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

// ── Production: OG middleware + React SPA ────────────────────────────────────
if (process.env.NODE_ENV === "production") {
  const clientDist = path.resolve(process.cwd(), "..", "client", "dist");

  // ── Product OG middleware ─────────────────────────────────────────────────
  // Serves OG HTML to EVERY visitor (not just crawlers).
  // • Crawlers (Telegram, WhatsApp, etc.) read the OG tags and stop.
  // • Real browsers receive a meta-refresh to ?_r=1 and load the React SPA.
  // The ?_r=1 flag on the second request skips this middleware entirely.
  app.get("/products/:id", async (req, res, next) => {
    // Second pass — browser was already redirected; serve the SPA
    if (req.query._r === "1") return next();

    const productId = req.params.id;
    console.log(`[OG] Fetching product ${productId} for ${req.headers["user-agent"]?.slice(0, 60)}`);

    try {
      const { data: product, error } = await supabase
        .from("products")
        .select("id, name, description, price_usd, image_url, category, purity, weight_grams")
        .eq("id", productId)
        .single();

      if (error || !product) {
        console.log(`[OG] Product ${productId} not found — falling through`);
        return next();
      }

      console.log(`[OG] Serving OG page for: ${product.name}`);
      res.setHeader("Content-Type", "text/html");
      return res.send(buildProductOgHtml(product));
    } catch (err) {
      console.error("[OG] Supabase error:", err);
      return next();
    }
  });

  // Static assets (JS, CSS, images)
  app.use(express.static(clientDist));

  // Catch-all: React SPA for all other routes
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
