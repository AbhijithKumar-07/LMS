import type { NextFunction, Request, Response } from "express";
import type { Role } from "../types/roles.js";
import { HttpError } from "../utils/httpError.js";

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new HttpError(401, "Authentication required."));
    }

    if (req.user.role === "ADMIN" || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return next(new HttpError(403, "You do not have permission to access this resource."));
  };
}
