export const roles = [
  "ADMIN",
  "SALES",
  "SANCTION",
  "DISBURSEMENT",
  "COLLECTION",
  "BORROWER"
] as const;

export type Role = (typeof roles)[number];

export const executiveRoles = ["SALES", "SANCTION", "DISBURSEMENT", "COLLECTION"] as const;
