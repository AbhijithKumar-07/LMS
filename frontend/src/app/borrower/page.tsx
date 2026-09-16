"use client";

import {
  Calculator,
  FileUp,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  FileText,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Receipt,
  Trash2,
  Check
} from "lucide-react";
import { ChangeEvent, SyntheticEvent, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";
import {
  buttonClass,
  BorrowerPortalSkeleton,
  Field,
  inputClass,
  selectClass,
  Notice,
  secondaryButtonClass,
  StatusBadge,
  ProgressBar
} from "@/components/ui";
import { apiRequest, formatCurrency, formatDate } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { Loan, LoanStatus, User } from "@/types";

function calculateRepayment(principal: number, tenureDays: number) {
  const interest = Math.round((principal * 12 * tenureDays) / (365 * 100));
  return {
    interest,
    total: principal + interest
  };
}

const lifecycleSteps: LoanStatus[] = ["APPLIED", "SANCTIONED", "DISBURSED", "CLOSED"];

import { getLocalCache, setLocalCache } from "@/lib/cache";

type BorrowerCachedData = {
  application?: any;
  loans?: Loan[];
  currentStep?: 1 | 2 | 3 | 4;
};

export default function BorrowerPage() {
  return (
    <AuthGate allow={["BORROWER"]}>
      {(user) => (
        <AppShell user={user} section="borrower">
          <BorrowerPortal key={user?.id || user?.email || "borrower"} user={user} />
        </AppShell>
      )}
    </AuthGate>
  );
}

function BorrowerPortal({ user }: { user: User }) {
  const cacheKey = `lms_cache_borrower_${user?.id || user?.email || "default"}`;
  const draftKey = `lms_borrower_draft_${user?.id || user?.email || "default"}`;

  const cached = getLocalCache<BorrowerCachedData>(cacheKey);

  const [currentStep, setCurrentStepState] = useState<1 | 2 | 3 | 4>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("lms_borrower_step");
        if (saved && ["1", "2", "3", "4"].includes(saved)) {
          return Number(saved) as 1 | 2 | 3 | 4;
        }
      } catch {
        // Ignore
      }
    }
    if (cached?.loans && cached.loans.length > 0) return 4;
    if (cached?.application?.salarySlip?.originalName) return 3;
    if (cached?.application?.eligibilityPassed) return 2;
    return 1;
  });

  const setCurrentStep = (step: 1 | 2 | 3 | 4) => {
    setCurrentStepState(step);
    setMessage(null);
    try {
      sessionStorage.setItem("lms_borrower_step", String(step));
    } catch {
      // Ignore
    }
  };

  const [message, setMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
    title?: string;
  } | null>(null);

  // Auto-dismiss notification banner after 4.5 seconds
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      setMessage(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [message]);

  const [loans, setLoans] = useState<Loan[]>(() => cached?.loans || []);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(() => !cached);
  const [principal, setPrincipal] = useState(100000);
  const [tenureDays, setTenureDays] = useState(90);
  const [salarySlip, setSalarySlip] = useState<File | null>(null);
  const [slipFileName, setSlipFileName] = useState(() => cached?.application?.salarySlip?.originalName || "");

  // Form states initialized clean per user
  const [fullNameInput, setFullNameInput] = useState(() => cached?.application?.fullName || user?.name || "");
  const [panInput, setPanInput] = useState(() => cached?.application?.pan || "");
  const [dobInput, setDobInput] = useState(() => {
    if (cached?.application?.dateOfBirth) {
      try {
        return new Date(cached.application.dateOfBirth).toISOString().split("T")[0];
      } catch {
        return "";
      }
    }
    return "";
  });
  const [salaryInput, setSalaryInput] = useState(() => (cached?.application?.monthlySalary ? String(cached.application.monthlySalary) : ""));
  const [employmentInput, setEmploymentInput] = useState(() => cached?.application?.employmentMode || "SALARIED");
  const [eligibilityPassed, setEligibilityPassed] = useState(() => Boolean(cached?.application?.eligibilityPassed));
  const [slipUploaded, setSlipUploaded] = useState(() => Boolean(cached?.application?.salarySlip?.originalName || cached?.application?.salarySlip?.path));
  const [loanApplied, setLoanApplied] = useState(() => (cached?.loans && cached.loans.length > 0) || false);

  // Helper to persist current in-progress application draft
  const saveDraft = (overrides?: Record<string, any>) => {
    try {
      const data = {
        fullName: overrides?.fullName !== undefined ? overrides.fullName : fullNameInput,
        pan: overrides?.pan !== undefined ? overrides.pan : panInput,
        dateOfBirth: overrides?.dateOfBirth !== undefined ? overrides.dateOfBirth : dobInput,
        monthlySalary: overrides?.monthlySalary !== undefined ? overrides.monthlySalary : salaryInput,
        employmentMode: overrides?.employmentMode !== undefined ? overrides.employmentMode : employmentInput,
        eligibilityPassed: overrides?.eligibilityPassed !== undefined ? overrides.eligibilityPassed : eligibilityPassed,
        slipUploaded: overrides?.slipUploaded !== undefined ? overrides.slipUploaded : slipUploaded,
        slipFileName: overrides?.slipFileName !== undefined ? overrides.slipFileName : slipFileName,
        loanApplied: overrides?.loanApplied !== undefined ? overrides.loanApplied : loanApplied,
      };
      sessionStorage.setItem(draftKey, JSON.stringify(data));
    } catch {
      // Ignore
    }
  };

  // Initial load for application data and active loans without overwriting in-progress draft
  useEffect(() => {
    let isCancelled = false;

    async function initializePortal() {
      try {
        const token = getToken();
        if (!token) return;

        const [appRes, loansRes] = await Promise.allSettled([
          apiRequest<{ application: any }>("/borrower/application", { token }),
          apiRequest<{ loans: Loan[] }>("/borrower/loans", { token })
        ]);

        if (isCancelled) return;

        if (loansRes.status === "fulfilled" && loansRes.value?.loans) {
          setLoans(loansRes.value.loans);
        }

        // 1. Check if user has an active session draft first
        const savedDraftRaw = sessionStorage.getItem(draftKey);
        if (savedDraftRaw) {
          try {
            const draft = JSON.parse(savedDraftRaw);
            setFullNameInput(draft.fullName ?? user?.name ?? "");
            setPanInput(draft.pan ?? "");
            setDobInput(draft.dateOfBirth ?? "");
            setSalaryInput(draft.monthlySalary ?? "");
            setEmploymentInput(draft.employmentMode ?? "SALARIED");
            setEligibilityPassed(Boolean(draft.eligibilityPassed));
            setSlipUploaded(Boolean(draft.slipUploaded));
            setSlipFileName(draft.slipFileName ?? "");
            setLoanApplied(Boolean(draft.loanApplied));
            return;
          } catch {
            // Fallback to backend data
          }
        }

        // 2. If no active draft in sessionStorage, populate from backend application
        if (appRes.status === "fulfilled" && appRes.value?.application) {
          const app = appRes.value.application;
          if (app.fullName) setFullNameInput(app.fullName);
          if (app.pan) setPanInput(app.pan);
          if (app.dateOfBirth) {
            const d = new Date(app.dateOfBirth);
            if (!isNaN(d.getTime())) {
              setDobInput(d.toISOString().split("T")[0]);
            }
          }
          if (app.monthlySalary) setSalaryInput(String(app.monthlySalary));
          if (app.employmentMode) setEmploymentInput(app.employmentMode);
          if (app.eligibilityPassed !== undefined) setEligibilityPassed(app.eligibilityPassed);
          if (app.salarySlip?.originalName || app.salarySlip?.path) {
            setSlipUploaded(true);
            setSlipFileName(app.salarySlip.originalName || "Uploaded Salary Slip");
          }
          const hasSubmittedLoan = loansRes.status === "fulfilled" && (loansRes.value?.loans?.length ?? 0) > 0;
          setLoanApplied(hasSubmittedLoan);

          const savedStep = sessionStorage.getItem("lms_borrower_step");
          if (savedStep) {
            const stepNum = Number(savedStep);
            if (stepNum >= 1 && stepNum <= 4) {
              setCurrentStepState(stepNum as 1 | 2 | 3 | 4);
            }
          } else if (hasSubmittedLoan) {
            setCurrentStepState(4);
            try {
              sessionStorage.setItem("lms_borrower_step", "4");
            } catch {}
          }

          // Cache current backend state
          setLocalCache(cacheKey, {
            application: app,
            loans: loansRes.status === "fulfilled" ? loansRes.value.loans : [],
            currentStep: savedStep ? Number(savedStep) : (hasSubmittedLoan ? 4 : (app.salarySlip?.originalName ? 3 : (app.eligibilityPassed ? 2 : 1)))
          });
        } else {
          // Fresh account with no application yet
          setFullNameInput(user?.name || "");
          setPanInput("");
          setDobInput("");
          setSalaryInput("");
          setEmploymentInput("SALARIED");
          setEligibilityPassed(false);
          setSlipUploaded(false);
          setSlipFileName("");
          setLoanApplied(false);
          setLocalCache(cacheKey, { application: null, loans: [] });
        }
      } catch {
        if (isCancelled) return;
        setFullNameInput(user?.name || "");
        setPanInput("");
        setDobInput("");
        setSalaryInput("");
        setEmploymentInput("SALARIED");
        setEligibilityPassed(false);
        setSlipUploaded(false);
        setSlipFileName("");
        setLoanApplied(false);
      } finally {
        if (!isCancelled) {
          setInitialLoading(false);
        }
      }
    }

    initializePortal();

    return () => {
      isCancelled = true;
    };
  }, [user?.id, user?.email, user?.name, draftKey]);

  const repayment = useMemo(
    () => calculateRepayment(principal, tenureDays),
    [principal, tenureDays]
  );

  // Live age calculation
  const calculatedAge = useMemo(() => {
    if (!dobInput) return null;
    const dob = new Date(dobInput);
    if (isNaN(dob.getTime())) return null;
    const diffMs = Date.now() - dob.getTime();
    const ageDate = new Date(diffMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  }, [dobInput]);

  const isPanValid = useMemo(() => {
    return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panInput.trim().toUpperCase());
  }, [panInput]);

  function startNewApplication() {
    const blank = {
      fullName: user?.name || "",
      pan: "",
      dateOfBirth: "",
      monthlySalary: "",
      employmentMode: "SALARIED",
      eligibilityPassed: false,
      slipUploaded: false,
      slipFileName: "",
      loanApplied: false
    };
    try {
      sessionStorage.setItem(draftKey, JSON.stringify(blank));
    } catch {
      // Ignore
    }
    setFullNameInput(blank.fullName);
    setPanInput("");
    setDobInput("");
    setSalaryInput("");
    setEmploymentInput("SALARIED");
    setEligibilityPassed(false);
    setSlipUploaded(false);
    setSlipFileName("");
    setLoanApplied(false);
    setSalarySlip(null);
    setPrincipal(100000);
    setTenureDays(90);
    setMessage(null);
    setCurrentStep(1);
    const fileInput = document.getElementById("salarySlipInput") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  }

  async function refreshLoans() {
    setMessage(null);
    try {
      const token = getToken();
      const response = await apiRequest<{ loans: Loan[] }>("/borrower/loans", { token });
      setLoans(response.loans);
    } catch {
      // Ignored
    }
  }

  async function submitDetails(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    try {
      await apiRequest("/borrower/personal-details", {
        method: "POST",
        token: getToken(),
        body: JSON.stringify(payload)
      });
      setEligibilityPassed(true);
      saveDraft({ ...payload, eligibilityPassed: true });
      setMessage(null);
      setCurrentStep(2);
    } catch (caught) {
      setEligibilityPassed(false);
      saveDraft({ eligibilityPassed: false });
      const rawError = caught instanceof Error ? caught.message : "Validation failed.";
      const cleanReason = rawError.replace(/^Eligibility check failed\.?\s*/i, "").trim();
      setMessage({
        type: "error",
        text: cleanReason || "Please verify your details meet the minimum criteria."
      });
    } finally {
      setLoading(false);
    }
  }

  async function uploadSlip(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!salarySlip) {
      setMessage({ type: "error", text: "Please select a salary slip file first." });
      return;
    }

    setLoading(true);
    setMessage(null);

    const form = new FormData();
    form.set("salarySlip", salarySlip);

    try {
      await apiRequest("/borrower/salary-slip", {
        method: "POST",
        token: getToken(),
        body: form
      });
      setSlipUploaded(true);
      setSlipFileName(salarySlip.name);
      saveDraft({ slipUploaded: true, slipFileName: salarySlip.name });
      setMessage(null);
      setCurrentStep(3);
    } catch (caught) {
      setMessage({
        type: "error",
        text: caught instanceof Error ? caught.message : "Upload failed."
      });
    } finally {
      setLoading(false);
    }
  }

  async function applyLoan(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await apiRequest("/borrower/loans", {
        method: "POST",
        token: getToken(),
        body: JSON.stringify({ principal, tenureDays })
      });
      setMessage({
        type: "success",
        title: "Loan Application Submitted!",
        text: "Your loan is now in APPLIED status and has been queued for review."
      });
      setLoanApplied(true);
      try {
        sessionStorage.removeItem(draftKey);
      } catch {
        // Ignore
      }
      await refreshLoans();
      setCurrentStep(4);
    } catch (caught) {
      setMessage({
        type: "error",
        title: "Application Failed",
        text: caught instanceof Error ? caught.message : "Loan application failed."
      });
    } finally {
      setLoading(false);
    }
  }

  const interestPercentage = Math.round((repayment.interest / repayment.total) * 100);
  const principalPercentage = 100 - interestPercentage;

  const stepsConfig = [
    {
      id: 1,
      title: "Personal Details",
      subtitle: "Eligibility & KYC",
      isCompleted: eligibilityPassed,
      isAccessible: true
    },
    {
      id: 2,
      title: "Salary Slip",
      subtitle: "Income Document",
      isCompleted: eligibilityPassed && slipUploaded,
      isAccessible: eligibilityPassed
    },
    {
      id: 3,
      title: "Loan Offer",
      subtitle: "Amount & Tenure",
      isCompleted: eligibilityPassed && slipUploaded && loanApplied,
      isAccessible: eligibilityPassed && slipUploaded
    },
    {
      id: 4,
      title: "Active Loans",
      subtitle: "Status & Repayment",
      isCompleted: false,
      isAccessible: loanApplied || loans.length > 0
    }
  ];

  if (initialLoading && !cached) {
    return <BorrowerPortalSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Rich & Balanced Hero Header */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/70 to-indigo-50/30 p-4 sm:p-7 shadow-soft">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 sm:gap-5">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-2.5 sm:px-3 py-1 text-xs font-semibold text-brand-700 mb-2">
              <span className="h-2 w-2 rounded-full bg-brand-600 animate-pulse" />
              <span>Fixed 12.00% p.a. Simple Interest</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Personal Loan Application
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-2xl">
              Transparent digital lending with real-time underwriting, simple interest calculations, and instant approval up to ₹5,00,000.
            </p>
          </div>

          {/* Quick value props pill box */}
          <div className="grid grid-cols-3 sm:flex gap-2 sm:gap-2.5">
            <div className="rounded-xl border border-slate-200/80 bg-white px-2.5 sm:px-3.5 py-2 sm:py-2.5 shadow-xs text-center min-w-[80px] sm:min-w-[100px]">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Max Limit</span>
              <span className="text-sm sm:text-base font-extrabold text-slate-900">₹5 Lakhs</span>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white px-2.5 sm:px-3.5 py-2 sm:py-2.5 shadow-xs text-center min-w-[80px] sm:min-w-[100px]">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Interest Rate</span>
              <span className="text-sm sm:text-base font-extrabold text-brand-600">12% p.a.</span>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white px-2.5 sm:px-3.5 py-2 sm:py-2.5 shadow-xs text-center min-w-[80px] sm:min-w-[100px]">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Processing</span>
              <span className="text-sm sm:text-base font-extrabold text-emerald-600">Instant</span>
            </div>
          </div>
        </div>

        {/* Guided Sequential Stepper Bar */}
        <div className="mt-5 pt-4 sm:mt-6 sm:pt-5 border-t border-slate-200/70">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5">
            {stepsConfig.map((s) => {
              const isCurrent = currentStep === s.id;
              const isCompleted = s.isCompleted;
              const isAccessible = s.isAccessible;

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    if (isAccessible) setCurrentStep(s.id as 1 | 2 | 3 | 4);
                  }}
                  disabled={!isAccessible}
                  className={`flex items-center gap-2 sm:gap-3 rounded-xl p-2 sm:p-2.5 text-left transition-all border ${
                    isCurrent
                      ? isCompleted
                        ? "border-emerald-500 bg-white ring-2 ring-emerald-500/20 shadow-xs cursor-default"
                        : "border-brand-500 bg-white ring-2 ring-brand-500/20 shadow-xs cursor-default"
                      : isCompleted
                      ? "border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-800 cursor-pointer shadow-2xs"
                      : isAccessible
                      ? "border-slate-200 bg-white hover:border-brand-300 hover:bg-slate-50 text-slate-800 cursor-pointer shadow-2xs"
                      : "border-slate-200/60 bg-slate-50/40 opacity-50 cursor-not-allowed"
                  }`}
                >
                  <div
                    className={`flex h-6 w-6 sm:h-7 sm:w-7 flex-none items-center justify-center rounded-lg text-xs font-bold transition-all ${
                      isCompleted
                        ? "bg-emerald-600 text-white shadow-xs"
                        : isCurrent
                        ? "bg-brand-600 text-white shadow-xs"
                        : isAccessible
                        ? "bg-brand-100 text-brand-700"
                        : "bg-slate-200 text-slate-400"
                    }`}
                  >
                    {isCompleted ? "✓" : s.id}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 block truncate">
                      {s.title}
                    </span>
                    <span className="text-[10px] text-slate-500 block truncate">
                      {s.subtitle}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {message && <Notice type={message.type} message={message.text} title={message.title} />}

      {/* STEP 1: Personal Details & Eligibility */}
      {currentStep === 1 && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-7 shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 font-bold text-xs sm:text-sm flex-none">
                01
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">Personal Details & Eligibility Check</h2>
                <p className="text-[11px] sm:text-xs text-slate-500">Instant verification against automated underwriting rules</p>
              </div>
            </div>
            {eligibilityPassed && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-600/20 self-start sm:self-auto">
                <Check className="h-3 w-3" /> Verified
              </span>
            )}
          </div>

          {/* Real-time eligibility criteria indicator pills */}
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-200/60">
            <div>
              <span className="font-semibold text-slate-800 block">Age Limit:</span>
              23 – 50 years
            </div>
            <div>
              <span className="font-semibold text-slate-800 block">Min. Salary:</span>
              ₹25,000 / month
            </div>
            <div>
              <span className="font-semibold text-slate-800 block">PAN Regex:</span>
              5L - 4D - 1L
            </div>
            <div>
              <span className="font-semibold text-slate-800 block">Employment:</span>
              Salaried / Self-Employed
            </div>
          </div>

          <form className="mt-5 grid gap-3.5 sm:gap-4 sm:grid-cols-2" onSubmit={submitDetails} autoComplete="off">
            <div className="sm:col-span-2">
              <Field label="Full Legal Name" hint="As registered in official government ID">
                <input
                  className={inputClass}
                  name="fullName"
                  value={fullNameInput}
                  onChange={(e) => {
                    setFullNameInput(e.target.value);
                    saveDraft({ fullName: e.target.value });
                  }}
                  placeholder="e.g. Rahul Sharma"
                  autoComplete="off"
                  required
                />
              </Field>
            </div>

            <div>
              <Field
                label="PAN Card Number"
                badge={panInput ? (isPanValid ? "✓ Valid Format" : "Invalid Format") : undefined}
                hint="10-character alphanumeric (e.g. ABCDE1234F)"
              >
                <input
                  className={`${inputClass} uppercase tracking-wider font-mono`}
                  name="pan"
                  value={panInput}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    setPanInput(val);
                    saveDraft({ pan: val });
                  }}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  autoComplete="off"
                  required
                />
              </Field>
            </div>

            <div>
              <Field
                label="Date of Birth"
                badge={calculatedAge !== null ? `${calculatedAge} yrs old` : undefined}
                hint="Must be between 23 and 50 years"
              >
                <input
                  className={inputClass}
                  type="date"
                  name="dateOfBirth"
                  value={dobInput}
                  onChange={(e) => {
                    setDobInput(e.target.value);
                    saveDraft({ dateOfBirth: e.target.value });
                  }}
                  autoComplete="off"
                  required
                />
              </Field>
            </div>

            <div>
              <Field
                label="Monthly Salary (₹)"
                badge={salaryInput ? (Number(salaryInput) >= 25000 ? "✓ Meets ₹25k" : "Below ₹25k") : undefined}
                hint="Minimum ₹25,000 required"
              >
                <input
                  className={inputClass}
                  type="number"
                  min={0}
                  name="monthlySalary"
                  value={salaryInput}
                  onChange={(e) => {
                    setSalaryInput(e.target.value);
                    saveDraft({ monthlySalary: e.target.value });
                  }}
                  placeholder="e.g. 45000"
                  autoComplete="off"
                  required
                />
              </Field>
            </div>

            <div>
              <Field label="Employment Type" hint="Select current status">
                <select
                  className={selectClass}
                  name="employmentMode"
                  value={employmentInput}
                  onChange={(e) => {
                    setEmploymentInput(e.target.value);
                    saveDraft({ employmentMode: e.target.value });
                  }}
                  required
                >
                  <option value="SALARIED">Salaried (Full-time)</option>
                  <option value="SELF_EMPLOYED">Self-Employed (Business / Freelance)</option>
                  <option value="UNEMPLOYED">Unemployed</option>
                </select>
              </Field>
            </div>

            <div className="sm:col-span-2 pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-end border-t border-slate-100">
              <button
                className={`${buttonClass} w-full sm:w-auto py-2.5 sm:py-2.5`}
                type="submit"
                disabled={loading}
              >
                <Send className="mr-2 h-4 w-4" aria-hidden="true" />
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* STEP 2: Salary Slip Upload */}
      {currentStep === 2 && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-7 shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 font-bold text-xs sm:text-sm flex-none">
                02
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">Upload Salary Slip</h2>
                <p className="text-[11px] sm:text-xs text-slate-500">Attach your latest pay slip (PDF, JPG, or PNG up to 5 MB)</p>
              </div>
            </div>
            {slipUploaded && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-600/20 self-start sm:self-auto">
                <Check className="h-3 w-3" /> Attached
              </span>
            )}
          </div>

          <form className="mt-5 space-y-4" onSubmit={uploadSlip}>
            {/* File Dropzone Area */}
            <div className="relative rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 sm:p-8 text-center hover:border-brand-400 hover:bg-brand-50/30 transition-all duration-150">
              <input
                type="file"
                id="salarySlipInput"
                accept="application/pdf,image/jpeg,image/png"
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  setSalarySlip(event.target.files?.[0] ?? null);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600 mb-2.5 sm:mb-3">
                  <FileUp className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-800">
                  Click to select salary slip or drag & drop here
                </span>
                <span className="text-[11px] sm:text-xs text-slate-500 mt-1">
                  Supported formats: PDF, JPG, PNG (Max 5 MB)
                </span>
              </div>
            </div>

            {/* Selected / Uploaded File Card */}
            {(salarySlip || (slipUploaded && slipFileName)) && (
              <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 sm:p-3.5 shadow-xs">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
                  <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 flex-none">
                    <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-slate-800 block truncate max-w-[180px] sm:max-w-xs">
                      {salarySlip ? salarySlip.name : slipFileName}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                      {salarySlip ? `${(salarySlip.size / 1024 / 1024).toFixed(2)} MB` : "✓ Document Uploaded"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSalarySlip(null);
                    setSlipFileName("");
                    setSlipUploaded(false);
                    const input = document.getElementById("salarySlipInput") as HTMLInputElement;
                    if (input) input.value = "";
                  }}
                  className="text-slate-400 hover:text-rose-600 transition-colors p-1 flex-none"
                  title="Remove file"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="pt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-end border-t border-slate-100">
              {slipUploaded && !salarySlip ? (
                <button
                  className={`${buttonClass} w-full sm:w-auto py-2.5 sm:py-2.5`}
                  type="button"
                  onClick={() => setCurrentStep(3)}
                >
                  <Send className="mr-2 h-4 w-4" aria-hidden="true" />
                  Continue to Step 3
                </button>
              ) : (
                <button
                  className={`${buttonClass} w-full sm:w-auto py-2.5 sm:py-2.5`}
                  type="submit"
                  disabled={loading || !salarySlip}
                >
                  <FileUp className="mr-2 h-4 w-4" aria-hidden="true" />
                  {loading ? "Uploading..." : "Upload & Continue"}
                </button>
              )}
            </div>
          </form>
        </section>
      )}

      {/* STEP 3: Loan Customizer & Instant Apply */}
      {currentStep === 3 && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-7 shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-5 sm:mb-6">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 font-bold text-xs sm:text-sm flex-none">
                03
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">Configure Loan Offer & Submit</h2>
                <p className="text-[11px] sm:text-xs text-slate-500">Adjust principal and tenure with transparent interest calculations</p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
              12% p.a. Fixed SI
            </span>
          </div>

          <form className="grid gap-6 sm:gap-8 lg:grid-cols-12" onSubmit={applyLoan}>
            {/* Left 7 Cols: Sliders & Controls */}
            <div className="space-y-4 sm:space-y-6 lg:col-span-7">
              {/* Principal Slider */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Loan Amount
                  </span>
                  <span className="text-base sm:text-lg font-black text-brand-700">
                    {formatCurrency(principal)}
                  </span>
                </div>
                <input
                  type="range"
                  min={50000}
                  max={500000}
                  step={10000}
                  value={principal}
                  onChange={(event) => setPrincipal(Number(event.target.value))}
                  className="w-full h-2 rounded-lg bg-slate-200 accent-brand-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-medium text-slate-400 mt-1">
                  <span>₹50,000</span>
                  <span>₹5,00,000</span>
                </div>

                {/* Quick preset amount chips */}
                <div className="mt-3 grid grid-cols-4 sm:flex sm:flex-wrap gap-1.5">
                  {[50000, 100000, 250000, 500000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setPrincipal(amt)}
                      className={`rounded-lg px-2 py-1.5 text-xs font-semibold text-center transition-all ${
                        principal === amt
                          ? "bg-brand-600 text-white shadow-xs"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {amt >= 100000 ? `₹${amt / 100000}L` : `₹${amt / 1000}K`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tenure Slider */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Tenure (Days)
                  </span>
                  <span className="text-base sm:text-lg font-black text-brand-700">
                    {tenureDays} Days
                  </span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={365}
                  step={5}
                  value={tenureDays}
                  onChange={(event) => setTenureDays(Number(event.target.value))}
                  className="w-full h-2 rounded-lg bg-slate-200 accent-brand-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-medium text-slate-400 mt-1">
                  <span>30 Days</span>
                  <span>365 Days</span>
                </div>

                {/* Quick preset tenure chips */}
                <div className="mt-3 grid grid-cols-4 sm:flex sm:flex-wrap gap-1.5">
                  {[30, 90, 180, 365].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setTenureDays(days)}
                      className={`rounded-lg px-2 py-1.5 text-xs font-semibold text-center transition-all ${
                        tenureDays === days
                          ? "bg-brand-600 text-white shadow-xs"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Repayment Card & Confirmation */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 to-indigo-50/30 p-4 sm:p-5 shadow-xs flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
                    <div className="flex items-center gap-2">
                      <Calculator className="h-4 w-4 text-brand-600" />
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Repayment Breakdown
                      </span>
                    </div>
                  </div>

                  <div className="mt-3.5 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Principal Amount:</span>
                      <span className="font-semibold text-slate-900">{formatCurrency(principal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Interest (12% Simple):</span>
                      <span className="font-semibold text-brand-700">+{formatCurrency(repayment.interest)}</span>
                    </div>

                    {/* Proportion bar */}
                    <div className="pt-1.5">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>Principal ({principalPercentage}%)</span>
                        <span>Interest ({interestPercentage}%)</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden flex">
                        <div className="bg-brand-600 h-full" style={{ width: `${principalPercentage}%` }} />
                        <div className="bg-indigo-400 h-full" style={{ width: `${interestPercentage}%` }} />
                      </div>
                    </div>

                    <div className="flex justify-between items-baseline pt-2.5 border-t border-slate-200/80">
                      <span className="text-xs sm:text-sm font-bold text-slate-900">Total Repayment:</span>
                      <span className="text-lg sm:text-xl font-black text-slate-900">{formatCurrency(repayment.total)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-200/70">
                  <button
                    className={`${buttonClass} w-full py-2.5 sm:py-3 text-xs sm:text-sm font-bold`}
                    type="submit"
                    disabled={loading}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {loading ? "Submitting Application..." : "Confirm & Submit Application"}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </section>
      )}

      {/* STEP 4: Active Loans & Repayment Status */}
      {currentStep === 4 && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-7 shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-5 sm:mb-6">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">My Loan Applications & Active Loans</h2>
              <p className="text-[11px] sm:text-xs text-slate-500">Track your application progress and repayment schedule</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={startNewApplication}
                className="flex-1 sm:flex-none text-center text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-xl transition-colors"
              >
                + New Application
              </button>
              <button
                type="button"
                onClick={refreshLoans}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors flex-none"
              >
                Refresh
              </button>
            </div>
          </div>

          {loans.length === 0 ? (
            <div className="py-10 sm:py-12 text-center">
              <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
                <FileText className="h-6 w-6 sm:h-7 sm:w-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">No applications found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
                You haven&apos;t submitted a loan application yet. Click below to get started.
              </p>
              <button
                type="button"
                onClick={startNewApplication}
                className={buttonClass}
              >
                Start New Application
              </button>
            </div>
          ) : (
            <div className="grid gap-3.5 sm:gap-4">
              {loans.map((loan) => (
                <div
                  key={loan._id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs transition-all hover:border-slate-300"
                >
                  <div className="grid gap-3.5 sm:gap-4 lg:grid-cols-12 items-center">
                    {/* Status & Loan ID */}
                    <div className="lg:col-span-3">
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={loan.status} />
                        <span className="text-[10px] sm:text-[11px] text-slate-400 font-mono">
                          #{loan._id.slice(-6).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-lg sm:text-xl font-extrabold text-slate-900 block">
                        {formatCurrency(loan.principal)}
                      </span>
                      <span className="text-[11px] sm:text-xs text-slate-500" suppressHydrationWarning>
                        Applied on {formatDate(loan.createdAt)}
                      </span>
                    </div>

                    {/* Financial Details */}
                    <div className="lg:col-span-5 grid grid-cols-3 gap-1.5 sm:gap-2 text-xs bg-slate-50/80 lg:bg-transparent p-2.5 sm:p-3 lg:p-0 rounded-xl lg:rounded-none border lg:border-y-0 lg:border-x border-slate-100 lg:px-4">
                      <div>
                        <span className="text-slate-400 block text-[9px] sm:text-[10px] uppercase font-semibold">Tenure</span>
                        <span className="font-bold text-slate-800 text-xs">{loan.tenureDays} Days</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] sm:text-[10px] uppercase font-semibold">Total Due</span>
                        <span className="font-bold text-slate-800 text-xs">{formatCurrency(loan.totalRepayment)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[9px] sm:text-[10px] uppercase font-semibold">Outstanding</span>
                        <span className="font-bold text-brand-700 text-xs">{formatCurrency(loan.outstandingAmount)}</span>
                      </div>
                    </div>

                    {/* Lifecycle Tracker or Progress */}
                    <div className="lg:col-span-4">
                      {loan.status === "REJECTED" ? (
                        <div className="rounded-xl bg-rose-50 p-3 border border-rose-200 text-xs text-rose-800">
                          <span className="font-bold block text-rose-900">Application Rejected</span>
                          <span className="text-[11px] leading-tight block mt-0.5">Reason: {loan.rejectionReason || "Underwriting criteria not met."}</span>
                        </div>
                      ) : loan.status === "DISBURSED" || loan.status === "CLOSED" ? (
                        <div>
                          <ProgressBar
                            value={loan.totalPaid}
                            max={loan.totalRepayment}
                            color={loan.status === "CLOSED" ? "emerald" : "brand"}
                          />
                          <div className="flex justify-between text-[10px] sm:text-[11px] text-slate-500 mt-1.5">
                            <span>Paid: {formatCurrency(loan.totalPaid)}</span>
                            <span className="font-semibold">{loan.status === "CLOSED" ? "Fully Settled" : "Repayment Active"}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-1.5 text-amber-700 font-semibold text-xs">
                            <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse flex-none" />
                            <span className="truncate">
                              {loan.status === "APPLIED" ? "Pending Sanction Review" : "Sanctioned - Funds Pending"}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 flex-none ml-1">Queue Active</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
