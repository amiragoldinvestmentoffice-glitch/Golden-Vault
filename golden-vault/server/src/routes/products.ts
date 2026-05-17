import { Router } from "express";
import { db } from "../db";
import { products } from "../db/schema";
import { eq, like, and, SQL } from "drizzle-orm";

export const productsRouter = Router();

productsRouter.get("/", async (req, res) => {
  const { category, search } = req.query;

  const conditions: SQL[] = [];
  if (category && category !== "all") {
    conditions.push(eq(products.category, category as string));
  }
  if (search) {
    conditions.push(like(products.name, `%${search}%`));
  }

  const rows = conditions.length > 0
    ? await db.select().from(products).where(and(...conditions))
    : await db.select().from(products);

  res.json(rows);
});

productsRouter.get("/:id", async (req, res) => {
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, parseInt(req.params.id)));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(product);
});
