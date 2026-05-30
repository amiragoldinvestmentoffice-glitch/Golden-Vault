import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "../middleware/auth";
import { requireAdmin } from "../middleware/requireAdmin";
import { z } from "zod";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const router = Router();
router.use(requireAuth);
router.use(requireAdmin);

router.get("/orders", async (_req, res) => {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json(data);
});

router.get("/users", async (_req, res) => {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) { res.status(500).json({ error: error.message }); return; }
  const mapped = users.map((u) => ({
    id: u.id,
    email: u.email ?? "",
    name: u.user_metadata?.full_name || u.user_metadata?.name || u.email || "No name",
    createdAt: u.created_at,
  }));
  res.json(mapped);
});

const statusSchema = z.object({
  status: z.enum(["confirmed", "pending", "processing", "shipped", "delivered"]),
});

router.patch("/orders/:id", async (req, res) => {
  const orderId = parseInt(req.params.id);
  const { status } = statusSchema.parse(req.body);
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .select()
    .single();
  if (error || !data) { res.status(404).json({ error: "Order not found" }); return; }
  res.json(data);
});

// ── GET /api/admin/withdrawals — all withdrawal requests ──────────────────
router.get("/withdrawals", async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
