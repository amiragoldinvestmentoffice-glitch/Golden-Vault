import { Request, Response, NextFunction } from "express";
import { clerkMiddleware, getAuth } from "@clerk/express";

export const clerkAuth = clerkMiddleware();

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  if (!auth.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

export function getUserId(req: Request): string {
  const auth = getAuth(req);
  if (!auth.userId) throw new Error("Not authenticated");
  return auth.userId;
}
