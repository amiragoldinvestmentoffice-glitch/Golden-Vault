import { Router, Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, requireAdmin } from "../middleware/auth";
import { z } from "zod";

// ── Single shared client — service role (admin operations only) ──────────────
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const router = Router();

// ── All admin routes require auth + admin role ───────────────────────────────
router.use(requireAuth);
router.use(requireAdmin);

// ── Pagination helper ────────────────────────────────────────────────────────
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

// ── GET /api/admin/orders ────────────────────────────────────────────────────
router.get("/orders", async (req: Request, res: Response) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from("orders")
      .select("id, created_at, status, total_usd, user_id, items", { count: "exact" })  // no wildcard *
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;
    res.json({ data, total: count, page, limit });
  } catch (err: any) {
    console.error("[Admin] GET /orders error:", err);
    res.status(500).json({ error: "Failed to fetch orders" }); // never expose err.message
  }
});

// ── GET /api/admin/users ─────────────────────────────────────────────────────
router.get("/users", async (req: Request, res: Response) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);

    const { data: { users }, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: limit,
    });

    if (error) throw error;

    // Return only what the admin UI actually needs — never expose full user objects
    const mapped = users.map((u) => ({
      id: u.id,
      email: u.email ?? "",
      name:
        u.user_metadata?.full_name ||
        u.user_metadata?.name ||
        u.email ||
        "No name",
      createdAt: u.created_at,
      emailConfirmed: !!u.email_confirmed_at,
      bannedUntil: u.banned_until ?? null,
    }));

    res.json(mapped);
  } catch (err: any) {
    console.error("[Admin] GET /users error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// ── PATCH /api/admin/orders/:id ──────────────────────────────────────────────
const statusSchema = z.object({
  status: z.enum(["confirmed", "pending", "processing", "shipped", "delivered", "cancelled"]),
});

router.patch("/orders/:id", async (req: Request, res: Response) => {
  try {
    // Validate ID — must be a positive integer, not NaN
    const orderId = parseInt(req.params.id, 10);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      res.status(400).json({ error: "Invalid order ID" });
      return;
    }

    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid status", details: parsed.error.flatten() });
      return;
    }

    const { data, error } = await supabase
      .from("orders")
      .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .select("id, status, updated_at")  // return minimal fields only
      .single();

    if (error || !data) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    res.json(data);
  } catch (err: any) {
    console.error("[Admin] PATCH /orders error:", err);
    res.status(500).json({ error: "Failed to update order" });
  }
});

// ── GET /api/admin/withdrawals ───────────────────────────────────────────────
router.get("/withdrawals", async (req: Request, res: Response) => {
  try {
    const { page, limit } = paginationSchema.parse(req.query);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from("withdrawal_requests")
      .select("id, created_at, status, amount_usd, user_id, method", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;
    res.json({ data, total: count, page, limit });
  } catch (err: any) {
    console.error("[Admin] GET /withdrawals error:", err);
    res.status(500).json({ error: "Failed to fetch withdrawals" });
  }
});

// ── POST /api/admin/withdrawals/:id/approve ──────────────────────────────────
const withdrawalActionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  note: z.string().max(500).optional(),
});

router.post("/withdrawals/:id/action", async (req: Request, res: Response) => {
  try {
    const withdrawalId = parseInt(req.params.id, 10);
    if (!Number.isInteger(withdrawalId) || withdrawalId <= 0) {
      res.status(400).json({ error: "Invalid withdrawal ID" });
      return;
    }

    const parsed = withdrawalActionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid action", details: parsed.error.flatten() });
      return;
    }

    const newStatus = parsed.data.action === "approve" ? "approved" : "rejected";

    const { data, error } = await supabase
      .from("withdrawal_requests")
      .update({
        status: newStatus,
        admin_note: parsed.data.note ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", withdrawalId)
      .select("id, status, updated_at")
      .single();

    if (error || !data) {
      res.status(404).json({ error: "Withdrawal not found" });
      return;
    }

    res.json(data);
  } catch (err: any) {
    console.error("[Admin] POST /withdrawals/:id/action error:", err);
    res.status(500).json({ error: "Failed to process withdrawal" });
  }
});

export default router;
