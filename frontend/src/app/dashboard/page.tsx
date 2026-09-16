"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Shield,
  Lock,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  Landmark,
  ReceiptText,
  Clock,
  RefreshCw,
  Activity,
  Percent,
  Check,
  AlertTriangle,
  UserCheck,
  Users,
  Wallet,
  ArrowUpRight,
  Building2,
  FileCheck2,
  Layers,
  Radio,
  Banknote,
  Sparkles,
  ExternalLink,
  Search,
  Zap,
  Tag
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";
import { MetricCard, MetricSkeleton, Notice, secondaryButtonClass, Skeleton, StatusBadge, TableSkeleton } from "@/components/ui";
import { apiRequest, formatCurrency, formatDate } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { getLocalCache, setLocalCache } from "@/lib/cache";
import type { AdminAnalytics, Role } from "@/types";

function getRelativeTime(dateInput: string | Date) {
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";
    const now = Date.now();
    const diffSeconds = Math.floor((now - d.getTime()) / 1000);

    if (diffSeconds < 60) return "Just now";
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(d.toISOString());
  } catch {
    return "";
  }
}

/* 1. Sales Leads Workspace Icon */
function WorkspaceSalesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" className="hover-chart-line" />
      <polyline points="16 7 22 7 22 13" className="hover-arrow-tip" />
    </svg>
  );
}

/* 2. Sanction Queue Workspace Icon */
function WorkspaceSanctionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" className="hover-shield-check" />
    </svg>
  );
}

/* 3. Disbursement Desk Workspace Icon */
function WorkspaceDisbursementIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="22" x2="21" y2="22" />
      <polygon points="12 2 20 7 4 7" className="hover-landmark-roof" />
      <line x1="6" y1="18" x2="6" y2="11" className="hover-landmark-p1" />
      <line x1="10" y1="18" x2="10" y2="11" className="hover-landmark-p2" />
      <line x1="14" y1="18" x2="14" y2="11" className="hover-landmark-p3" />
      <line x1="18" y1="18" x2="18" y2="11" className="hover-landmark-p4" />
    </svg>
  );
}

/* 4. Collections Hub Workspace Icon */
function WorkspaceCollectionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <line x1="8" y1="8" x2="16" y2="8" className="hover-receipt-l1" />
      <line x1="8" y1="12" x2="16" y2="12" className="hover-receipt-l2" />
      <line x1="8" y1="16" x2="12" y2="16" className="hover-receipt-l3" />
    </svg>
  );
}

/* Pipeline Stage Animated Icons */
function PipelineSalesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" className="pipeline-chart-line" />
      <polyline points="16 7 22 7 22 13" className="pipeline-arrow-tip" />
    </svg>
  );
}

function PipelineSanctionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" className="pipeline-shield-check" />
    </svg>
  );
}

function PipelineDisbursementIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="22" x2="21" y2="22" />
      <polygon points="12 2 20 7 4 7" className="pipeline-landmark-roof" />
      <line x1="6" y1="18" x2="6" y2="11" className="pipeline-landmark-p1" />
      <line x1="10" y1="18" x2="10" y2="11" className="pipeline-landmark-p2" />
      <line x1="14" y1="18" x2="14" y2="11" className="pipeline-landmark-p3" />
      <line x1="18" y1="18" x2="18" y2="11" className="pipeline-landmark-p4" />
    </svg>
  );
}



function PipelineCollectionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <line x1="8" y1="8" x2="16" y2="8" className="pipeline-receipt-l1" />
      <line x1="8" y1="12" x2="16" y2="12" className="pipeline-receipt-l2" />
      <line x1="8" y1="16" x2="12" y2="16" className="pipeline-receipt-l3" />
    </svg>
  );
}

/* Pipeline Stages */
const PIPELINE_STAGES: Array<{
  id: string;
  label: string;
  roles: Role[];
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: "sales",
    label: "Sales Leads",
    roles: ["SALES"],
    icon: PipelineSalesIcon
  },
  {
    id: "sanction",
    label: "Sanction Queue",
    roles: ["SANCTION"],
    icon: PipelineSanctionIcon
  },
  {
    id: "disbursement",
    label: "Disbursement Desk",
    roles: ["DISBURSEMENT"],
    icon: PipelineDisbursementIcon
  },
  {
    id: "collection",
    label: "Collections Hub",
    roles: ["COLLECTION"],
    icon: PipelineCollectionIcon
  }
];

/* Workspace Modules */
const WORKSPACE_MODULES: Array<{
  href: string;
  label: string;
  roles: Role[];
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  iconBg: string;
  dotColor: string;
  features: string[];
}> = [
  {
    href: "/dashboard/sales",
    label: "Sales Leads",
    roles: ["SALES"],
    icon: WorkspaceSalesIcon,
    description: "Manage registered borrower leads, verify preliminary KYC, and monitor pre-application conversions.",
    iconBg: "from-blue-600 to-indigo-600",
    dotColor: "bg-blue-500",
    features: ["Lead Ingestion", "KYC Verification", "Application Intake"]
  },
  {
    href: "/dashboard/sanction",
    label: "Sanction Queue",
    roles: ["SANCTION"],
    icon: WorkspaceSanctionIcon,
    description: "Comprehensive underwriting desk. Review borrower financials, evaluate DTI ratios, and issue sanction decisions.",
    iconBg: "from-amber-500 to-orange-600",
    dotColor: "bg-amber-500",
    features: ["Credit Scoring", "Income & DTI Check", "Sanction Decision"]
  },
  {
    href: "/dashboard/disbursement",
    label: "Disbursement Desk",
    roles: ["DISBURSEMENT"],
    icon: WorkspaceDisbursementIcon,
    description: "Authorize and execute fund releases, verify beneficiary bank accounts, and generate loan disbursement agreements.",
    iconBg: "from-cyan-600 to-teal-600",
    dotColor: "bg-cyan-500",
    features: ["Bank Match Verification", "Fund Release", "Disbursal Ledger"]
  },
  {
    href: "/dashboard/collection",
    label: "Collections Hub",
    roles: ["COLLECTION"],
    icon: WorkspaceCollectionIcon,
    description: "Record EMI payments, reconcile bank UTR reference numbers, and manage loan settlements and closure NOCs.",
    iconBg: "from-emerald-600 to-teal-700",
    dotColor: "bg-emerald-500",
    features: ["Payment Logging", "UTR Reconciliation", "Loan Settlement"]
  }
];

/* Hotspot Symbol Icon (Central beacon with radiating ripples) */
function HotspotSymbol({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="2.5" fill="currentColor" />
      <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
    </svg>
  );
}

export default function DashboardPage() {
  return (
    <AuthGate allow={["ADMIN", "SALES", "SANCTION", "DISBURSEMENT", "COLLECTION"]}>
      {(user) => {
        return (
          <AppShell user={user} section="dashboard">
            <ExecutiveDashboard user={user} />
          </AppShell>
        );
      }}
    </AuthGate>
  );
}

function ExecutiveDashboard({ user }: { user: any }) {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(() =>
    getLocalCache<AdminAnalytics>("lms_cache_admin_analytics")
  );
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(() => !getLocalCache<AdminAnalytics>("lms_cache_admin_analytics"));
  const [error, setError] = useState("");
  const [activityFilter, setActivityFilter] = useState<"ALL" | "PAYMENT" | "SANCTION" | "DISBURSEMENT" | "APPLICATION">("ALL");
  const [feedSearch, setFeedSearch] = useState("");

  const isAdmin = user?.role === "ADMIN";

  async function loadAnalytics() {
    if (!isAdmin) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiRequest<{ analytics: AdminAnalytics }>("/dashboard/admin/analytics", {
        token: getToken()
      });
      setAnalytics(res.analytics);
      setLocalCache("lms_cache_admin_analytics", res.analytics);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load admin analytics.");
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }

  useEffect(() => {
    if (isAdmin) {
      loadAnalytics();
    }
  }, [isAdmin]);

  const visibleWorkspaces =
    isAdmin
      ? WORKSPACE_MODULES
      : WORKSPACE_MODULES.filter((mod) => mod.roles.includes(user.role));

  // Filtered live activity stream
  const filteredActivity = useMemo(() => {
    if (!analytics?.activityStream) return [];
    let items = analytics.activityStream;

    if (activityFilter !== "ALL") {
      items = items.filter((event) => {
        if (activityFilter === "PAYMENT") return event.type === "PAYMENT" || event.type === "SETTLEMENT";
        if (activityFilter === "SANCTION") return event.type === "SANCTION" || event.type === "REJECTION";
        if (activityFilter === "DISBURSEMENT") return event.type === "DISBURSEMENT";
        if (activityFilter === "APPLICATION") return event.type === "APPLICATION";
        return true;
      });
    }

    if (feedSearch.trim()) {
      const q = feedSearch.toLowerCase().trim();
      items = items.filter((event) => {
        return (
          event.title.toLowerCase().includes(q) ||
          event.description.toLowerCase().includes(q) ||
          (event.actor && event.actor.toLowerCase().includes(q)) ||
          (event.loanId && event.loanId.toLowerCase().includes(q))
        );
      });
    }

    return items;
  }, [analytics?.activityStream, activityFilter, feedSearch]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Executive Welcome & Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/70 to-indigo-50/30 p-4 sm:p-7 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 relative z-10">
          <div>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Operations Command Center
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-2xl">
              Welcome back, <span className="font-semibold text-slate-900">{user?.name || "User"}</span>. Real-time portfolio intelligence, departmental queue tracking, and loan recovery lifecycle.
            </p>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={loadAnalytics}
                disabled={loading}
                className={`${secondaryButtonClass} text-xs py-1.5 sm:py-2 px-3 flex-none`}
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin text-brand-600" : "text-slate-500"}`} />
                <span>{loading ? "Syncing..." : "Sync Live Data"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Operations lifecycle flow diagram */}
        <div className="mt-5 border-t border-slate-200/90 pt-4 sm:mt-6 sm:pt-5">
          <div className="mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
              Loan Lifecycle Pipeline
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Sequential flow from borrower onboarding through credit underwriting, fund disbursement, and loan recovery
            </p>
          </div>

          {/* 4 Stage Boxes with Sequential Signal Bridge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 relative">
            {PIPELINE_STAGES.map((stage, idx) => {
              const StageIcon = stage.icon;
              return (
                <div key={stage.id} className="relative flex items-center">
                  <div
                    className={`w-full flex items-center gap-3 rounded-xl p-3 border ${
                      idx === 0
                        ? "animate-stage1-card shadow-2xs"
                        : idx === 1
                        ? "animate-stage2-card shadow-2xs"
                        : idx === 2
                        ? "animate-stage3-card shadow-2xs"
                        : "animate-stage4-card shadow-2xs"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold shrink-0 ${
                        idx === 0
                          ? "animate-stage1-badge"
                          : idx === 1
                          ? "animate-stage2-badge"
                          : idx === 2
                          ? "animate-stage3-badge"
                          : "animate-stage4-badge"
                      }`}
                    >
                      <StageIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 truncate block">
                        {stage.label}
                      </span>
                    </div>

                    <div className="relative flex h-6 w-6 items-center justify-center flex-none">
                      <div
                        className={`absolute inset-0 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 border border-slate-200 ${
                          idx === 0
                            ? "animate-stage1-lock"
                            : idx === 1
                            ? "animate-stage2-lock"
                            : idx === 2
                            ? "animate-stage3-lock"
                            : "animate-stage4-lock"
                        }`}
                        title="Locked Stage"
                      >
                        <Lock className="h-3.5 w-3.5" />
                      </div>

                      <div
                        className={`absolute inset-0 flex items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 ${
                          idx === 0
                            ? "animate-stage1-check"
                            : idx === 1
                            ? "animate-stage2-check"
                            : idx === 2
                            ? "animate-stage3-check"
                            : "animate-stage4-check"
                        }`}
                        title="Completed Stage"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-3.5 w-3.5"
                        >
                          <path
                            d="M5 13l4.5 4.5L19 7"
                            className={
                              idx === 0
                                ? "animate-stage1-tick-draw"
                                : idx === 1
                                ? "animate-stage2-tick-draw"
                                : idx === 2
                                ? "animate-stage3-tick-draw"
                                : "animate-stage4-tick-draw"
                            }
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {idx < PIPELINE_STAGES.length - 1 && (
                    <div className="hidden lg:flex absolute -right-6 top-1/2 -translate-y-1/2 w-6 h-6 z-20 pointer-events-none items-center justify-center">
                      <div className="w-full h-[2px] bg-slate-300 rounded-full relative">
                        <div
                          className={`absolute top-1/2 h-2.5 w-2.5 rounded-full bg-brand-600 shadow-[0_0_8px_rgba(79,70,229,1),0_0_12px_rgba(99,102,241,0.8)] border border-white flex items-center justify-center ${
                            idx === 0
                              ? "animate-spark-gap-1"
                              : idx === 1
                              ? "animate-spark-gap-2"
                              : "animate-spark-gap-3"
                          }`}
                        >
                          <div className="h-1 w-1 rounded-full bg-white" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {error && <Notice type="error" message={error} />}

      {/* ADMIN-SPECIFIC ANALYTICS SECTION */}
      {isAdmin && (
        <>
          {/* SECTION 1: Top Financial Health KPIs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-brand-600" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Portfolio Financial Health
                </h2>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Simple Interest Rate: 12.00% p.a.
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4">
              <MetricCard
                label="Total Disbursed"
                value={formatCurrency(analytics?.financials?.totalDisbursed || 0)}
                subtitle="Cumulative capital released"
                icon={Landmark}
                color="sky"
              />
              <MetricCard
                label="Active Outstanding"
                value={formatCurrency(analytics?.financials?.totalOutstanding || 0)}
                subtitle="Principal under recovery"
                icon={Clock}
                color="amber"
              />
              <MetricCard
                label="Recovered Capital"
                value={formatCurrency(analytics?.financials?.totalRepaid || 0)}
                subtitle="Verified UTR collections"
                icon={CheckCircle2}
                color="emerald"
              />
              <MetricCard
                label="Collection Efficiency"
                value={`${analytics?.financials?.recoveryRate || 0}%`}
                subtitle="Total repaid vs scheduled"
                icon={TrendingUp}
                color="emerald"
              />
              <div className="col-span-2 lg:col-span-1">
                <MetricCard
                  label="Interest Yield"
                  value={formatCurrency(analytics?.financials?.totalInterest || 0)}
                  subtitle="Interest revenue accrued"
                  icon={ReceiptText}
                  color="brand"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Departmental Queues & Workloads */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-brand-600" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Departmental Workload Queues
                </h2>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Live Action Queues
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {/* Sales Queue */}
              <Link
                href="/dashboard/sales"
                className="group rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/50 via-white to-white p-3.5 sm:p-4 shadow-2xs hover:border-blue-400 hover:shadow-soft transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-blue-800">
                    Sales Funnel
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {analytics?.queues?.sales?.count || 0}
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5 block truncate">
                  Prospect leads in intake
                </span>
              </Link>

              {/* Sanction Queue */}
              <Link
                href="/dashboard/sanction"
                className="group rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/50 via-white to-white p-3.5 sm:p-4 shadow-2xs hover:border-amber-400 hover:shadow-soft transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-800">
                    Underwriting
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {analytics?.queues?.sanction?.count || 0}
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5 block truncate">
                  {formatCurrency(analytics?.queues?.sanction?.volume || 0)} awaiting review
                </span>
              </Link>

              {/* Disbursement Queue */}
              <Link
                href="/dashboard/disbursement"
                className="group rounded-2xl border border-cyan-200/80 bg-gradient-to-br from-cyan-50/50 via-white to-white p-3.5 sm:p-4 shadow-2xs hover:border-cyan-400 hover:shadow-soft transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-cyan-800">
                    Disbursement
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {analytics?.queues?.disbursement?.count || 0}
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5 block truncate">
                  {formatCurrency(analytics?.queues?.disbursement?.volume || 0)} ready for payout
                </span>
              </Link>

              {/* Collection Queue */}
              <Link
                href="/dashboard/collection"
                className="group rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/50 via-white to-white p-3.5 sm:p-4 shadow-2xs hover:border-emerald-400 hover:shadow-soft transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                    Collections
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900">
                  {analytics?.queues?.collection?.count || 0}
                </div>
                <span className="text-[11px] text-slate-500 mt-0.5 block truncate">
                  {formatCurrency(analytics?.queues?.collection?.volume || 0)} actively servicing
                </span>
              </Link>
            </div>
          </div>

          {/* SECTION 3: Conversion Ratios & Portfolio Status Distribution */}
          <div className="grid gap-4 lg:grid-cols-12">
            {/* Left 5 Cols: Conversion & Underwriting Efficiency */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-soft space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Percent className="h-4 w-4 text-brand-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Conversion & Underwriting Efficiency
                </h3>
              </div>

              {/* Lead-to-Loan Conversion */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">Lead-to-Loan Conversion</span>
                  <span className="font-bold text-brand-700">
                    {analytics?.performance?.conversionRate || 0}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-brand-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, analytics?.performance?.conversionRate || 0)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>{analytics?.performance?.convertedBorrowers || 0} Applied</span>
                  <span>{analytics?.performance?.totalBorrowers || 0} Registered Users</span>
                </div>
              </div>

              {/* Underwriting Approval Rate */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">Sanction Approval Ratio</span>
                  <span className="font-bold text-emerald-700">
                    {analytics?.performance?.approvalRate || 0}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, analytics?.performance?.approvalRate || 0)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>{analytics?.statusMatrix?.SANCTIONED?.count || 0 + (analytics?.statusMatrix?.DISBURSED?.count || 0) + (analytics?.statusMatrix?.CLOSED?.count || 0)} Approved</span>
                  <span>{analytics?.statusMatrix?.REJECTED?.count || 0} Declined</span>
                </div>
              </div>

              {/* Average Ticket Size & Active Borrowers Mini Grid */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100 text-center">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Avg Loan Ticket</span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {formatCurrency(analytics?.financials?.avgLoanSize || 0)}
                  </span>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100 text-center">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Active Borrowers</span>
                  <span className="text-sm font-extrabold text-emerald-700">
                    {analytics?.performance?.activeBorrowers || 0} Active
                  </span>
                </div>
              </div>
            </div>

            {/* Right 7 Cols: Portfolio Lifecycle Matrix */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-soft space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-brand-600" />
                  <h3 className="text-sm font-bold text-slate-900">
                    Portfolio Status Distribution
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500">
                  {analytics?.performance?.totalLoans || 0} Total Applications
                </span>
              </div>

              {/* 5-Item Status Matrix Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {/* APPLIED */}
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-2.5 sm:p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-amber-700 uppercase">Applied</span>
                    <span className="text-xs font-black text-slate-900">
                      {analytics?.statusMatrix?.APPLIED?.count || 0}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {formatCurrency(analytics?.statusMatrix?.APPLIED?.volume || 0)}
                  </span>
                  <span className="text-[9px] text-slate-400">In Underwriting Queue</span>
                </div>

                {/* SANCTIONED */}
                <div className="rounded-xl border border-cyan-200/80 bg-cyan-50/40 p-2.5 sm:p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-cyan-800 uppercase">Sanctioned</span>
                    <span className="text-xs font-black text-slate-900">
                      {analytics?.statusMatrix?.SANCTIONED?.count || 0}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {formatCurrency(analytics?.statusMatrix?.SANCTIONED?.volume || 0)}
                  </span>
                  <span className="text-[9px] text-slate-400">Awaiting Fund Payout</span>
                </div>

                {/* DISBURSED */}
                <div className="rounded-xl border border-blue-200/80 bg-blue-50/40 p-2.5 sm:p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-blue-800 uppercase">Disbursed</span>
                    <span className="text-xs font-black text-slate-900">
                      {analytics?.statusMatrix?.DISBURSED?.count || 0}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {formatCurrency(analytics?.statusMatrix?.DISBURSED?.volume || 0)}
                  </span>
                  <span className="text-[9px] text-slate-400">Active Repayment Cycle</span>
                </div>

                {/* CLOSED */}
                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-2.5 sm:p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase">Settled</span>
                    <span className="text-xs font-black text-slate-900">
                      {analytics?.statusMatrix?.CLOSED?.count || 0}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {formatCurrency(analytics?.statusMatrix?.CLOSED?.volume || 0)}
                  </span>
                  <span className="text-[9px] text-slate-400">Fully Repaid (NOC Issued)</span>
                </div>

                {/* REJECTED */}
                <div className="rounded-xl border border-rose-200/80 bg-rose-50/40 p-2.5 sm:p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-rose-800 uppercase">Declined</span>
                    <span className="text-xs font-black text-slate-900">
                      {analytics?.statusMatrix?.REJECTED?.count || 0}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {formatCurrency(analytics?.statusMatrix?.REJECTED?.volume || 0)}
                  </span>
                  <span className="text-[9px] text-slate-400">Underwriting Criteria Not Met</span>
                </div>

                {/* Total Portfolio Pill */}
                <div className="rounded-xl border border-brand-200/80 bg-brand-50/40 p-2.5 sm:p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-brand-800 uppercase">Total AUM</span>
                    <span className="text-xs font-black text-slate-900">
                      {analytics?.performance?.totalLoans || 0}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-brand-900 block">
                    {formatCurrency(
                      (analytics?.statusMatrix?.DISBURSED?.volume || 0) +
                      (analytics?.statusMatrix?.CLOSED?.volume || 0)
                    )}
                  </span>
                  <span className="text-[9px] text-slate-400">Gross Portfolio Volume</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: Enhanced Connected Live Operations Activity Stream */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 space-y-4">
            {/* Header with Title and Search/Filters */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                {/* Professional Hotspot Radar Beacon - Clean 2-Bracket Radar Wave */}
                <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 flex-none">
                  {/* Clean Hotspot Symbol with 2 Well-Spaced Brackets */}
                  <svg
                    className="h-5.5 w-5.5 sm:h-6 sm:w-6 text-emerald-700"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {/* Active Solid Dark Green Core */}
                    <circle cx="12" cy="12" r="2.5" className="fill-emerald-700 stroke-none" />
                    
                    {/* Bracket 1: Inner Arc */}
                    <path
                      d="M15.89 8.11a5.5 5.5 0 0 1 0 7.78M8.11 15.89a5.5 5.5 0 0 1 0-7.78"
                      className="stroke-emerald-700 animate-hotspot-arc-1"
                      strokeWidth="2.2"
                    />
                    
                    {/* Bracket 2: Outer Arc */}
                    <path
                      d="M18.72 5.28a9.5 9.5 0 0 1 0 13.44M5.28 18.72a9.5 9.5 0 0 1 0-13.44"
                      className="stroke-emerald-700 animate-hotspot-arc-2"
                      strokeWidth="2.2"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Live Operations Activity Stream
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Chronological audit feed of real-time repayments, credit sanctions, and disbursements
                  </p>
                </div>
              </div>

              {/* Search Bar + Filter Tabs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {/* Search Bar */}
                <div className="relative w-full sm:w-56">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
                    <Search className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={feedSearch}
                    onChange={(e) => setFeedSearch(e.target.value)}
                    placeholder="Search activity, UTR, ID..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/10 transition-colors"
                  />
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs overflow-x-auto scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setActivityFilter("ALL")}
                    className={`rounded-lg px-2.5 py-1 font-semibold whitespace-nowrap transition-all ${
                      activityFilter === "ALL"
                        ? "bg-white text-slate-900 border border-slate-200/70"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    All ({analytics?.activityStream?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivityFilter("PAYMENT")}
                    className={`rounded-lg px-2.5 py-1 font-semibold whitespace-nowrap transition-all ${
                      activityFilter === "PAYMENT"
                        ? "bg-white text-emerald-700 border border-emerald-200/70"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Payments
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivityFilter("SANCTION")}
                    className={`rounded-lg px-2.5 py-1 font-semibold whitespace-nowrap transition-all ${
                      activityFilter === "SANCTION"
                        ? "bg-white text-amber-700 border border-amber-200/70"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Sanctions
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivityFilter("DISBURSEMENT")}
                    className={`rounded-lg px-2.5 py-1 font-semibold whitespace-nowrap transition-all ${
                      activityFilter === "DISBURSEMENT"
                        ? "bg-white text-cyan-700 border border-cyan-200/70"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Disbursals
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivityFilter("APPLICATION")}
                    className={`rounded-lg px-2.5 py-1 font-semibold whitespace-nowrap transition-all ${
                      activityFilter === "APPLICATION"
                        ? "bg-white text-blue-700 border border-blue-200/70"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Intake
                  </button>
                </div>
              </div>
            </div>

            {/* Modern Card Feed Container (No Vertical Wire) */}
            {filteredActivity.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                  <Activity className="h-6 w-6" />
                </div>
                <span className="font-semibold text-slate-600 block text-sm">No activity recorded</span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  {feedSearch ? "No events match your search query." : "Operational events will appear here in real time."}
                </span>
              </div>
            ) : (
              <div className="space-y-2.5 sm:space-y-3">
                {filteredActivity.map((event) => {
                  const relativeTime = getRelativeTime(event.timestamp);

                  // Event-specific node, soft-tinted icon, and styling configurations
                  const nodeConfig = {
                    PAYMENT: {
                      icon: Banknote,
                      iconBg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
                      pillBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
                      tagText: "PAYMENT VERIFIED",
                      amountColor: "text-emerald-700 bg-emerald-50/90 border-emerald-200/90",
                      workspaceHref: "/dashboard/collection?tab=active",
                      workspaceLabel: "Collections"
                    },
                    SETTLEMENT: {
                      icon: CheckCircle2,
                      iconBg: "bg-emerald-600/15 text-emerald-700 border-emerald-600/25",
                      pillBg: "bg-emerald-50 text-emerald-900 border-emerald-300 font-extrabold",
                      tagText: "NOC SETTLED",
                      amountColor: "text-emerald-800 bg-emerald-100/80 border-emerald-300",
                      workspaceHref: "/dashboard/collection?tab=history",
                      workspaceLabel: "Settled"
                    },
                    DISBURSEMENT: {
                      icon: Landmark,
                      iconBg: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
                      pillBg: "bg-cyan-50 text-cyan-800 border-cyan-200",
                      tagText: "FUND DISBURSED",
                      amountColor: "text-cyan-800 bg-cyan-50/90 border-cyan-200/90",
                      workspaceHref: "/dashboard/disbursement?tab=history",
                      workspaceLabel: "Disbursal"
                    },
                    SANCTION: {
                      icon: ShieldCheck,
                      iconBg: "bg-amber-500/10 text-amber-600 border-amber-500/20",
                      pillBg: "bg-amber-50 text-amber-800 border-amber-200",
                      tagText: "SANCTION APPROVED",
                      amountColor: "text-amber-800 bg-amber-50/90 border-amber-200/90",
                      workspaceHref: "/dashboard/sanction?tab=history",
                      workspaceLabel: "Sanction"
                    },
                    REJECTION: {
                      icon: AlertTriangle,
                      iconBg: "bg-rose-500/10 text-rose-600 border-rose-500/20",
                      pillBg: "bg-rose-50 text-rose-800 border-rose-200",
                      tagText: "CREDIT DECLINED",
                      amountColor: "text-rose-700 bg-rose-50 border-rose-200",
                      workspaceHref: "/dashboard/sanction?tab=history",
                      workspaceLabel: "History"
                    },
                    APPLICATION: {
                      icon: TrendingUp,
                      iconBg: "bg-blue-500/10 text-blue-600 border-blue-500/20",
                      pillBg: "bg-blue-50 text-blue-800 border-blue-200",
                      tagText: "APPLICATION INTAKE",
                      amountColor: "text-blue-800 bg-blue-50/90 border-blue-200/90",
                      workspaceHref: "/dashboard/sales?tab=converted",
                      workspaceLabel: "Leads"
                    }
                  }[event.type] || {
                    icon: Activity,
                    iconBg: "bg-slate-100 text-slate-600 border-slate-200",
                    pillBg: "bg-slate-50 text-slate-800 border-slate-200",
                    tagText: "OPERATION",
                    amountColor: "text-slate-800 bg-slate-100 border-slate-200",
                    workspaceHref: "/dashboard",
                    workspaceLabel: "View"
                  };

                  const NodeIcon = nodeConfig.icon;

                  return (
                    <div
                      key={event.id}
                      className="group relative rounded-xl border border-slate-200/85 bg-white hover:bg-slate-50/60 p-3.5 sm:p-4 hover:border-slate-300 transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4"
                    >
                      {/* Left: Soft-Tinted Icon + Content */}
                      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                        <div
                          className={`flex h-10 w-10 sm:h-10.5 sm:w-10.5 items-center justify-center rounded-xl border ${nodeConfig.iconBg} flex-none transition-transform group-hover:scale-105`}
                        >
                          <NodeIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          {/* Metadata Row: Category Pill + Loan Tag + Amount Chip */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider border ${nodeConfig.pillBg}`}
                            >
                              {nodeConfig.tagText}
                            </span>

                            {event.amount && (
                              <span
                                className={`inline-flex items-center text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md border font-mono ${nodeConfig.amountColor}`}
                              >
                                {event.type === "PAYMENT" ? "+" : ""}
                                {formatCurrency(event.amount)}
                              </span>
                            )}

                            {event.loanId && (
                              <span className="text-[10px] font-mono text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/60">
                                #{event.loanId.slice(-6).toUpperCase()}
                              </span>
                            )}
                          </div>

                          {/* Event Primary Title */}
                          <div className="text-xs sm:text-sm font-semibold text-slate-900 group-hover:text-brand-900 transition-colors truncate">
                            {event.title}
                          </div>

                          {/* Event Subtitle / Description */}
                          <p className="text-[11px] sm:text-xs text-slate-500 truncate max-w-2xl leading-relaxed">
                            {event.description}
                          </p>
                        </div>
                      </div>

                      {/* Right: Tabular Timestamps + Clean Subtle Ghost Action Button */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-100 flex-none">
                        <div className="flex flex-col sm:items-end text-left sm:text-right w-24 sm:w-28 flex-none">
                          <span className="text-xs font-bold text-slate-800 tabular-nums">
                            {relativeTime}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium tabular-nums whitespace-nowrap" suppressHydrationWarning>
                            {formatDate(event.timestamp)}
                          </span>
                        </div>

                        <Link
                          href={nodeConfig.workspaceHref}
                          aria-label={nodeConfig.workspaceLabel}
                          className="inline-flex items-center justify-center gap-1.5 rounded-lg p-2 sm:px-3 sm:py-1.5 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-brand-50 hover:text-brand-700 border border-slate-200/80 hover:border-brand-200/90 transition-all active:scale-95 whitespace-nowrap sm:min-w-[95px] flex-none text-center group/btn"
                        >
                          <span className="hidden sm:inline">{nodeConfig.workspaceLabel}</span>
                          <ArrowRight className="h-3.5 w-3.5 sm:h-3 sm:w-3 text-slate-400 group-hover/btn:text-brand-600 flex-none transition-transform group-hover/btn:translate-x-0.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* SECTION 5: Workspaces Navigation Tiles */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/80">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-600"></span>
          </span>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
            Operations Workspaces
          </h2>
        </div>

        <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
          {visibleWorkspaces.map((workspace) => {
            const WsIcon = workspace.icon;
            return (
              <Link
                key={workspace.href}
                href={workspace.href}
                className="group relative rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-2xs hover:border-brand-300 hover:shadow-soft transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr ${workspace.iconBg} text-white shadow-xs group-hover:scale-105 transition-transform duration-200 flex-none`}
                      >
                        <WsIcon className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                        {workspace.label}
                      </h3>
                    </div>

                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-600 transition-colors flex-none">
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                    {workspace.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
                    {workspace.features.map((feat) => (
                      <span
                        key={feat}
                        className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium text-slate-600 bg-slate-50 group-hover:bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200/60 transition-colors"
                      >
                        <span className={`h-1 w-1 rounded-full ${workspace.dotColor}`} />
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
