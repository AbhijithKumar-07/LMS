import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/httpError.js";
import { verifyToken } from "../utils/jwt.js";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization");
  const token =
    header?.startsWith("Bearer ")
      ? header.slice(7)
      : typeof req.query.token === "string"
      ? req.query.token
      : undefined;

  if (!token) {
    return next(new HttpError(401, "Authentication required."));
  }

  try {
    const payload = verifyToken(token);
    req.user = {
      id: payload.sub,
      role: payload.role
    };
    return next();
  } catch {
    return next(new HttpError(401, "Invalid or expired token."));
  }
}
