import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const newsletterRouter = Router();

const subscribeSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

// POST /api/newsletter/subscribe
newsletterRouter.post("/subscribe", async (req, res) => {
  try {
    const { name, email } = subscribeSchema.parse(req.body);

    // Check if already subscribed
    const { data: existing } = await supabase
      .from("newsletter_subscribers")
      .select("id, active")
      .eq("email", email)
      .single();

    if (existing) {
      if (existing.active) {
        res.status(200).json({ message: "already_subscribed" });
        return;
      }
      // Re-activate if they previously unsubscribed
      await supabase
        .from("newsletter_subscribers")
        .update({ active: true, name })
        .eq("email", email);
      res.json({ message: "resubscribed" });
      return;
    }

    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ name, email, active: true });

    if (error) throw error;
    res.status(201).json({ message: "subscribed" });
  } catch (err: any) {
    if (err.name === "ZodError") {
      res.status(400).json({ error: "Please enter a valid name and email" });
      return;
    }
    res.status(500).json({ error: err.message });
  }
});
