import mongoose, { Schema, type InferSchemaType } from "mongoose";

export const employmentModes = ["SALARIED", "SELF_EMPLOYED", "UNEMPLOYED"] as const;

const loanApplicationSchema = new Schema(
  {
    borrower: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    pan: { type: String, required: true, uppercase: true, trim: true },
    dateOfBirth: { type: Date, required: true },
    monthlySalary: { type: Number, required: true, min: 0 },
    employmentMode: { type: String, enum: employmentModes, required: true },
    eligibilityPassed: { type: Boolean, required: true, default: false },
    eligibilityErrors: [{ type: String }],
    salarySlip: {
      filename: String,
      originalName: String,
      mimeType: String,
      size: Number,
      path: String,
      data: Buffer
    }
  },
  { timestamps: true }
);

export type LoanApplicationDocument = InferSchemaType<typeof loanApplicationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const LoanApplication = mongoose.model<LoanApplicationDocument>(
  "LoanApplication",
  loanApplicationSchema
);
