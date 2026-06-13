import { Router, Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, getUserId, getUserEmail } from "../middleware/auth";
import { z } from "zod";
import { sendOrderConfirmationEmail } from "../lib/email";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const ordersRouter = Router();
ordersRouter.use(requireAuth);

// ── GET /api/orders — current user's orders ───────────────────────────────────
ordersRouter.get("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { data, error } = await supabase
      .from("orders")
      // Never select * — exclude user_email and other sensitive fields
      .select("id, created_at, status, total_usd, items, shipping_address")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    console.error("[Orders] GET / error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// ── GET /api/orders/:id — single order (ownership verified) ──────────────────
ordersRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const orderId = parseInt(req.params.id, 10);

    if (!Number.isInteger(orderId) || orderId <= 0) {
      res.status(400).json({ error: "Invalid order ID" });
      return;
    }

    const { data: order, error } = await supabase
      .from("orders")
      .select("id, created_at, status, total_usd, items, shipping_address")
      .eq("id", orderId)
      .maybeSingle();

    if (error) throw error;

    // Ownership check — do this after fetch, not in the query,
    // so we return 404 not 403 (don't leak that the order exists)
    if (!order || order.user_id !== userId) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    res.json(order);
  } catch (err: any) {
    console.error("[Orders] GET /:id error:", err);
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// ── POST /api/orders/checkout ─────────────────────────────────────────────────
const ALLOWED_PAYMENT_METHODS = ["stripe", "crypto", "bank_transfer"] as const;

const checkoutSchema = z.object({
  shippingName: z.string().min(2).max(100),
  shippingAddress: z.string().min(5).max(200),
  shippingCity: z.string().min(2).max(100),
  shippingCountry: z.string().min(2).max(60),
  // Whitelist payment methods — don't accept arbitrary strings
  paymentMethod: z.enum(ALLOWED_PAYMENT_METHODS),
});

ordersRouter.post("/checkout", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const userEmail = getUserEmail(req);

    const parsed = checkoutSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid checkout data", details: parsed.error.flatten() });
      return;
    }
    const { shippingName, shippingAddress, shippingCity, shippingCountry, paymentMethod } =
      parsed.data;

    // Fetch cart with product details
    const { data: cart, error: cartError } = await supabase
      .from("cart_items")
      .select("id, quantity, products(id, name, price_usd, stock_quantity)")
      .eq("user_id", userId);

    if (cartError) throw cartError;

    if (!cart || cart.length === 0) {
      res.status(400).json({ error: "Cart is empty" });
      return;
    }

    // Validate each cart item — check product exists and has enough stock
    for (const row of cart as any[]) {
      if (!row.products) {
        res.status(400).json({ error: "One or more products no longer exist" });
        return;
      }
      if (
        row.products.stock_quantity !== null &&
        row.products.stock_quantity < row.quantity
      ) {
        res.status(409).json({
          error: `Insufficient stock for "${row.products.name}"`,
        });
        return;
      }
      if (row.quantity < 1 || row.quantity > 100) {
        res.status(400).json({ error: "Invalid quantity in cart" });
        return;
      }
    }

    // Calculate total server-side — NEVER trust client-sent totals
    const total = (cart as any[]).reduce(
      (sum, row) => sum + parseFloat(row.products.price_usd) * row.quantity,
      0
    );

    if (total <= 0) {
      res.status(400).json({ error: "Invalid order total" });
      return;
    }

    const items = (cart as any[]).map((row) => ({
      productId: row.products.id,
      name: row.products.name,
      quantity: row.quantity,
      price: parseFloat(row.products.price_usd),
    }));

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        user_email: userEmail,
        user_name: shippingName,
        items,
        total_usd: total.toFixed(2),
        status: "confirmed",
        shipping_address: {
          name: shippingName,
          address: shippingAddress,
          city: shippingCity,
          country: shippingCountry,
          paymentMethod,
        },
        created_at: new Date().toISOString(),
      })
      .select("id, status, total_usd, created_at")  // minimal response — no PII back
      .single();

    if (orderError || !order) {
      console.error("[Orders] Insert error:", orderError);
      res.status(500).json({ error: "Failed to create order" });
      return;
    }

    // Clear cart only after order is confirmed
    await supabase.from("cart_items").delete().eq("user_id", userId);

    // Send confirmation email — best-effort, never block the response
    try {
      if (userEmail) {
        await sendOrderConfirmationEmail({
          customerEmail: userEmail,
          customerName: shippingName,
          orderId: order.id,
          items,
          total,
        });
      }
    } catch (emailErr) {
      console.error("[Orders] Email send failed (order still succeeded):", emailErr);
    }

    res.status(201).json(order);
  } catch (err: any) {
    console.error("[Orders] Checkout error:", err);
    res.status(500).json({ error: "Failed to process checkout" });
  }
});
