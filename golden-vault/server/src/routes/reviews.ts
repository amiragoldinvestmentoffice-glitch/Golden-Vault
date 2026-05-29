import { Router } from "express";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const router = Router();

// GET /api/products/reviews/summary — ratings for all products (used on shop page)
router.get("/reviews/summary", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("product_id, rating");

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const summary: Record<number, { avgRating: number; count: number }> = {};
    for (const row of data) {
      if (!summary[row.product_id]) {
        summary[row.product_id] = { avgRating: 0, count: 0 };
      }
      summary[row.product_id].count++;
      summary[row.product_id].avgRating += row.rating;
    }
    for (const id in summary) {
      summary[id].avgRating = summary[id].avgRating / summary[id].count;
    }

    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch summary" });
  }
});

// GET /api/products/:productId/reviews
router.get("/:productId/reviews", async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);

    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const avgRating = data.length > 0
      ? data.reduce((sum, r) => sum + r.rating, 0) / data.length
      : 0;

    res.json({
      reviews: data,
      avgRating,
      count: data.length,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// POST /api/products/:productId/reviews
router.post("/:productId/reviews", async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Sign in to leave a review" });
      return;
    }

    const productId = parseInt(req.params.productId);
    const { rating, comment, userName, userEmail } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ error: "Rating must be between 1 and 5" });
      return;
    }

    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("product_id", productId)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      res.status(409).json({ error: "You have already reviewed this product" });
      return;
    }

    const { data, error } = await supabase
      .from("reviews")
      .insert({
        product_id: productId,
        user_id: user.id,
        user_name: userName || user.user_metadata?.full_name || "Anonymous",
        user_email: userEmail || user.email || "",
        rating: parseInt(rating),
        comment: comment || null,
      })
      .select()
      .single();

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to submit review" });
  }
});

export { router as reviewsRouter };
