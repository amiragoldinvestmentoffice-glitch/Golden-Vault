import { Router } from "express";
import { db } from "../db";
import { cartItems, products } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { requireAuth, getUserId } from "../middleware/auth";
import { z } from "zod";

export const cartRouter = Router();
cartRouter.use(requireAuth);

cartRouter.get("/", async (req, res) => {
  const userId = getUserId(req);
  const rows = await db
    .select({
      id: cartItems.id,
      productId: cartItems.productId,
      quantity: cartItems.quantity,
      product: products,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.userId, userId));
  res.json(rows);
});

const addSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1).default(1),
});

cartRouter.post("/", async (req, res) => {
  const userId = getUserId(req);
  const { productId, quantity } = addSchema.parse(req.body);

  const [existing] = await db
    .select()
    .from(cartItems)
    .where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)));

  if (existing) {
    const [updated] = await db
      .update(cartItems)
      .set({ quantity: existing.quantity + quantity, updatedAt: new Date() })
      .where(eq(cartItems.id, existing.id))
      .returning();
    res.json(updated);
  } else {
    const [created] = await db
      .insert(cartItems)
      .values({ userId, productId, quantity })
      .returning();
    res.status(201).json(created);
  }
});

cartRouter.patch("/:id", async (req, res) => {
  const userId = getUserId(req);
  const { quantity } = z.object({ quantity: z.number().int().min(0) }).parse(req.body);
  const id = parseInt(req.params.id);

  if (quantity === 0) {
    await db.delete(cartItems).where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)));
    res.json({ deleted: true });
    return;
  }

  const [updated] = await db
    .update(cartItems)
    .set({ quantity, updatedAt: new Date() })
    .where(and(eq(cartItems.id, id), eq(cartItems.userId, userId)))
    .returning();
  res.json(updated);
});

cartRouter.delete("/:id", async (req, res) => {
  const userId = getUserId(req);
  await db
    .delete(cartItems)
    .where(and(eq(cartItems.id, parseInt(req.params.id)), eq(cartItems.userId, userId)));
  res.json({ success: true });
});

cartRouter.delete("/", async (req, res) => {
  const userId = getUserId(req);
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
  res.json({ success: true });
});
