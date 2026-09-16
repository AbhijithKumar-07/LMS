import mongoose, { Schema, type InferSchemaType } from "mongoose";
import { loanStatuses } from "../types/loan.js";

const loanSchema = new Schema(
  {
    borrower: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    application: { type: Schema.Types.ObjectId, ref: "LoanApplication", required: true },
    principal: { type: Number, required: true, min: 50000, max: 500000 },
    tenureDays: { type: Number, required: true, min: 30, max: 365 },
    interestRate: { type: Number, required: true },
    interest: { type: Number, required: true, min: 0 },
    totalRepayment: { type: Number, required: true, min: 0 },
    totalPaid: { type: Number, required: true, default: 0, min: 0 },
    outstandingAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: loanStatuses, required: true, default: "APPLIED" },
    rejectionReason: { type: String, trim: true },
    sanctionedAt: Date,
    disbursedAt: Date,
    closedAt: Date
  },
  { timestamps: true }
);

loanSchema.index({ borrower: 1, status: 1 });

export type LoanDocument = InferSchemaType<typeof loanSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Loan = mongoose.model<LoanDocument>("Loan", loanSchema);
