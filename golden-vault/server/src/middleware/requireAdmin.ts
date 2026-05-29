import { Request, Response, NextFunction } from "express";
import { clerkClient } from "@clerk/express";
import { getUserId } from "./auth";

const ADMIN_EMAIL = "amiragoldinvestmentoffice@gmail.com";

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = getUserId(req);
    const user = await clerkClient.users.getUser(userId);
    const email = user.emailAddresses?.[0]?.emailAddress ?? "";
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  } catch {
    res.status(403).json({ error: "Forbidden" });
  }
}
