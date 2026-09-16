import { Router } from "express";
import {
  approveLoan,
  disburseLoan,
  getAdminAnalytics,
  getCollectionHistory,
  getCollectionQueue,
  getDisbursementHistory,
  getDisbursementQueue,
  getSalesLeads,
  getSanctionHistory,
  getSanctionQueue,
  recordPayment,
  rejectLoan,
  streamApplicationSalarySlip
} from "../controllers/dashboard.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/rbac.middleware.js";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get("/admin/analytics", requireRole("ADMIN"), getAdminAnalytics);

dashboardRouter.get("/sales/leads", requireRole("SALES"), getSalesLeads);

dashboardRouter.get("/sanction/loans", requireRole("SANCTION"), getSanctionQueue);
dashboardRouter.get("/sanction/history", requireRole("SANCTION"), getSanctionHistory);
dashboardRouter.get("/documents/:id/salary-slip", requireRole("SANCTION", "ADMIN", "DISBURSEMENT"), streamApplicationSalarySlip);
dashboardRouter.patch("/sanction/loans/:id/approve", requireRole("SANCTION"), approveLoan);
dashboardRouter.patch("/sanction/loans/:id/reject", requireRole("SANCTION"), rejectLoan);

dashboardRouter.get("/disbursement/loans", requireRole("DISBURSEMENT"), getDisbursementQueue);
dashboardRouter.get("/disbursement/history", requireRole("DISBURSEMENT"), getDisbursementHistory);
dashboardRouter.patch("/disbursement/loans/:id/disburse", requireRole("DISBURSEMENT"), disburseLoan);

dashboardRouter.get("/collection/loans", requireRole("COLLECTION"), getCollectionQueue);
dashboardRouter.get("/collection/history", requireRole("COLLECTION"), getCollectionHistory);
dashboardRouter.post("/collection/loans/:id/payments", requireRole("COLLECTION"), recordPayment);
