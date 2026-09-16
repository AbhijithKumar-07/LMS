export type Role = "ADMIN" | "SALES" | "SANCTION" | "DISBURSEMENT" | "COLLECTION" | "BORROWER";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type LoanStatus = "APPLIED" | "SANCTIONED" | "REJECTED" | "DISBURSED" | "CLOSED";

export type Loan = {
  _id: string;
  principal: number;
  tenureDays: number;
  interestRate: number;
  interest: number;
  totalRepayment: number;
  totalPaid: number;
  outstandingAmount: number;
  status: LoanStatus;
  rejectionReason?: string;
  sanctionedAt?: string;
  disbursedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt?: string;
  borrower?: {
    name: string;
    email: string;
  };
  application?: {
    _id?: string;
    fullName: string;
    pan: string;
    monthlySalary: number;
    employmentMode: string;
    salarySlip?: {
      filename?: string;
      originalName?: string;
      mimeType?: string;
      size?: number;
      path?: string;
    };
  };
};

export type AdminAnalytics = {
  financials: {
    totalDisbursed: number;
    totalOutstanding: number;
    totalRepaid: number;
    totalScheduledRepayment: number;
    totalInterest: number;
    recoveryRate: number;
    avgLoanSize: number;
  };
  queues: {
    sales: { count: number; label: string };
    sanction: { count: number; volume: number; label: string };
    disbursement: { count: number; volume: number; label: string };
    collection: { count: number; volume: number; label: string };
  };
  statusMatrix: {
    APPLIED: { count: number; volume: number };
    SANCTIONED: { count: number; volume: number };
    DISBURSED: { count: number; volume: number };
    CLOSED: { count: number; volume: number };
    REJECTED: { count: number; volume: number };
  };
  performance: {
    totalBorrowers: number;
    convertedBorrowers: number;
    conversionRate: number;
    approvalRate: number;
    activeBorrowers: number;
    totalLoans: number;
  };
  activityStream: Array<{
    id: string;
    type: "APPLICATION" | "SANCTION" | "DISBURSEMENT" | "PAYMENT" | "SETTLEMENT" | "REJECTION";
    title: string;
    description: string;
    amount?: number;
    actor?: string;
    timestamp: string;
    statusBadge: string;
    loanId?: string;
  }>;
};
