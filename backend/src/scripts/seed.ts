import bcrypt from "bcryptjs";
import { connectDb } from "../config/db.js";
import { Loan } from "../models/loan.model.js";
import { LoanApplication } from "../models/loanApplication.model.js";
import { Payment } from "../models/payment.model.js";
import { User } from "../models/user.model.js";
import { calculateLoanRepayment } from "../utils/loanMath.js";
import type { Role } from "../types/roles.js";

const internalUsers: Array<{ name: string; email: string; role: Role; password: string }> = [
  { name: "Admin User", email: "admin@lms.test", role: "ADMIN", password: "Password@123" },
  { name: "Sales Executive", email: "sales@lms.test", role: "SALES", password: "Password@123" },
  { name: "Sanction Executive", email: "sanction@lms.test", role: "SANCTION", password: "Password@123" },
  {
    name: "Disbursement Executive",
    email: "disbursement@lms.test",
    role: "DISBURSEMENT",
    password: "Password@123"
  },
  {
    name: "Collection Executive",
    email: "collection@lms.test",
    role: "COLLECTION",
    password: "Password@123"
  },
  { name: "Borrower User", email: "borrower@lms.test", role: "BORROWER", password: "Password@123" }
];

async function seed() {
  await connectDb();
  console.log("Connected to MongoDB for seeding...");

  // 1. Seed Core Evaluator Accounts
  const seededUsers: Record<string, any> = {};
  for (const item of internalUsers) {
    const passwordHash = await bcrypt.hash(item.password, 10);
    const user = await User.findOneAndUpdate(
      { email: item.email },
      { name: item.name, email: item.email, role: item.role, passwordHash },
      { upsert: true, new: true }
    );
    seededUsers[item.role] = user;
    console.log(`[OK] Seeded Role: ${item.role} (${item.email})`);
  }

  const collectionOfficer = seededUsers["COLLECTION"];

  // 2. Demo Borrower Profiles & Loan Lifecycle Data
  const demoBorrowers = [
    // Lead 1: Registered borrower with no application (Sales Lead)
    {
      name: "Rohit Sharma",
      email: "rohit.sharma@example.com",
      role: "BORROWER" as Role,
      password: "Password@123",
      application: null,
      loan: null
    },
    // Lead 2: Registered borrower with no application (Sales Lead)
    {
      name: "Ananya Deshmukh",
      email: "ananya.deshmukh@example.com",
      role: "BORROWER" as Role,
      password: "Password@123",
      application: null,
      loan: null
    },
    // Loan 1: Applied Loan (Awaiting Sanction Review)
    {
      name: "Priya Patel",
      email: "priya.patel@example.com",
      role: "BORROWER" as Role,
      password: "Password@123",
      application: {
        fullName: "Priya Patel",
        pan: "ABCDE1234F",
        dateOfBirth: new Date("1995-04-12"),
        monthlySalary: 75000,
        employmentMode: "SALARIED",
        eligibilityPassed: true,
        eligibilityErrors: [],
        salarySlip: {
          filename: "priya_salary_slip.pdf",
          originalName: "Priya_Salary_Slip_Aug2026.pdf",
          mimeType: "application/pdf",
          size: 102400,
          data: Buffer.from("PDF Mock Content")
        }
      },
      loan: {
        principal: 150000,
        tenureDays: 90,
        status: "APPLIED" as const
      }
    },
    // Loan 2: Sanctioned Loan (Awaiting Disbursement)
    {
      name: "Amit Verma",
      email: "amit.verma@example.com",
      role: "BORROWER" as Role,
      password: "Password@123",
      application: {
        fullName: "Amit Verma",
        pan: "BGHYU7890K",
        dateOfBirth: new Date("1991-08-23"),
        monthlySalary: 95000,
        employmentMode: "SALARIED",
        eligibilityPassed: true,
        eligibilityErrors: [],
        salarySlip: {
          filename: "amit_salary_slip.pdf",
          originalName: "SalarySlip_AmitVerma.pdf",
          mimeType: "application/pdf",
          size: 120500,
          data: Buffer.from("PDF Mock Content")
        }
      },
      loan: {
        principal: 250000,
        tenureDays: 180,
        status: "SANCTIONED" as const,
        sanctionedAt: new Date(Date.now() - 2 * 86400000)
      }
    },
    // Loan 3: Disbursed Loan (Active Repayments in Collections)
    {
      name: "Neha Singh",
      email: "neha.singh@example.com",
      role: "BORROWER" as Role,
      password: "Password@123",
      application: {
        fullName: "Neha Singh",
        pan: "CPQWE4567M",
        dateOfBirth: new Date("1989-11-05"),
        monthlySalary: 62000,
        employmentMode: "SALARIED",
        eligibilityPassed: true,
        eligibilityErrors: [],
        salarySlip: {
          filename: "neha_salary_slip.pdf",
          originalName: "Neha_SalarySlip.pdf",
          mimeType: "application/pdf",
          size: 89000,
          data: Buffer.from("PDF Mock Content")
        }
      },
      loan: {
        principal: 100000,
        tenureDays: 60,
        status: "DISBURSED" as const,
        sanctionedAt: new Date(Date.now() - 10 * 86400000),
        disbursedAt: new Date(Date.now() - 8 * 86400000),
        payments: [
          {
            utrNumber: "UTR98231478201",
            amount: 40000,
            paidAt: new Date(Date.now() - 3 * 86400000)
          }
        ]
      }
    },
    // Loan 4: Closed Loan (Fully Repaid)
    {
      name: "Vikram Mehta",
      email: "vikram.mehta@example.com",
      role: "BORROWER" as Role,
      password: "Password@123",
      application: {
        fullName: "Vikram Mehta",
        pan: "DLKJH1234P",
        dateOfBirth: new Date("1986-02-18"),
        monthlySalary: 110000,
        employmentMode: "SELF_EMPLOYED",
        eligibilityPassed: true,
        eligibilityErrors: [],
        salarySlip: {
          filename: "vikram_salary_slip.pdf",
          originalName: "ITR_VikramMehta.pdf",
          mimeType: "application/pdf",
          size: 145000,
          data: Buffer.from("PDF Mock Content")
        }
      },
      loan: {
        principal: 50000,
        tenureDays: 30,
        status: "CLOSED" as const,
        sanctionedAt: new Date(Date.now() - 40 * 86400000),
        disbursedAt: new Date(Date.now() - 38 * 86400000),
        closedAt: new Date(Date.now() - 5 * 86400000),
        payments: [
          {
            utrNumber: "UTR11928374652",
            amount: 30000,
            paidAt: new Date(Date.now() - 20 * 86400000)
          },
          {
            utrNumber: "UTR88291039485",
            amount: 20493, // covers rest of liability
            paidAt: new Date(Date.now() - 5 * 86400000)
          }
        ]
      }
    },
    // Loan 5: Rejected Loan (Underwriting Audit)
    {
      name: "Rahul Kumar",
      email: "rahul.kumar@example.com",
      role: "BORROWER" as Role,
      password: "Password@123",
      application: {
        fullName: "Rahul Kumar",
        pan: "ERRRR9999Z",
        dateOfBirth: new Date("1998-07-14"),
        monthlySalary: 28000,
        employmentMode: "SALARIED",
        eligibilityPassed: true,
        eligibilityErrors: [],
        salarySlip: {
          filename: "rahul_salary_slip.pdf",
          originalName: "SalarySlip_Rahul.pdf",
          mimeType: "application/pdf",
          size: 95000,
          data: Buffer.from("PDF Mock Content")
        }
      },
      loan: {
        principal: 450000,
        tenureDays: 365,
        status: "REJECTED" as const,
        rejectionReason: "Debt-to-income ratio exceeds 60% threshold for requested 4.5L principal."
      }
    }
  ];

  for (const borrowerData of demoBorrowers) {
    const passwordHash = await bcrypt.hash(borrowerData.password, 10);
    const user = await User.findOneAndUpdate(
      { email: borrowerData.email },
      {
        name: borrowerData.name,
        email: borrowerData.email,
        role: borrowerData.role,
        passwordHash
      },
      { upsert: true, new: true }
    );

    if (borrowerData.application) {
      const appDoc = await LoanApplication.findOneAndUpdate(
        { borrower: user._id },
        { ...borrowerData.application, borrower: user._id },
        { upsert: true, new: true }
      );

      if (borrowerData.loan) {
        const terms = calculateLoanRepayment(
          borrowerData.loan.principal,
          borrowerData.loan.tenureDays
        );

        let totalPaid = 0;
        const paymentsList = (borrowerData.loan as any).payments || [];
        for (const p of paymentsList) {
          totalPaid += p.amount;
        }

        const outstandingAmount = Math.max(0, terms.totalRepayment - totalPaid);

        const loanDoc = await Loan.findOneAndUpdate(
          { borrower: user._id },
          {
            borrower: user._id,
            application: appDoc._id,
            principal: borrowerData.loan.principal,
            tenureDays: borrowerData.loan.tenureDays,
            interestRate: terms.interestRate,
            interest: terms.interest,
            totalRepayment: terms.totalRepayment,
            totalPaid,
            outstandingAmount,
            status: borrowerData.loan.status,
            rejectionReason: borrowerData.loan.rejectionReason,
            sanctionedAt: (borrowerData.loan as any).sanctionedAt,
            disbursedAt: (borrowerData.loan as any).disbursedAt,
            closedAt: (borrowerData.loan as any).closedAt
          },
          { upsert: true, new: true }
        );

        // Seed individual payment receipts
        for (const p of paymentsList) {
          await Payment.findOneAndUpdate(
            { utrNumber: p.utrNumber },
            {
              loan: loanDoc._id,
              utrNumber: p.utrNumber,
              amount: p.amount,
              paidAt: p.paidAt,
              recordedBy: collectionOfficer._id
            },
            { upsert: true, new: true }
          );
        }
      }
    }
    console.log(`[OK] Populated demo records for ${borrowerData.name}`);
  }

  console.log("\n Successfully populated database with full demo lifecycle data!");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
