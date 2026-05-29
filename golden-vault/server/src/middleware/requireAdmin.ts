import { Request, Response, NextFunction } from "express";

const ADMIN_EMAIL = "amiragoldinvestmentoffice@gmail.com";

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const user = (req as any).user;
    const email = user?.email ?? "";
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  } catch {
    res.status(403).json({ error: "Forbidden" });
  }
}
