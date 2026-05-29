import { Router } from "express";
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

ordersRouter.get("/", async (req, res) => {
  const userId = getUserId(req);

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json(data);
});

ordersRouter.get("/:id", async (req, res) => {
  const userId = getUserId(req);
  const orderId = parseInt(req.params.id);

  const { data: order, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (error || !order || order.user_id !== userId) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  res.json(order);
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
  const userEmail = getUserEmail(req);
  const data = checkoutSchema.parse(req.body);

  // Get cart with products
  const { data: cart, error: cartError } = await supabase
    .from("cart_items")
    .select("id, quantity, products(*)")
    .eq("user_id", userId);

  if (cartError || !cart || cart.length === 0) {
    res.status(400).json({ error: "Cart is empty" });
    return;
  }

  const total = cart.reduce((sum: number, row: any) => {
    return sum + parseFloat(row.products.price_usd) * row.quantity;
  }, 0);

  const items = cart.map((row: any) => ({
    productId: row.products.id,
    name: row.products.name,
    quantity: row.quantity,
    price: parseFloat(row.products.price_usd),
  }));

  // Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      user_email: userEmail,
      user_name: data.shippingName,
      items,
      total_usd: total.toFixed(2),
      status: "confirmed",
      shipping_address: {
        name: data.shippingName,
        address: data.shippingAddress,
        city: data.shippingCity,
        country: data.shippingCountry,
        paymentMethod: data.paymentMethod,
      },
    })
    .select()
    .single();

  if (orderError || !order) {
    res.status(500).json({ error: orderError?.message || "Failed to create order" });
    return;
  }

  // Clear cart
  await supabase.from("cart_items").delete().eq("user_id", userId);

  // Send confirmation email — never block the order response
  try {
    if (userEmail) {
      await sendOrderConfirmationEmail({
        customerEmail: userEmail,
        customerName: data.shippingName,
        orderId: order.id,
        items: items.map((i: any) => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price,
        })),
        total,
      });
    }
  } catch (emailErr) {
    console.error("Email send failed (order still succeeded):", emailErr);
  }

  res.status(201).json(order);
});
