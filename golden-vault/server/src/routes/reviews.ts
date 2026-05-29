import { Router } from "express";
import { db } from "../db";
import { reviews } from "../db/schema";
import { eq, and, avg, count, desc } from "drizzle-orm";

const router = Router();

// GET /api/products/reviews/summary — ratings for all products (used on shop page)
router.get("/reviews/summary", async (_req, res) => {
  try {
    const rows = await db
      .select({
        productId: reviews.productId,
        avgRating: avg(reviews.rating),
        total: count(reviews.id),
      })
      .from(reviews)
      .groupBy(reviews.productId);

    const summary: Record<number, { avgRating: number; count: number }> = {};
    for (const row of rows) {
      summary[row.productId] = {
        avgRating: parseFloat(row.avgRating ?? "0"),
        count: Number(row.total),
      };
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
    const productReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.productId, productId))
      .orderBy(desc(reviews.createdAt));

    const stats = await db
      .select({ avgRating: avg(reviews.rating), total: count(reviews.id) })
      .from(reviews)
      .where(eq(reviews.productId, productId));

    res.json({
      reviews: productReviews,
      avgRating: parseFloat(stats[0]?.avgRating ?? "0"),
      count: Number(stats[0]?.total ?? 0),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// POST /api/products/:productId/reviews
router.post("/:productId/reviews", async (req, res) => {
  try {
    const userId = (req as any).auth?.userId;
    if (!userId) {
      res.status(401).json({ error: "Sign in to leave a review" });
      return;
    }
    const productId = parseInt(req.params.productId);
    const { rating, comment, userName, userEmail } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({ error: "Rating must be between 1 and 5" });
      return;
    }

    const existing = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.productId, productId), eq(reviews.userId, userId)));

    if (existing.length > 0) {
      res.status(409).json({ error: "You have already reviewed this product" });
      return;
    }

    const [review] = await db
      .insert(reviews)
      .values({
        productId,
        userId,
        userName: userName || "Anonymous",
        userEmail: userEmail || "",
        rating: parseInt(rating),
        comment: comment || null,
      })
      .returning();

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: "Failed to submit review" });
  }
});

export { router as reviewsRouter };
