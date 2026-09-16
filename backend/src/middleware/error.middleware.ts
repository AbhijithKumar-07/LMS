import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { HttpError } from "../utils/httpError.js";

export const errorMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      message: "Validation failed.",
      errors: err.flatten()
    });
    return;
  }

  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      message: err.message,
      details: err.details
    });
    return;
  }

  if (err?.code === 11000) {
    res.status(409).json({
      message: "A record with this unique value already exists.",
      details: err.keyValue
    });
    return;
  }

  res.status(500).json({
    message: "Internal server error."
  });
};
