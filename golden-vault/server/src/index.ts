import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
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
import { newsletterRouter } from "./routes/newsletter"; // ✅ ADD THIS

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: true, credentials: true }));
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(supabaseAuth);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

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
app.use("/api/newsletter", newsletterRouter); // ✅ ADD THIS

setInterval(checkPriceAlerts, 5 * 60 * 1000);
checkPriceAlerts();

setInterval(runRecurringInvestments, 60 * 60 * 1000);
runRecurringInvestments();

if (process.env.NODE_ENV === "production") {
  const clientDist = path.resolve(process.cwd(), "..", "client", "dist");
  app.use(express.static(clientDist));
  app.get("/{*path}", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

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
