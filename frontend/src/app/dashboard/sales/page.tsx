"use client";

import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  Search,
  Users,
  RefreshCw,
  Mail,
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  FileEdit,
  Copy,
  Check,
  UserPlus,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  Banknote,
  History
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";
import { MetricCard, Notice, secondaryButtonClass, StatusBadge } from "@/components/ui";
import { apiRequest, formatCurrency, formatDate } from "@/lib/api";
import { getToken } from "@/lib/auth";

type ApplicationDraft = {
  fullName?: string;
  pan?: string;
  monthlySalary?: number;
  employmentMode?: string;
  eligibilityPassed?: boolean;
  salarySlip?: {
    originalName?: string;
  };
  updatedAt?: string;
};

type Lead = {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  application?: ApplicationDraft[];
};

type ConvertedBorrower = {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  loans?: {
    _id: string;
    status: string;
    principal: number;
    totalRepayment: number;
    createdAt: string;
  }[];
  application?: ApplicationDraft[];
};

export default function SalesPage() {
  return (
    <AuthGate allow={["ADMIN", "SALES"]}>
      {(user) => (
        <AppShell user={user} section="dashboard">
          <SalesModule />
        </AppShell>
      )}
    </AuthGate>
  );
}

function getLeadStatus(lead: Lead) {
  const app = Array.isArray(lead?.application) ? lead.application[0] : undefined;
  if (app?.salarySlip?.originalName) {
    return {
      label: "Ready to Apply",
      badgeClass: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
      description: "Documents attached, awaiting final loan configuration"
    };
  }
  if (app?.eligibilityPassed) {
    return {
      label: "Document Pending",
      badgeClass: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
      description: "KYC eligible, salary slip upload pending"
    };
  }
  if (app?.fullName) {
    return {
      label: "KYC In Progress",
      badgeClass: "bg-amber-50 text-amber-700 ring-amber-600/20",
      description: "Drafting personal & income details"
    };
  }
  return {
    label: "Pending Onboarding",
    badgeClass: "bg-sky-50 text-sky-700 ring-sky-600/20",
    description: "Account created, profile setup pending"
  };
}

function SalesModule() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [converted, setConverted] = useState<ConvertedBorrower[]>([]);
  const [activeTab, setActiveTab] = useState<"PROSPECTS" | "CONVERTED">("PROSPECTS");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING_ONBOARDING" | "IN_PROGRESS" | "READY">("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync tab with URL search param so browser refresh preserves the current tab
  useEffect(() => {
    if (typeof window !== "undefined") {
      const param = new URLSearchParams(window.location.search).get("tab");
      if (param === "converted" || param === "history") {
        setActiveTab("CONVERTED");
      } else if (param === "prospects" || param === "active" || param === "queue") {
        setActiveTab("PROSPECTS");
      }
    }
  }, []);

  function handleTabSwitch(tab: "PROSPECTS" | "CONVERTED") {
    setActiveTab(tab);
    setSearchQuery("");
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab === "CONVERTED" ? "converted" : "prospects");
      window.history.replaceState(null, "", url.toString());
    }
  }

  async function loadLeads() {
    setLoading(true);
    setError("");
    try {
      const response = await apiRequest<{ leads: Lead[]; converted: ConvertedBorrower[] }>(
        "/dashboard/sales/leads",
        {
          token: getToken()
        }
      );
      setLeads(Array.isArray(response?.leads) ? response.leads : []);
      setConverted(Array.isArray(response?.converted) ? response.converted : []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load sales leads.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  function copyEmail(email: string, id: string) {
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // Derived metrics for prospects
  const pendingOnboardingCount = useMemo(
    () => (leads || []).filter((l) => !(Array.isArray(l.application) ? l.application[0] : undefined)?.fullName).length,
    [leads]
  );
  const inProgressCount = useMemo(
    () =>
      (leads || []).filter((l) => {
        const app = Array.isArray(l.application) ? l.application[0] : undefined;
        return !!app?.fullName && !app?.salarySlip?.originalName;
      }).length,
    [leads]
  );
  const readyCount = useMemo(
    () =>
      (leads || []).filter((l) => {
        const app = Array.isArray(l.application) ? l.application[0] : undefined;
        return !!app?.salarySlip?.originalName;
      }).length,
    [leads]
  );

  // Filtered and searched leads
  const filteredLeads = useMemo(() => {
    return (leads || []).filter((lead) => {
      const q = searchQuery.toLowerCase().trim();
      const leadName = lead?.name || "";
      const leadEmail = lead?.email || "";
      const leadId = String(lead?._id || "");

      const matchesSearch =
        !q ||
        leadName.toLowerCase().includes(q) ||
        leadEmail.toLowerCase().includes(q) ||
        leadId.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const app = Array.isArray(lead.application) ? lead.application[0] : undefined;
      if (statusFilter === "PENDING_ONBOARDING") {
        return !app?.fullName;
      }
      if (statusFilter === "IN_PROGRESS") {
        return !!app?.fullName && !app?.salarySlip?.originalName;
      }
      if (statusFilter === "READY") {
        return !!app?.salarySlip?.originalName;
      }

      return true;
    });
  }, [leads, searchQuery, statusFilter]);

  // Filtered converted borrowers
  const filteredConverted = useMemo(() => {
    return (converted || []).filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      const name = item.name || "";
      const email = item.email || "";
      const id = String(item._id || "");
      return name.toLowerCase().includes(q) || email.toLowerCase().includes(q) || id.toLowerCase().includes(q);
    });
  }, [converted, searchQuery]);

  return (
    <div className="grid gap-4 sm:gap-6">
      {/* Module Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="inline-flex items-center gap-2 sm:gap-2.5 rounded-2xl bg-blue-50 px-2.5 sm:px-3 py-1 sm:py-1.5 text-lg sm:text-2xl font-black tracking-tight text-blue-900 border border-blue-200/80 shadow-2xs mb-1">
            <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs flex-none">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <span>Sales Leads</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-xl">
            Track prospective borrower signups through the onboarding funnel and monitor conversion history.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Segmented Control Tabs */}
          <div className="inline-flex flex-1 sm:flex-none rounded-2xl border border-slate-200/90 bg-slate-100/90 p-1 shadow-inner text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleTabSwitch("PROSPECTS")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-4 py-1.5 sm:py-2 transition-all ${
                activeTab === "PROSPECTS"
                  ? "bg-white text-blue-700 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 flex-none" />
              <span className="truncate">Prospects</span>
              <span
                className={`rounded-full px-1.5 sm:px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === "PROSPECTS"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-slate-200/80 text-slate-600"
                }`}
              >
                {leads.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabSwitch("CONVERTED")}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 rounded-xl px-2.5 sm:px-4 py-1.5 sm:py-2 transition-all ${
                activeTab === "CONVERTED"
                  ? "bg-white text-blue-700 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <UserCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600 flex-none" />
              <span className="truncate">Converted</span>
              <span
                className={`rounded-full px-1.5 sm:px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === "CONVERTED"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200/80 text-slate-600"
                }`}
              >
                {converted.length}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={loadLeads}
            disabled={loading}
            className={`${secondaryButtonClass} text-xs py-1.5 sm:py-2 px-2.5 sm:px-3 flex-none`}
            title="Refresh Leads"
          >
            <RefreshCw className={`h-3.5 w-3.5 sm:mr-1.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {error && <Notice type="error" message={error} />}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <MetricCard
          label="Pending Onboarding"
          value={pendingOnboardingCount}
          subtitle="Account created, setup pending"
          icon={UserPlus}
          color="sky"
        />
        <MetricCard
          label="KYC In Progress"
          value={inProgressCount}
          subtitle="Drafting personal details"
          icon={FileEdit}
          color="brand"
        />
        <MetricCard
          label="Ready to Apply"
          value={readyCount}
          subtitle="KYC verified & docs ready"
          icon={CheckCircle2}
          color="emerald"
        />
        <MetricCard
          label="Converted to Application"
          value={converted.length}
          subtitle="Successfully applied"
          icon={UserCheck}
          color="emerald"
        />
      </div>

      {/* TAB 1: PROSPECT LEADS */}
      {activeTab === "PROSPECTS" && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-6 shadow-soft">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 pb-3.5 sm:pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Prospect Borrower Funnel</h2>
              <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                {filteredLeads.length} of {leads.length} Leads
              </span>
            </div>

            {/* Search bar & filter tabs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative w-full sm:w-60 lg:w-64">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
                  <Search className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, email, ID..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/10 transition-colors"
                />
              </div>

              <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => setStatusFilter("ALL")}
                  className={`rounded-lg px-2.5 py-1 font-semibold whitespace-nowrap transition-all ${
                    statusFilter === "ALL"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  All ({leads.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("PENDING_ONBOARDING")}
                  className={`rounded-lg px-2.5 py-1 font-semibold whitespace-nowrap transition-all ${
                    statusFilter === "PENDING_ONBOARDING"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Pending ({pendingOnboardingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("IN_PROGRESS")}
                  className={`rounded-lg px-2.5 py-1 font-semibold whitespace-nowrap transition-all ${
                    statusFilter === "IN_PROGRESS"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  In Progress ({inProgressCount})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("READY")}
                  className={`rounded-lg px-2.5 py-1 font-semibold whitespace-nowrap transition-all ${
                    statusFilter === "READY"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Ready ({readyCount})
                </button>
              </div>
            </div>
          </div>

          {filteredLeads.length === 0 ? (
            <div className="py-12 sm:py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">No leads in this view</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? "No registered leads match your search criteria."
                  : "All registered borrowers have finalized their loan applications and moved to the Converted tab."}
              </p>
            </div>
          ) : (
            <>
              {/* MOBILE CARDS VIEW (block md:hidden) */}
              <div className="grid gap-3 mt-3.5 block md:hidden">
                {filteredLeads.map((lead) => {
                  const status = getLeadStatus(lead);
                  const app = Array.isArray(lead?.application) ? lead.application[0] : undefined;
                  const leadName = lead?.name || lead?.email?.split("@")[0] || "Borrower Lead";
                  const initial = (leadName.charAt(0) || "B").toUpperCase();
                  const leadId = String(lead?._id || "");
                  const shortId = leadId.length >= 6 ? leadId.slice(-6).toUpperCase() : leadId.toUpperCase();
                  const leadEmail = lead?.email || "";

                  return (
                    <div
                      key={leadId || Math.random().toString()}
                      className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs space-y-3"
                    >
                      {/* Top Row: Avatar + Name + Short ID + Status Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-xs font-bold text-white shadow-xs flex-none">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm block truncate">
                              {leadName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ID: #{shortId}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset flex-none ${status.badgeClass}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {status.label}
                        </span>
                      </div>

                      {/* Middle Details: Monthly Salary or Description */}
                      <div className="rounded-lg bg-slate-50 p-2.5 text-xs border border-slate-100/80">
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-500">Pipeline Stage:</span>
                          <span className="font-semibold text-slate-800">
                            {app?.monthlySalary
                              ? `Income: ${formatCurrency(app.monthlySalary)}/mo`
                              : status.description}
                          </span>
                        </div>
                      </div>

                      {/* Contact Email & Registration Date */}
                      <div className="flex flex-col gap-1.5 text-xs pt-1 border-t border-slate-100">
                        <div className="flex items-center justify-between text-slate-600">
                          <div className="flex items-center gap-1.5 min-w-0 pr-2">
                            <Mail className="h-3.5 w-3.5 text-slate-400 flex-none" />
                            <span className="truncate text-[11px]">{leadEmail || "No email"}</span>
                          </div>
                          {leadEmail && (
                            <button
                              type="button"
                              onClick={() => copyEmail(leadEmail, leadId)}
                              className="text-slate-400 hover:text-brand-600 p-1 rounded transition-colors flex-none"
                              title="Copy email"
                            >
                              {copiedId === leadId ? (
                                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                                  <Check className="h-3 w-3" /> Copied
                                </span>
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 flex-none" />
                            <span suppressHydrationWarning>Registered: {formatDate(lead?.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      {leadEmail && (
                        <a
                          href={`mailto:${leadEmail}?subject=Personal%20Loan%20Application%20Assistance&body=Hi%20${encodeURIComponent(
                            leadName
                          )},%0D%0A%0D%0We%20noticed%20you%20started%20an%20application%20for%20a%20personal%20loan%20at%2012%25%20p.a.%20simple%20interest.%20Let%20us%20know%20if%20you%20need%20any%20assistance%20completing%20your%20application.%0D%0A%0D%0ABest%20regards,%0D%0ALoan%20Management%20Team`}
                          className="flex items-center justify-center gap-1.5 w-full text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 py-2 rounded-xl transition-colors border border-brand-200/60"
                        >
                          <Mail className="h-3.5 w-3.5" />
                          <span>Contact Lead</span>
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP TABLE VIEW (hidden md:block) */}
              <div className="hidden md:block overflow-x-auto mt-3">
                <table className="w-full min-w-[700px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-3">Borrower Lead</th>
                      <th className="py-3 px-3">Contact Email</th>
                      <th className="py-3 px-3">Registered On</th>
                      <th className="py-3 px-3">Application Progress</th>
                      <th className="py-3 px-3 text-right">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredLeads.map((lead) => {
                      const status = getLeadStatus(lead);
                      const app = Array.isArray(lead?.application) ? lead.application[0] : undefined;
                      const leadName = lead?.name || lead?.email?.split("@")[0] || "Borrower Lead";
                      const initial = (leadName.charAt(0) || "B").toUpperCase();
                      const leadId = String(lead?._id || "");
                      const shortId = leadId.length >= 6 ? leadId.slice(-6).toUpperCase() : leadId.toUpperCase();
                      const leadEmail = lead?.email || "";

                      return (
                        <tr
                          key={leadId || Math.random().toString()}
                          className="hover:bg-slate-50/70 transition-colors group"
                        >
                          {/* Borrower Name & Initials */}
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 text-xs font-bold text-white shadow-xs flex-none">
                                {initial}
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block">{leadName}</span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  ID: #{shortId}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Contact Email with Copy Button */}
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <Mail className="h-3.5 w-3.5 text-slate-400 flex-none" />
                              <span className="truncate max-w-[200px]">{leadEmail || "—"}</span>
                              {leadEmail && (
                                <button
                                  type="button"
                                  onClick={() => copyEmail(leadEmail, leadId)}
                                  className="text-slate-400 hover:text-brand-600 p-0.5 rounded transition-colors ml-1 opacity-60 group-hover:opacity-100"
                                  title="Copy email address"
                                >
                                  {copiedId === leadId ? (
                                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Registration Date */}
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <Calendar className="h-3.5 w-3.5 text-slate-400 flex-none" />
                              <span suppressHydrationWarning>
                                {formatDate(lead?.createdAt)}
                              </span>
                            </div>
                          </td>

                          {/* Application Funnel Progress */}
                          <td className="py-3.5 px-3">
                            <div className="flex flex-col gap-0.5">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset w-fit ${status.badgeClass}`}
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                                {status.label}
                              </span>
                              <span className="text-[10px] text-slate-400 truncate max-w-[220px]">
                                {app?.monthlySalary
                                  ? `Income: ${formatCurrency(app.monthlySalary)}/mo`
                                  : status.description}
                              </span>
                            </div>
                          </td>

                          {/* Quick Action Button */}
                          <td className="py-3.5 px-3 text-right">
                            {leadEmail ? (
                              <a
                                href={`mailto:${leadEmail}?subject=Personal%20Loan%20Application%20Assistance&body=Hi%20${encodeURIComponent(
                                  leadName
                                )},%0D%0A%0D%0AWe%20noticed%20you%20started%20an%20application%20for%20a%20personal%20loan%20at%2012%25%20p.a.%20simple%20interest.%20Let%20us%20know%20if%20you%20need%20any%20assistance%20completing%20your%20application.%0D%0A%0D%0ABest%20regards,%0D%0ALoan%20Management%20Team`}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors"
                              >
                                <Mail className="h-3 w-3" />
                                <span>Contact Lead</span>
                              </a>
                            ) : (
                              <span className="text-slate-400 text-[11px]">No contact</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}

      {/* TAB 2: CONVERTED BORROWERS */}
      {activeTab === "CONVERTED" && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-6 shadow-soft">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 pb-3.5 sm:pb-4 border-b border-slate-100">
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Converted Borrowers Archive</h2>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                {filteredConverted.length} of {converted.length} Converted
              </span>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
                <Search className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search borrower, email, ID..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/10 transition-colors"
              />
            </div>
          </div>

          {filteredConverted.length === 0 ? (
            <div className="py-12 sm:py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                <UserCheck className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">No converted borrowers found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? "No converted borrowers match your search criteria."
                  : "When prospective leads submit their finalized loan applications, their conversion will be permanently tracked here."}
              </p>
            </div>
          ) : (
            <>
              {/* MOBILE CARDS VIEW (block md:hidden) */}
              <div className="grid gap-3 mt-3.5 block md:hidden">
                {filteredConverted.map((item) => {
                  const name = item.name || "Borrower";
                  const initial = name.charAt(0).toUpperCase();
                  const shortId = item._id.slice(-6).toUpperCase();
                  const activeLoan = item.loans?.[0];
                  const app = Array.isArray(item.application) ? item.application[0] : undefined;

                  return (
                    <div
                      key={item._id}
                      className="rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs space-y-3"
                    >
                      {/* Top Row: Avatar + Name + ID + Pipeline Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-xs font-bold text-white shadow-xs flex-none">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-xs sm:text-sm block truncate">
                                {name}
                              </span>
                              {item.loans && item.loans.length > 1 && (
                                <span className="rounded-md bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.2 text-[9px] font-bold text-indigo-700">
                                  {item.loans.length} Loans
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                              <span className="font-mono">#{shortId}</span>
                              {app?.pan && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono uppercase font-semibold text-slate-600">PAN: {app.pan}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {activeLoan ? (
                          <div className="flex flex-col items-end gap-0.5">
                            <StatusBadge status={activeLoan.status as any} />
                            {item.loans && item.loans.length > 1 && (
                              <span className="text-[9px] text-slate-400 font-mono">
                                Latest #{activeLoan._id.slice(-6).toUpperCase()}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5">
                            Applied
                          </span>
                        )}
                      </div>

                      {/* Financial Info Pill Grid */}
                      {activeLoan && (
                        <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2.5 text-xs border border-slate-100/80">
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-semibold">Principal</span>
                            <span className="font-bold text-slate-900 text-xs">
                              {formatCurrency(activeLoan.principal)}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px] uppercase font-semibold">Total Repayment</span>
                            <span className="font-bold text-brand-700 text-xs">
                              {formatCurrency(activeLoan.totalRepayment)}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Email & Date Row */}
                      <div className="flex flex-col gap-1 text-xs pt-1 border-t border-slate-100">
                        <div className="flex items-center justify-between text-slate-600">
                          <div className="flex items-center gap-1.5 min-w-0 pr-2">
                            <Mail className="h-3.5 w-3.5 text-slate-400 flex-none" />
                            <span className="truncate text-[11px]">{item.email}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyEmail(item.email, item._id)}
                            className="text-slate-400 hover:text-brand-600 p-1 rounded transition-colors flex-none"
                            title="Copy email"
                          >
                            {copiedId === item._id ? (
                              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                                <Check className="h-3 w-3" /> Copied
                              </span>
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <Calendar className="h-3 w-3 flex-none" />
                          <span suppressHydrationWarning>Registered: {formatDate(item.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP TABLE VIEW (hidden md:block) */}
              <div className="hidden md:block overflow-x-auto mt-3">
                <table className="w-full min-w-[750px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-3">Borrower Profile</th>
                      <th className="py-3 px-3">Contact Email</th>
                      <th className="py-3 px-3">Registered On</th>
                      <th className="py-3 px-3">Active Pipeline Status</th>
                      <th className="py-3 px-3 text-right">Loan Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredConverted.map((item) => {
                      const name = item.name || "Borrower";
                      const initial = name.charAt(0).toUpperCase();
                      const shortId = item._id.slice(-6).toUpperCase();
                      const activeLoan = item.loans?.[0];
                      const app = Array.isArray(item.application) ? item.application[0] : undefined;

                      return (
                        <tr key={item._id} className="hover:bg-slate-50/70 transition-colors group">
                          {/* Borrower details */}
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-xs font-bold text-white shadow-xs flex-none">
                                {initial}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900 block">{name}</span>
                                  {item.loans && item.loans.length > 1 && (
                                    <span className="rounded-md bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.2 text-[9px] font-bold text-indigo-700">
                                      {item.loans.length} Loans
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                  <span className="font-mono">#{shortId}</span>
                                  {app?.pan && (
                                    <>
                                      <span>•</span>
                                      <span className="font-mono uppercase font-semibold text-slate-600">PAN: {app.pan}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Contact Email */}
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <Mail className="h-3.5 w-3.5 text-slate-400 flex-none" />
                              <span className="truncate max-w-[200px]">{item.email}</span>
                              <button
                                type="button"
                                onClick={() => copyEmail(item.email, item._id)}
                                className="text-slate-400 hover:text-brand-600 p-0.5 rounded transition-colors ml-1 opacity-60 group-hover:opacity-100"
                                title="Copy email address"
                              >
                                {copiedId === item._id ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Joined Date */}
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <Calendar className="h-3.5 w-3.5 text-slate-400 flex-none" />
                              <span suppressHydrationWarning>{formatDate(item.createdAt)}</span>
                            </div>
                          </td>

                          {/* Current Status */}
                          <td className="py-3.5 px-3">
                            {activeLoan ? (
                              <div className="flex flex-col gap-0.5">
                                <div className="flex items-center gap-1.5">
                                  <StatusBadge status={activeLoan.status as any} />
                                </div>
                                {item.loans && item.loans.length > 1 && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    Latest Loan #{activeLoan._id.slice(-6).toUpperCase()}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Applied</span>
                            )}
                          </td>

                          {/* Loan Value */}
                          <td className="py-3.5 px-3 text-right">
                            {activeLoan ? (
                              <div>
                                <span className="font-bold text-slate-900 block text-xs">
                                  {formatCurrency(activeLoan.principal)}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Repay: {formatCurrency(activeLoan.totalRepayment)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
