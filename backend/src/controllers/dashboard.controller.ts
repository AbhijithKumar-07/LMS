import { z } from "zod";
import { Loan } from "../models/loan.model.js";
import { LoanApplication } from "../models/loanApplication.model.js";
import { Payment } from "../models/payment.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";

const rejectionSchema = z.object({
  reason: z.string().min(3)
});

const paymentSchema = z.object({
  utrNumber: z.string().min(4).transform((value) => value.toUpperCase()),
  amount: z.coerce.number().positive(),
  paidAt: z.coerce.date().refine((d) => d.getTime() <= Date.now() + 24 * 60 * 60 * 1000, {
    message: "Payment date cannot be in the future."
  })
});

export const getSalesLeads = asyncHandler(async (_req, res) => {
  const leads = await User.aggregate([
    { $match: { role: "BORROWER" } },
    {
      $lookup: {
        from: "loans",
        localField: "_id",
        foreignField: "borrower",
        as: "loans"
      }
    },
    { $match: { loans: { $size: 0 } } },
    {
      $lookup: {
        from: "loanapplications",
        localField: "_id",
        foreignField: "borrower",
        as: "application"
      }
    },
    {
      $project: {
        passwordHash: 0,
        loans: 0,
        "application.salarySlip.path": 0,
        "application.salarySlip.data": 0
      }
    },
    { $sort: { createdAt: -1 } }
  ]);

  const converted = await User.aggregate([
    { $match: { role: "BORROWER" } },
    {
      $lookup: {
        from: "loans",
        let: { borrowerId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$borrower", "$$borrowerId"] } } },
          { $sort: { createdAt: -1 } }
        ],
        as: "loans"
      }
    },
    { $match: { "loans.0": { $exists: true } } },
    {
      $lookup: {
        from: "loanapplications",
        localField: "_id",
        foreignField: "borrower",
        as: "application"
      }
    },
    {
      $project: {
        passwordHash: 0,
        "application.salarySlip.path": 0,
        "application.salarySlip.data": 0
      }
    },
    { $sort: { "loans.0.createdAt": -1, createdAt: -1 } }
  ]);

  res.json({ leads, converted });
});

export const getSanctionQueue = asyncHandler(async (_req, res) => {
  const loans = await Loan.find({ status: "APPLIED" })
    .populate("borrower", "name email")
    .populate({
      path: "application",
      select: "-salarySlip.data"
    })
    .sort({ createdAt: -1 });
  res.json({ loans });
});

export const getSanctionHistory = asyncHandler(async (_req, res) => {
  const history = await Loan.find({ status: { $in: ["SANCTIONED", "REJECTED", "DISBURSED", "CLOSED"] } })
    .populate("borrower", "name email")
    .populate({
      path: "application",
      select: "-salarySlip.data"
    })
    .sort({ updatedAt: -1 });
  res.json({ history });
});

export const streamApplicationSalarySlip = asyncHandler(async (req, res) => {
  const application = await LoanApplication.findById(req.params.id);
  if (!application || !application.salarySlip?.data) {
    throw new HttpError(404, "Salary slip document not found in database.");
  }

  res.set("Content-Type", application.salarySlip.mimeType || "application/pdf");
  res.set("Content-Disposition", `inline; filename="${application.salarySlip.originalName || "salary-slip.pdf"}"`);
  res.send(application.salarySlip.data);
});

export const approveLoan = asyncHandler(async (req, res) => {
  const loan = await Loan.findById(req.params.id);
  if (!loan) {
    throw new HttpError(404, "Loan not found.");
  }
  if (loan.status !== "APPLIED") {
    throw new HttpError(409, "Only applied loans can be sanctioned.");
  }

  loan.status = "SANCTIONED";
  loan.sanctionedAt = new Date();
  await loan.save();

  res.json({ loan });
});

export const rejectLoan = asyncHandler(async (req, res) => {
  const input = rejectionSchema.parse(req.body);
  const loan = await Loan.findById(req.params.id);
  if (!loan) {
    throw new HttpError(404, "Loan not found.");
  }
  if (loan.status !== "APPLIED") {
    throw new HttpError(409, "Only applied loans can be rejected.");
  }

  loan.status = "REJECTED";
  loan.rejectionReason = input.reason;
  await loan.save();

  res.json({ loan });
});

export const getDisbursementQueue = asyncHandler(async (_req, res) => {
  const loans = await Loan.find({ status: "SANCTIONED" })
    .populate("borrower", "name email")
    .populate("application")
    .sort({ sanctionedAt: -1 });
  res.json({ loans });
});

export const getDisbursementHistory = asyncHandler(async (_req, res) => {
  const history = await Loan.find({ status: { $in: ["DISBURSED", "CLOSED"] } })
    .populate("borrower", "name email")
    .populate({
      path: "application",
      select: "-salarySlip.data"
    })
    .sort({ disbursedAt: -1, updatedAt: -1 });
  res.json({ history });
});

export const disburseLoan = asyncHandler(async (req, res) => {
  const loan = await Loan.findById(req.params.id);
  if (!loan) {
    throw new HttpError(404, "Loan not found.");
  }
  if (loan.status !== "SANCTIONED") {
    throw new HttpError(409, "Only sanctioned loans can be disbursed.");
  }

  loan.status = "DISBURSED";
  loan.disbursedAt = new Date();
  await loan.save();

  res.json({ loan });
});

export const getCollectionQueue = asyncHandler(async (_req, res) => {
  const loans = await Loan.find({ status: "DISBURSED" })
    .populate("borrower", "name email")
    .populate("application")
    .sort({ disbursedAt: -1 });
  res.json({ loans });
});

export const getCollectionHistory = asyncHandler(async (_req, res) => {
  const history = await Loan.find({ status: "CLOSED" })
    .populate("borrower", "name email")
    .populate({
      path: "application",
      select: "-salarySlip.data"
    })
    .sort({ closedAt: -1, updatedAt: -1 });
  res.json({ history });
});

export const recordPayment = asyncHandler(async (req, res) => {
  const input = paymentSchema.parse(req.body);
  const loan = await Loan.findById(req.params.id);

  if (!loan) {
    throw new HttpError(404, "Loan not found.");
  }

  if (loan.status !== "DISBURSED") {
    throw new HttpError(409, "Payments can only be recorded for disbursed loans.");
  }

  if (input.amount > loan.outstandingAmount) {
    throw new HttpError(400, "Payment amount cannot exceed outstanding amount.");
  }

  const existingPayment = await Payment.findOne({ utrNumber: input.utrNumber });
  if (existingPayment) {
    throw new HttpError(409, `UTR number "${input.utrNumber}" has already been used for another payment.`);
  }

  const payment = await Payment.create({
    loan: loan._id,
    utrNumber: input.utrNumber,
    amount: input.amount,
    paidAt: input.paidAt,
    recordedBy: req.user!.id
  });

  loan.totalPaid += input.amount;
  loan.outstandingAmount = Math.max(loan.totalRepayment - loan.totalPaid, 0);

  if (loan.outstandingAmount === 0) {
    loan.status = "CLOSED";
    loan.closedAt = new Date();
  }

  await loan.save();

  res.status(201).json({ payment, loan });
});

export const getAdminAnalytics = asyncHandler(async (_req, res) => {
  const [allLoans, totalBorrowers, recentPayments] = await Promise.all([
    Loan.find()
      .populate("borrower", "name email")
      .populate({
        path: "application",
        select: "fullName monthlySalary pan"
      })
      .sort({ updatedAt: -1 }),
    User.countDocuments({ role: "BORROWER" }),
    Payment.find()
      .populate({
        path: "loan",
        populate: { path: "borrower", select: "name email" }
      })
      .populate("recordedBy", "name email role")
      .sort({ createdAt: -1 })
      .limit(10)
  ]);

  // Aggregate financial metrics
  let totalDisbursed = 0;
  let totalOutstanding = 0;
  let totalRepaid = 0;
  let totalScheduledRepayment = 0;
  let totalInterest = 0;

  // Status distributions and queue counts
  const statusCounts = {
    APPLIED: { count: 0, volume: 0 },
    SANCTIONED: { count: 0, volume: 0 },
    DISBURSED: { count: 0, volume: 0 },
    CLOSED: { count: 0, volume: 0 },
    REJECTED: { count: 0, volume: 0 }
  };

  const borrowerIdsWithLoans = new Set<string>();

  for (const loan of allLoans) {
    const status = loan.status as keyof typeof statusCounts;
    if (statusCounts[status]) {
      statusCounts[status].count += 1;
      statusCounts[status].volume += loan.principal;
    }

    if (loan.borrower) {
      borrowerIdsWithLoans.add(String((loan.borrower as any)._id || loan.borrower));
    }

    if (status === "DISBURSED" || status === "CLOSED") {
      totalDisbursed += loan.principal;
      totalRepaid += loan.totalPaid;
      totalScheduledRepayment += loan.totalRepayment;
      totalInterest += loan.interest;
    }

    if (status === "DISBURSED") {
      totalOutstanding += loan.outstandingAmount;
    }
  }

  const convertedBorrowersCount = borrowerIdsWithLoans.size;
  const prospectLeadsCount = Math.max(0, totalBorrowers - convertedBorrowersCount);
  const conversionRate = totalBorrowers > 0 ? Number(((convertedBorrowersCount / totalBorrowers) * 100).toFixed(1)) : 0;

  const totalDecided = statusCounts.SANCTIONED.count + statusCounts.DISBURSED.count + statusCounts.CLOSED.count + statusCounts.REJECTED.count;
  const totalApproved = statusCounts.SANCTIONED.count + statusCounts.DISBURSED.count + statusCounts.CLOSED.count;
  const approvalRate = totalDecided > 0 ? Number(((totalApproved / totalDecided) * 100).toFixed(1)) : 0;

  const recoveryRate = totalScheduledRepayment > 0 ? Number(((totalRepaid / totalScheduledRepayment) * 100).toFixed(1)) : 0;
  const activeBorrowersCount = statusCounts.DISBURSED.count;
  const avgLoanSize = (statusCounts.DISBURSED.count + statusCounts.CLOSED.count) > 0
    ? Math.round(totalDisbursed / (statusCounts.DISBURSED.count + statusCounts.CLOSED.count))
    : 0;

  // Build Recent Operations Audit Stream
  type AuditEvent = {
    id: string;
    type: "APPLICATION" | "SANCTION" | "DISBURSEMENT" | "PAYMENT" | "SETTLEMENT" | "REJECTION";
    title: string;
    description: string;
    amount?: number;
    actor?: string;
    timestamp: Date;
    statusBadge: string;
    loanId?: string;
  };

  const auditEvents: AuditEvent[] = [];

  // Recent payments
  for (const p of recentPayments) {
    const loanBorrowerName = (p.loan as any)?.borrower?.name || "Borrower";
    const recorderName = (p.recordedBy as any)?.name || "Collections Staff";
    auditEvents.push({
      id: `pay_${p._id}`,
      type: "PAYMENT",
      title: `Payment Recorded (UTR: ${p.utrNumber})`,
      description: `₹${p.amount.toLocaleString("en-IN")} received from ${loanBorrowerName} logged by ${recorderName}`,
      amount: p.amount,
      actor: recorderName,
      timestamp: p.paidAt || (p as any).createdAt,
      statusBadge: "PAYMENT",
      loanId: String((p.loan as any)?._id || "")
    });
  }

  // Recent loan lifecycle events
  for (const l of allLoans.slice(0, 15)) {
    const borrowerName = (l.borrower as any)?.name || "Borrower";
    const shortId = String(l._id).slice(-6).toUpperCase();

    if (l.closedAt) {
      auditEvents.push({
        id: `closed_${l._id}`,
        type: "SETTLEMENT",
        title: `Loan #${shortId} Fully Settled`,
        description: `${borrowerName} completed total repayment of ₹${l.totalRepayment.toLocaleString("en-IN")}`,
        amount: l.totalRepayment,
        timestamp: l.closedAt,
        statusBadge: "CLOSED",
        loanId: String(l._id)
      });
    } else if (l.disbursedAt) {
      auditEvents.push({
        id: `disb_${l._id}`,
        type: "DISBURSEMENT",
        title: `Loan #${shortId} Disbursed`,
        description: `Disbursement of ₹${l.principal.toLocaleString("en-IN")} released to ${borrowerName}`,
        amount: l.principal,
        timestamp: l.disbursedAt,
        statusBadge: "DISBURSED",
        loanId: String(l._id)
      });
    } else if (l.sanctionedAt) {
      auditEvents.push({
        id: `sanc_${l._id}`,
        type: "SANCTION",
        title: `Loan #${shortId} Sanctioned`,
        description: `Credit underwriting approved ₹${l.principal.toLocaleString("en-IN")} for ${borrowerName}`,
        amount: l.principal,
        timestamp: l.sanctionedAt,
        statusBadge: "SANCTIONED",
        loanId: String(l._id)
      });
    } else if (l.status === "REJECTED") {
      auditEvents.push({
        id: `rej_${l._id}`,
        type: "REJECTION",
        title: `Loan #${shortId} Declined`,
        description: `Application from ${borrowerName} declined (${l.rejectionReason || "Criteria not met"})`,
        timestamp: (l as any).updatedAt || (l as any).createdAt,
        statusBadge: "REJECTED",
        loanId: String(l._id)
      });
    } else if (l.status === "APPLIED") {
      auditEvents.push({
        id: `app_${l._id}`,
        type: "APPLICATION",
        title: `New Loan Application #${shortId}`,
        description: `${borrowerName} applied for ₹${l.principal.toLocaleString("en-IN")} (${l.tenureDays} days)`,
        amount: l.principal,
        timestamp: (l as any).createdAt,
        statusBadge: "APPLIED",
        loanId: String(l._id)
      });
    }
  }

  // Sort unified audit stream descending by timestamp
  auditEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json({
    analytics: {
      financials: {
        totalDisbursed,
        totalOutstanding,
        totalRepaid,
        totalScheduledRepayment,
        totalInterest,
        recoveryRate,
        avgLoanSize
      },
      queues: {
        sales: { count: prospectLeadsCount, label: "Prospect Leads" },
        sanction: { count: statusCounts.APPLIED.count, volume: statusCounts.APPLIED.volume, label: "Underwriting Queue" },
        disbursement: { count: statusCounts.SANCTIONED.count, volume: statusCounts.SANCTIONED.volume, label: "Pending Payout" },
        collection: { count: statusCounts.DISBURSED.count, volume: statusCounts.DISBURSED.volume, label: "Active Loans" }
      },
      statusMatrix: statusCounts,
      performance: {
        totalBorrowers,
        convertedBorrowers: convertedBorrowersCount,
        conversionRate,
        approvalRate,
        activeBorrowers: activeBorrowersCount,
        totalLoans: allLoans.length
      },
      activityStream: auditEvents.slice(0, 10)
    }
  });
});
