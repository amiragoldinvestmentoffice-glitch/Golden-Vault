import { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";

// ── Single shared Supabase client (not recreated per request) ────────────────
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Rate limiting store (in-memory, per IP) ──────────────────────────────────
// Prevents brute-force token probing — max 60 auth attempts per IP per minute
const authAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_AUTH_ATTEMPTS = 60;
const AUTH_WINDOW_MS = 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = authAttempts.get(ip);

  if (!record || now > record.resetAt) {
    authAttempts.set(ip, { count: 1, resetAt: now + AUTH_WINDOW_MS });
    return false;
  }

  record.count++;
  if (record.count > MAX_AUTH_ATTEMPTS) return true;
  return false;
}

// Clean up stale entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of authAttempts.entries()) {
    if (now > record.resetAt) authAttempts.delete(ip);
  }
}, 5 * 60 * 1000);

// ── Token format validation (Supabase JWTs are 3-part dot-separated) ─────────
function isValidTokenFormat(token: string): boolean {
  // Must be a 3-segment JWT, no whitespace, reasonable length
  if (!token || token.length < 20 || token.length > 2048) return false;
  if (/\s/.test(token)) return false;
  const parts = token.split(".");
  return parts.length === 3;
}

// ── Main auth middleware ──────────────────────────────────────────────────────
export async function supabaseAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  // No auth header — unauthenticated request, let routes decide
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.slice(7); // safer than .replace()

  // Validate token format before hitting Supabase
  if (!isValidTokenFormat(token)) {
    return res.status(401).json({ error: "Invalid token format" });
  }

  // Rate limit by IP
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
    req.socket.remoteAddress ||
    "unknown";

  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Too many requests" });
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (!error && user) {
      // Only attach verified, confirmed users
      if (!user.id || !user.email) {
        return res.status(401).json({ error: "Incomplete user record" });
      }
      // Block banned users
      if (user.banned_until && new Date(user.banned_until) > new Date()) {
        return res.status(403).json({ error: "Account suspended" });
      }
      (req as any).user = user;
    }
    // Invalid token — don't error, let routes enforce auth
  } catch (err) {
    // Log unexpected errors but don't expose internals
    console.error("[Auth] Unexpected error during token verification:", err);
  }

  return next();
}

// ── Route guard: must be authenticated ───────────────────────────────────────
export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!(req as any).user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return next();
}

// ── Route guard: must be admin ───────────────────────────────────────────────
// Reads admin status from Supabase user_metadata set server-side only
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  // Check app_metadata (set by service role only — tamper-proof)
  // NOT user_metadata (user-editable)
  const isAdmin =
    user.app_metadata?.role === "admin" ||
    user.app_metadata?.is_admin === true;

  if (!isAdmin) {
    return res.status(403).json({ error: "Forbidden" });
  }
  return next();
}

// ── Safe helpers ─────────────────────────────────────────────────────────────
export function getUserId(req: Request): string {
  const user = (req as any).user;
  if (!user?.id) throw new Error("Not authenticated");
  return user.id;
}

export function getUserEmail(req: Request): string | undefined {
  return (req as any).user?.email;
}

export function getUser(req: Request) {
  return (req as any).user ?? null;
}
