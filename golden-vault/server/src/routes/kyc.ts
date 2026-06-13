import { Router, Request, Response } from "express";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, requireAdmin, getUserId } from "../middleware/auth";
import { z } from "zod";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const kycRouter = Router();

// ── Schemas ──────────────────────────────────────────────────────────────────
const kycSchema = z.object({
  fullName: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[\p{L}\s'\-\.]+$/u, "Full name contains invalid characters"),
  country: z.string().min(2).max(60),
  idType: z.enum(["passport", "national_id", "drivers_license"]),
  idNumber: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[A-Z0-9\-\s]+$/i, "ID number contains invalid characters"),
  selfieNote: z.string().max(500).optional(),
});

const adminReviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  adminNote: z.string().max(1000).optional(),
});

// ── GET /api/kyc — current user's KYC status ─────────────────────────────────
kycRouter.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { data, error } = await supabase
      .from("kyc_requests")
      // Never select * — exclude admin_note from user-facing response
      .select("id, status, full_name, country, id_type, submitted_at, reviewed_at")
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle(); // use maybeSingle() — single() throws if no rows

    if (error) throw error;
    res.json(data ?? null);
  } catch (err: any) {
    console.error("[KYC] GET error:", err);
    res.status(500).json({ error: "Failed to fetch KYC status" });
  }
});

// ── POST /api/kyc — submit KYC request ───────────────────────────────────────
kycRouter.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    // Check for existing submission
    const { data: existing } = await supabase
      .from("kyc_requests")
      .select("id, status")
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing?.status === "pending") {
      res.status(409).json({ error: "You already have a pending KYC request." });
      return;
    }
    if (existing?.status === "approved") {
      res.status(409).json({ error: "Your identity is already verified." });
      return;
    }

    const parsed = kycSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid KYC data", details: parsed.error.flatten() });
      return;
    }

    const { fullName, country, idType, idNumber, selfieNote } = parsed.data;

    const { data, error } = await supabase
      .from("kyc_requests")
      .insert({
        user_id: userId,
        full_name: fullName,
        country,
        id_type: idType,
        id_number: idNumber,
        selfie_note: selfieNote ?? null,
        status: "pending",
        submitted_at: new Date().toISOString(),
      })
      // Only return safe fields to the user
      .select("id, status, submitted_at")
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err: any) {
    console.error("[KYC] POST error:", err);
    res.status(500).json({ error: "Failed to submit KYC request" });
  }
});

// ── GET /api/kyc/admin/all — ADMIN: list all KYC requests ────────────────────
// FIXED: original had requireAuth only — ANY logged-in user could see all KYC data
kycRouter.get("/admin/all", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt((req.query.page as string) ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) ?? "50", 10)));
    const from = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from("kyc_requests")
      .select("id, user_id, full_name, country, id_type, status, submitted_at, reviewed_at, admin_note", {
        count: "exact",
      })
      .order("submitted_at", { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw error;
    res.json({ data, total: count, page, limit });
  } catch (err: any) {
    console.error("[KYC] Admin GET all error:", err);
    res.status(500).json({ error: "Failed to fetch KYC requests" });
  }
});

// ── PATCH /api/kyc/:id — ADMIN: approve or reject ────────────────────────────
// FIXED: original had requireAuth only — ANY logged-in user could approve their own KYC
kycRouter.patch("/:id", requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const kycId = parseInt(req.params.id, 10);
    if (!Number.isInteger(kycId) || kycId <= 0) {
      res.status(400).json({ error: "Invalid KYC request ID" });
      return;
    }

    const parsed = adminReviewSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid review data", details: parsed.error.flatten() });
      return;
    }

    const { status, adminNote } = parsed.data;

    // Verify the record exists and is still pending before updating
    const { data: existing } = await supabase
      .from("kyc_requests")
      .select("id, status")
      .eq("id", kycId)
      .maybeSingle();

    if (!existing) {
      res.status(404).json({ error: "KYC request not found" });
      return;
    }

    if (existing.status !== "pending") {
      res.status(409).json({ error: `KYC request is already ${existing.status}` });
      return;
    }

    const { data, error } = await supabase
      .from("kyc_requests")
      .update({
        status,
        admin_note: adminNote ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", kycId)
      .select("id, status, reviewed_at")
      .single();

    if (error) throw error;
    res.json({ success: true, kyc: data });
  } catch (err: any) {
    console.error("[KYC] Admin PATCH error:", err);
    res.status(500).json({ error: "Failed to update KYC request" });
  }
});
