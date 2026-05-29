import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, getUserId } from "../middleware/auth";
import { z } from "zod";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const cartRouter = Router();
cartRouter.use(requireAuth);

cartRouter.get("/", async (req, res) => {
  const userId = getUserId(req);

  const { data, error } = await supabase
    .from("cart_items")
    .select("id, product_id, quantity, products(*)")
    .eq("user_id", userId);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json(data);
});

const addSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().min(1).default(1),
});

cartRouter.post("/", async (req, res) => {
  const userId = getUserId(req);
  const { productId, quantity } = addSchema.parse(req.body);

  const { data: existing } = await supabase
    .from("cart_items")
    .select("*")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from("cart_items")
      .update({ quantity: existing.quantity + quantity })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json(data);
  } else {
    const { data, error } = await supabase
      .from("cart_items")
      .insert({ user_id: userId, product_id: productId, quantity })
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.status(201).json(data);
  }
});

cartRouter.patch("/:id", async (req, res) => {
  const userId = getUserId(req);
  const { quantity } = z.object({ quantity: z.number().int().min(0) }).parse(req.body);
  const id = parseInt(req.params.id);

  if (quantity === 0) {
    await supabase.from("cart_items").delete().eq("id", id).eq("user_id", userId);
    res.json({ deleted: true });
    return;
  }

  const { data, error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
});

cartRouter.delete("/:id", async (req, res) => {
  const userId = getUserId(req);
  await supabase
    .from("cart_items")
    .delete()
    .eq("id", parseInt(req.params.id))
    .eq("user_id", userId);
  res.json({ success: true });
});

cartRouter.delete("/", async (req, res) => {
  const userId = getUserId(req);
  await supabase.from("cart_items").delete().eq("user_id", userId);
  res.json({ success: true });
});
