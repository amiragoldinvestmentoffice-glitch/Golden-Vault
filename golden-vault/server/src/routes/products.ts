import { Router } from "express";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const productsRouter = Router();

productsRouter.get("/", async (req, res) => {
  const { category, search } = req.query;

  let query = supabase.from("products").select("*");

  if (category && category !== "all") {
    query = query.eq("category", category as string);
  }

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json(data);
});

productsRouter.get("/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", parseInt(req.params.id))
    .single();

  if (error || !data) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  res.json(data);
});
