import { Router } from "express";
import { db } from "../db";
import { orders } from "../db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/requireAdmin";
import { clerkClient } from "@clerk/express";
import { z } from "zod";

const router = Router();
router.use(requireAuth);
router.use(requireAdmin);

router.get("/orders", async (_req, res) => {
  const rows = await db.select().from(orders).orderBy(orders.createdAt);
  res.json(rows.reverse());
});

router.get("/users", async (_req, res) => {
  const response = await clerkClient.users.getUserList({ limit: 100 });
  const users = response.data.map((u) => ({
    id: u.id,
    email: u.emailAddresses?.[0]?.emailAddress ?? "",
    name: [u.firstName, u.lastName].filter(Boolean).join(" ") || "No name",
    createdAt: u.createdAt,
  }));
  res.json(users);
});

const statusSchema = z.object({
  status: z.enum(["confirmed", "pending", "processing", "shipped", "delivered"]),
});

router.patch("/orders/:id", async (req, res) => {
  const orderId = parseInt(req.params.id);
  const { status } = statusSchema.parse(req.body);
  const [updated] = await db
    .update(orders)
    .set({ status })
    .where(eq(orders.id, orderId))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Order not found" });
    return;
  }
  res.json(updated);
});

export default router;
