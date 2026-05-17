import { Router } from "express";
import { db } from "../db";
import { orders, orderItems, cartItems, products } from "../db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, getUserId } from "../middleware/auth";
import { z } from "zod";

export const ordersRouter = Router();
ordersRouter.use(requireAuth);

ordersRouter.get("/", async (req, res) => {
  const userId = getUserId(req);
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(orders.createdAt);
  res.json(rows.reverse());
});

ordersRouter.get("/:id", async (req, res) => {
  const userId = getUserId(req);
  const orderId = parseInt(req.params.id);

  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
  if (!order || order.userId !== userId) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  res.json({ ...order, items });
});

const checkoutSchema = z.object({
  shippingName: z.string().min(2),
  shippingAddress: z.string().min(5),
  shippingCity: z.string().min(2),
  shippingCountry: z.string().min(2),
  paymentMethod: z.string().min(2),
});

ordersRouter.post("/checkout", async (req, res) => {
  const userId = getUserId(req);
  const data = checkoutSchema.parse(req.body);

  // Get cart
  const cart = await db
    .select({ cartItem: cartItems, product: products })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.userId, userId));

  if (cart.length === 0) {
    res.status(400).json({ error: "Cart is empty" });
    return;
  }

  const total = cart.reduce(
    (sum, row) => sum + parseFloat(row.product.priceUsd) * row.cartItem.quantity,
    0
  );

  // Create order
  const [order] = await db
    .insert(orders)
    .values({
      userId,
      totalUsd: total.toFixed(2),
      status: "confirmed",
      ...data,
    })
    .returning();

  // Create order items
  await db.insert(orderItems).values(
    cart.map((row) => ({
      orderId: order.id,
      productId: row.product.id,
      quantity: row.cartItem.quantity,
      priceUsd: row.product.priceUsd,
      productName: row.product.name,
    }))
  );

  // Clear cart
  await db.delete(cartItems).where(eq(cartItems.userId, userId));

  res.status(201).json(order);
});
