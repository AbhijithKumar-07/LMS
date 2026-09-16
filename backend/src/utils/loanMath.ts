export const FIXED_INTEREST_RATE = 12;

export function calculateLoanRepayment(principal: number, tenureDays: number) {
  const interest = (principal * FIXED_INTEREST_RATE * tenureDays) / (365 * 100);
  const totalRepayment = principal + interest;

  return {
    interestRate: FIXED_INTEREST_RATE,
    interest: Math.round(interest),
    totalRepayment: Math.round(totalRepayment)
  };
}
