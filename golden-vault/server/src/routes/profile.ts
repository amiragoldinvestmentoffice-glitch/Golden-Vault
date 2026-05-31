import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, getUserId } from "../middleware/auth";
import { z } from "zod";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const profileRouter = Router();

// ── Validation schema ─────────────────────────────────────────────
const profileSchema = z.object({
  full_name:  z.string().min(0).max(120).optional().default(""),
  phone:      z.string().min(0).max(40).optional().default(""),
  location:   z.string().min(0).max(100).optional().default(""),
  job:        z.string().min(0).max(100).optional().default(""),
  avatar_url: z.string().max(500).optional().default(""),
});

// ─────────────────────────────────────────────────────────────────
// GET /api/user/profile
// ─────────────────────────────────────────────────────────────────
profileRouter.get("/", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);

    const { data, error } = await supabase
      .from("user_profiles")
      .select("full_name, phone, location, job, avatar_url")
      .eq("user_id", userId)
      .maybeSingle();           // returns null (not error) when row missing

    if (error) throw error;

    res.json(data ?? {
      full_name: "",
      phone: "",
      location: "",
      job: "",
      avatar_url: "",
    });
  } catch (err: any) {
    console.error("GET /api/user/profile error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────
// PUT /api/user/profile
// Body: { full_name, phone, location, job, avatar_url }
// ─────────────────────────────────────────────────────────────────
profileRouter.put("/", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);
    const body   = profileSchema.parse(req.body);

    const { error } = await supabase
      .from("user_profiles")
      .upsert(
        {
          user_id:    userId,
          full_name:  body.full_name,
          phone:      body.phone,
          location:   body.location,
          job:        body.job,
          avatar_url: body.avatar_url,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }   // upsert by user_id
      );

    if (error) throw error;

    res.json({ ok: true });
  } catch (err: any) {
    console.error("PUT /api/user/profile error:", err);
    res.status(500).json({ error: err.message });
  }
});
