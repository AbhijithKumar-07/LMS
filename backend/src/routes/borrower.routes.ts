import { Router } from "express";
import {
  applyForLoan,
  getMyLoans,
  getMyApplication,
  streamMySalarySlip,
  uploadSalarySlip as uploadSalarySlipController,
  upsertPersonalDetails
} from "../controllers/borrower.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";
import { uploadSalarySlip } from "../middleware/upload.middleware.js";

export const borrowerRouter = Router();

borrowerRouter.use(requireAuth, requireRole("BORROWER"));
borrowerRouter.get("/application", getMyApplication);
borrowerRouter.get("/salary-slip/document", streamMySalarySlip);
borrowerRouter.post("/personal-details", upsertPersonalDetails);
borrowerRouter.post("/salary-slip", uploadSalarySlip.single("salarySlip"), uploadSalarySlipController);
borrowerRouter.post("/loans", applyForLoan);
borrowerRouter.get("/loans", getMyLoans);

