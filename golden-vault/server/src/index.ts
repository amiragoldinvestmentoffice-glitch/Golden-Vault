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

// ── Supabase client for crawler OG tag lookups ──────────────────────────────
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Social media crawler detection ──────────────────────────────────────────
const CRAWLERS = [
  "TelegramBot",
  "WhatsApp",
  "facebookexternalhit",
  "Twitterbot",
  "LinkedInBot",
  "Slackbot",
  "Discordbot",
  "Googlebot",
  "bingbot",
];
const isCrawler = (ua: string) => CRAWLERS.some((c) => ua.includes(c));
const SITE_URL = "https://www.amira-al-dahab.com";

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

// ── Production: serve React SPA + crawler OG tag middleware ─────────────────
if (process.env.NODE_ENV === "production") {
  const clientDist = path.resolve(process.cwd(), "..", "client", "dist");
  app.use(express.static(clientDist));

  // Intercept product page requests from social media crawlers
  app.get("/products/:id", async (req, res, next) => {
    const ua = req.headers["user-agent"] || "";
    if (!isCrawler(ua)) return next();

    try {
      const { data: product } = await supabase
        .from("products")
        .select("*")
        .eq("id", req.params.id)
        .single();

      if (!product) return next();

      const title = `${product.name} | Amira Al Dahab`;
      const productUrl = `${SITE_URL}/products/${product.id}`;
      const price = parseFloat(product.price_usd).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>

  <!-- Primary Meta -->
  <meta name="description" content="${product.description}"/>

  <!-- Open Graph -->
  <meta property="og:site_name" content="Amira Al Dahab"/>
  <meta property="og:title" content="${title}"/>
  <meta property="og:description" content="${product.description}"/>
  <meta property="og:image" content="${product.image_url}"/>
  <meta property="og:image:secure_url" content="${product.image_url}"/>
  <meta property="og:image:width" content="1200"/>
  <meta property="og:image:height" content="630"/>
  <meta property="og:url" content="${productUrl}"/>
  <meta property="og:type" content="product"/>
  <meta property="og:locale" content="en_AE"/>

  <!-- Product price -->
  <meta property="og:price:amount" content="${product.price_usd}"/>
  <meta property="og:price:currency" content="USD"/>
  <meta property="product:price:amount" content="${product.price_usd}"/>
  <meta property="product:price:currency" content="USD"/>

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${title}"/>
  <meta name="twitter:description" content="${product.description}"/>
  <meta name="twitter:image" content="${product.image_url}"/>

  <!-- Redirect browsers to the real SPA page -->
  <meta http-equiv="refresh" content="0;url=${productUrl}"/>
</head>
<body>
  <h1>${product.name}</h1>
  <img src="${product.image_url}" alt="${product.name}" style="max-width:600px"/>
  <p>${product.description}</p>
  <p><strong>Price: $${price} USD</strong></p>
  <p>Purity: ${product.purity} &nbsp;|&nbsp; Weight: ${product.weight_grams}g</p>
  <a href="${productUrl}">View on Amira Al Dahab →</a>
</body>
</html>`;

      res.setHeader("Content-Type", "text/html");
      res.send(html);
    } catch {
      next();
    }
  });

  // Catch-all: serve React SPA for all other routes
  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// ── Error handler ────────────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  if (err.name === "ZodError") {
    res.status(400).json({ error: "Validation error", details: err.message });
    return;
  }
  res.status(500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`🥇 Golden Vault API running on port ${PORT}`);
});
