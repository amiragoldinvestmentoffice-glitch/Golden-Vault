import { Router } from "express";
import { createClient } from "@supabase/supabase-js";
import { requireAuth, getUserId, getUserEmail } from "../middleware/auth";
import { nanoid } from "nanoid";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const referralsRouter = Router();

// ── Get or create the user's referral code ──────────────────
referralsRouter.get("/my-code", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);

    // Check if user already has a code
    const { data: existing } = await supabase
      .from("referral_codes")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (existing) {
      res.json(existing);
      return;
    }

    // Create a new code
    const code = nanoid(8).toUpperCase();
    const { data, error } = await supabase
      .from("referral_codes")
      .insert({ user_id: userId, code })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Get referral stats (how many referred, how much earned) ─
referralsRouter.get("/stats", requireAuth, async (req, res) => {
  try {
    const userId = getUserId(req);

    const { data: referrals, error } = await supabase
      .from("referrals")
      .select("*")
      .eq("referrer_id", userId);

    if (error) throw error;

    const totalReferred = referrals?.length ?? 0;
    const totalEarned = referrals
      ?.filter((r) => r.reward_paid)
      .reduce((sum: number, r: any) => sum + parseFloat(r.reward_usd ?? "0"), 0) ?? 0;
    const pendingRewards = referrals
      ?.filter((r) => !r.reward_paid)
      .length ?? 0;

    res.json({ totalReferred, totalEarned, pendingRewards, referrals });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Validate a referral code (called on signup page) ────────
referralsRouter.get("/validate/:code", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("referral_codes")
      .select("code, user_id")
      .eq("code", req.params.code.toUpperCase())
      .single();

    if (error || !data) {
      res.status(404).json({ valid: false });
      return;
    }
    res.json({ valid: true, code: data.code });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ── Record a referral when a referred user makes first deposit
// Called internally from the payments webhook
export async function recordReferralReward(newUserId: string) {
  try {
    // Check if this user was referred
    const { data: referral } = await supabase
      .from("referrals")
      .select("*")
      .eq("referred_id", newUserId)
      .single();

    if (!referral || referral.reward_paid) return;

    const REWARD_USD = 10; // $10 credit per successful referral

    // Credit the referrer's wallet
    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance_usd")
      .eq("user_id", referral.referrer_id)
      .single();

    const newBalance = parseFloat(wallet?.balance_usd ?? "0") + REWARD_USD;

    await supabase
      .from("wallets")
      .upsert({ user_id: referral.referrer_id, balance_usd: newBalance.toFixed(2) });

    // Mark reward as paid
    await supabase
      .from("referrals")
      .update({ reward_paid: true, reward_usd: REWARD_USD })
      .eq("id", referral.id);

    console.log(`Referral reward of $${REWARD_USD} paid to ${referral.referrer_id}`);
  } catch (err) {
    console.error("Referral reward error:", err);
  }
}
