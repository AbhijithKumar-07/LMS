import { z } from "zod";
import { Loan } from "../models/loan.model.js";
import { LoanApplication } from "../models/loanApplication.model.js";
import { runEligibility } from "../services/bre.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { calculateLoanRepayment } from "../utils/loanMath.js";

const personalDetailsSchema = z.object({
  fullName: z.string().min(2),
  pan: z.string().trim().transform((value) => value.toUpperCase()),
  dateOfBirth: z.coerce.date(),
  monthlySalary: z.coerce.number().min(0),
  employmentMode: z.enum(["SALARIED", "SELF_EMPLOYED", "UNEMPLOYED"])
});

const applyLoanSchema = z.object({
  principal: z.coerce.number().min(50000).max(500000),
  tenureDays: z.coerce.number().int().min(30).max(365)
});

export const upsertPersonalDetails = asyncHandler(async (req, res) => {
  const input = personalDetailsSchema.parse(req.body);
  const eligibility = runEligibility(input);

  if (!eligibility.eligible) {
    await LoanApplication.findOneAndUpdate(
      { borrower: req.user!.id },
      {
        ...input,
        borrower: req.user!.id,
        eligibilityPassed: false,
        eligibilityErrors: eligibility.errors
      },
      { upsert: true, new: true, runValidators: true }
    );
    throw new HttpError(422, "Eligibility check failed.", eligibility.errors);
  }

  const application = await LoanApplication.findOneAndUpdate(
    { borrower: req.user!.id },
    {
      ...input,
      borrower: req.user!.id,
      eligibilityPassed: true,
      eligibilityErrors: []
    },
    { upsert: true, new: true, runValidators: true }
  );

  res.json({ application });
});

export const uploadSalarySlip = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new HttpError(400, "Salary slip file is required.");
  }

  const application = await LoanApplication.findOne({ borrower: req.user!.id });
  if (!application || !application.eligibilityPassed) {
    throw new HttpError(400, "Complete eligible personal details before uploading salary slip.");
  }

  application.salarySlip = {
    filename: req.file.originalname,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    path: `db://${application._id}`,
    data: req.file.buffer
  };
  await application.save();

  const safeApp = application.toObject();
  if (safeApp.salarySlip) {
    delete (safeApp.salarySlip as any).data;
  }

  res.json({ application: safeApp });
});

export const streamMySalarySlip = asyncHandler(async (req, res) => {
  const application = await LoanApplication.findOne({ borrower: req.user!.id });
  if (!application || !application.salarySlip?.data) {
    throw new HttpError(404, "Salary slip not found in database.");
  }

  res.set("Content-Type", application.salarySlip.mimeType || "application/pdf");
  res.set("Content-Disposition", `inline; filename="${application.salarySlip.originalName || "salary-slip.pdf"}"`);
  res.send(application.salarySlip.data);
});

export const applyForLoan = asyncHandler(async (req, res) => {
  const input = applyLoanSchema.parse(req.body);
  const application = await LoanApplication.findOne({ borrower: req.user!.id });

  if (!application || !application.eligibilityPassed) {
    throw new HttpError(400, "Eligible application details are required before applying.");
  }

  if (!application.salarySlip?.originalName && !application.salarySlip?.data && !application.salarySlip?.path) {
    throw new HttpError(400, "Salary slip is required before applying.");
  }

  const existingActiveLoan = await Loan.findOne({
    borrower: req.user!.id,
    status: { $in: ["APPLIED", "SANCTIONED", "DISBURSED"] }
  });
  if (existingActiveLoan) {
    throw new HttpError(409, "You already have an active loan request.");
  }

  const repayment = calculateLoanRepayment(input.principal, input.tenureDays);
  const loan = await Loan.create({
    borrower: req.user!.id,
    application: application._id,
    principal: input.principal,
    tenureDays: input.tenureDays,
    ...repayment,
    outstandingAmount: repayment.totalRepayment,
    status: "APPLIED"
  });

  res.status(201).json({ loan });
});

export const getMyLoans = asyncHandler(async (req, res) => {
  const loans = await Loan.find({ borrower: req.user!.id }).sort({ createdAt: -1 });
  res.json({ loans });
});

export const getMyApplication = asyncHandler(async (req, res) => {
  const application = await LoanApplication.findOne({ borrower: req.user!.id }).select("-salarySlip.data");
  res.json({ application });
});

