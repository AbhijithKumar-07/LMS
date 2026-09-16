export type EligibilityInput = {
  pan: string;
  dateOfBirth: Date;
  monthlySalary: number;
  employmentMode: "SALARIED" | "SELF_EMPLOYED" | "UNEMPLOYED";
};

export type EligibilityResult = {
  eligible: boolean;
  errors: string[];
};

const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export function calculateAge(dateOfBirth: Date, today = new Date()) {
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDelta = today.getMonth() - dateOfBirth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dateOfBirth.getDate())) {
    age -= 1;
  }
  return age;
}

export function runEligibility(input: EligibilityInput): EligibilityResult {
  const errors: string[] = [];
  const age = calculateAge(input.dateOfBirth);

  if (age < 23 || age > 50) {
    errors.push("Age must be between 23 and 50 years.");
  }

  if (input.monthlySalary < 25000) {
    errors.push("Monthly salary must be at least 25000.");
  }

  if (!panRegex.test(input.pan.toUpperCase())) {
    errors.push("PAN must match the format ABCDE1234F.");
  }

  if (input.employmentMode === "UNEMPLOYED") {
    errors.push("Applicant cannot be unemployed.");
  }

  return {
    eligible: errors.length === 0,
    errors
  };
}
