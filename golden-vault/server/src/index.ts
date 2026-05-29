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

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: true, credentials: true }));
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
