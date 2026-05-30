import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, getUserId } from "../middleware/auth";
import { z } from "zod";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const kycRouter = Router();

const kycSchema = z.object({
  fullName: z.string().min(2),
  country: z.string().min(2),
  idType: z.enum(["passport", "national_id", "drivers_license"]),
  idNumber: z.string().min(3),
  selfieNote: z.string().optional(),
});

// GET /api/kyc — get current user's KYC status
kycRouter.get("/", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    const { data, error } = await supabase
      .from("kyc_requests")
      .select("*")
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    res.json(data ?? null);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/kyc — submit KYC request
kycRouter.post("/", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);

    // Check if already submitted
    const { data: existing } = await supabase
      .from("kyc_requests")
      .select("id, status")
      .eq("user_id", userId)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .single();

    if (existing && existing.status === "pending") {
      res.status(400).json({ error: "You already have a pending KYC request." });
      return;
    }
    if (existing && existing.status === "approved") {
      res.status(400).json({ error: "Your identity is already verified." });
      return;
    }

    const { fullName, country, idType, idNumber, selfieNote } = kycSchema.parse(req.body);

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
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/kyc/admin/all — admin: list all KYC requests
kycRouter.get("/admin/all", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("kyc_requests")
      .select("*")
      .order("submitted_at", { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/kyc/:id — admin: approve or reject
kycRouter.patch("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      res.status(400).json({ error: "Status must be approved or rejected" });
      return;
    }

    const { data, error } = await supabase
      .from("kyc_requests")
      .update({
        status,
        admin_note: adminNote ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, kyc: data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
