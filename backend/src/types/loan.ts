export const loanStatuses = ["APPLIED", "SANCTIONED", "REJECTED", "DISBURSED", "CLOSED"] as const;

export type LoanStatus = (typeof loanStatuses)[number];
