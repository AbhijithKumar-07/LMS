"use client";

import {
  Check,
  X,
  ShieldCheck,
  User,
  CreditCard,
  Wallet,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Layers,
  FileText,
  ExternalLink,
  History,
  Search,
  CheckCircle2,
  XCircle,
  Filter
} from "lucide-react";
import { SyntheticEvent, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";
import {
  buttonClass,
  dangerButtonClass,
  inputClass,
  MetricCard,
  Notice,
  secondaryButtonClass,
  StatusBadge
} from "@/components/ui";
import { apiRequest, formatCurrency, formatDate } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/config";
import type { Loan } from "@/types";

const commonRejectionReasons = [
  "Inadequate monthly salary for requested principal",
  "Unverifiable documents or salary slip discrepancy",
  "High risk debt-to-income profile",
  "Credit risk threshold not met"
];

export default function SanctionPage() {
  return (
    <AuthGate allow={["ADMIN", "SANCTION"]}>
      {(user) => (
        <AppShell user={user} section="dashboard">
          <SanctionModule />
        </AppShell>
      )}
    </AuthGate>
  );
}

function SanctionModule() {
  const [activeTab, setActiveTab] = useState<"QUEUE" | "HISTORY">("QUEUE");
  const [loans, setLoans] = useState<Loan[]>([]);
  const [historyLoans, setHistoryLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [historyFilter, setHistoryFilter] = useState<"ALL" | "SANCTIONED" | "REJECTED">("ALL");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
    title?: string;
  } | null>(null);

  // Sync tab with URL search param so browser refresh preserves the current tab
  useEffect(() => {
    if (typeof window !== "undefined") {
      const param = new URLSearchParams(window.location.search).get("tab");
      if (param === "history") {
        setActiveTab("HISTORY");
      } else if (param === "queue" || param === "active") {
        setActiveTab("QUEUE");
      }
    }
  }, []);

  function handleTabSwitch(tab: "QUEUE" | "HISTORY") {
    setActiveTab(tab);
    setSearchQuery("");
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab === "HISTORY" ? "history" : "queue");
      window.history.replaceState(null, "", url.toString());
    }
  }

  async function loadQueue() {
    setLoading(true);
    try {
      const response = await apiRequest<{ loans: Loan[] }>("/dashboard/sanction/loans", {
        token: getToken()
      });
      setLoans(response.loans);
    } catch (caught) {
      setMessage({
        type: "error",
        text: caught instanceof Error ? caught.message : "Failed to load sanction queue."
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const response = await apiRequest<{ history: Loan[] }>("/dashboard/sanction/history", {
        token: getToken()
      });
      setHistoryLoans(response.history);
    } catch (caught) {
      setMessage({
        type: "error",
        text: caught instanceof Error ? caught.message : "Failed to load sanction history."
      });
    } finally {
      setHistoryLoading(false);
    }
  }

  async function loadAll() {
    await Promise.all([loadQueue(), loadHistory()]);
  }

  useEffect(() => {
    loadAll();
  }, []);

  // Auto-dismiss notification after 4.5 seconds
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      setMessage(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [message]);

  async function handleApprove(id: string) {
    setActionLoading(id);
    setMessage(null);
    try {
      await apiRequest(`/dashboard/sanction/loans/${id}/approve`, {
        method: "PATCH",
        token: getToken(),
        body: JSON.stringify({})
      });
      setMessage({
        type: "success",
        title: "Loan Sanctioned",
        text: "The application has been approved and moved to the Disbursement Queue."
      });
      await loadAll();
    } catch (caught) {
      setMessage({
        type: "error",
        title: "Sanction Failed",
        text: caught instanceof Error ? caught.message : "Approval failed."
      });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(id: string, reason: string) {
    if (!reason.trim()) {
      setMessage({ type: "error", text: "Please select or type a rejection reason." });
      return;
    }

    setActionLoading(id);
    setMessage(null);
    try {
      await apiRequest(`/dashboard/sanction/loans/${id}/reject`, {
        method: "PATCH",
        token: getToken(),
        body: JSON.stringify({ reason })
      });
      setMessage({
        type: "success",
        title: "Loan Application Rejected",
        text: `Application has been marked as REJECTED with reason: "${reason}".`
      });
      setRejectingId(null);
      setCustomReason("");
      await loadAll();
    } catch (caught) {
      setMessage({
        type: "error",
        title: "Rejection Failed",
        text: caught instanceof Error ? caught.message : "Failed to reject loan."
      });
    } finally {
      setActionLoading(null);
    }
  }

  const totalQueueValue = loans.reduce((acc, curr) => acc + curr.principal, 0);

  const filteredHistory = useMemo(() => {
    return historyLoans.filter((item) => {
      const matchesSearch =
        (item.borrower?.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (item.borrower?.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (item.application?.pan?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        item._id.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (historyFilter === "SANCTIONED") {
        return item.status === "SANCTIONED" || item.status === "DISBURSED" || item.status === "CLOSED";
      }
      if (historyFilter === "REJECTED") {
        return item.status === "REJECTED";
      }
      return true;
    });
  }, [historyLoans, searchQuery, historyFilter]);

  const totalSanctionedCount = historyLoans.filter(
    (l) => l.status === "SANCTIONED" || l.status === "DISBURSED" || l.status === "CLOSED"
  ).length;
  const totalRejectedCount = historyLoans.filter((l) => l.status === "REJECTED").length;
  const totalSanctionedVolume = historyLoans
    .filter((l) => l.status === "SANCTIONED" || l.status === "DISBURSED" || l.status === "CLOSED")
    .reduce((acc, curr) => acc + curr.principal, 0);

  return (
    <div className="grid gap-5 sm:gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div>
          <div className="inline-flex items-center gap-2.5 rounded-2xl bg-amber-50 px-3 py-1.5 text-lg sm:text-2xl font-black tracking-tight text-amber-900 border border-amber-200/80 shadow-2xs mb-1">
            <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-xl bg-amber-600 text-white shadow-xs">
              <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <span>Sanction Desk</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Review borrower applications, verify underwriting criteria, and inspect historical approval decisions
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          {/* Segmented Control Tabs */}
          <div className="inline-flex flex-none rounded-2xl border border-slate-200/90 bg-slate-100/90 p-1 shadow-inner text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleTabSwitch("QUEUE")}
              className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 transition-all ${
                activeTab === "QUEUE"
                  ? "bg-white text-amber-700 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600" />
              <span>Active Queue</span>
              <span
                className={`rounded-full px-1.5 sm:px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === "QUEUE"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-200/80 text-slate-600"
                }`}
              >
                {loans.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabSwitch("HISTORY")}
              className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 transition-all ${
                activeTab === "HISTORY"
                  ? "bg-white text-amber-700 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <History className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600" />
              <span>Underwriting History</span>
              <span
                className={`rounded-full px-1.5 sm:px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === "HISTORY"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-200/80 text-slate-600"
                }`}
              >
                {historyLoans.length}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={loadAll}
            disabled={loading || historyLoading}
            className={`${secondaryButtonClass} text-xs py-1.5 sm:py-2 px-2.5 sm:px-3 flex-none`}
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading || historyLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {message && <Notice type={message.type} message={message.text} title={message.title} />}

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Pending Sanction"
          value={loans.length}
          subtitle="Applied loans waiting review"
          icon={Layers}
          color="amber"
        />
        <MetricCard
          label="Total Queue Value"
          value={formatCurrency(totalQueueValue)}
          subtitle="Cumulative pending principal"
          icon={Wallet}
          color="brand"
        />

        {/* Processed History Card aligned with other MetricCards */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft transition-all duration-200 hover:shadow-card-hover">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Processed History</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <History className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              {totalSanctionedCount} Approved
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 ring-1 ring-inset ring-rose-600/20">
              <XCircle className="h-3.5 w-3.5 text-rose-600" />
              {totalRejectedCount} Rejected
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Total volume: <span className="font-semibold text-slate-700">{formatCurrency(totalSanctionedVolume)}</span>
          </p>
        </div>
      </div>

      {/* Tab Content 1: Active Queue */}
      {activeTab === "QUEUE" && (
        <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-soft">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Loans Awaiting Sanction</h2>
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                {loans.length}
              </span>
            </div>
          </div>

          {loans.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">Queue is clear</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                There are currently no applied loans waiting for sanction review. Check the Underwriting History tab to view previously evaluated applications.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {loans.map((loan) => (
                <article
                  key={loan._id}
                  className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-slate-300"
                >
                  <div className="grid gap-5 lg:grid-cols-12 items-start">
                    {/* Borrower Details Column */}
                    <div className="lg:col-span-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={loan.status} />
                        <span className="text-[11px] text-slate-400 font-mono">
                          #{loan._id.slice(-6).toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 text-sm font-bold text-white shadow-xs">
                          {(loan.borrower?.name || "B").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            {loan.borrower?.name ?? "Borrower"}
                          </h3>
                          <p className="text-xs text-slate-500">{loan.borrower?.email}</p>
                        </div>
                      </div>

                      {/* Applicant Underwriting details */}
                      <div className="rounded-xl bg-slate-50/80 p-3.5 border border-slate-100 text-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">PAN Number:</span>
                          <span className="font-mono font-bold text-slate-800">
                            {loan.application?.pan ?? "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Monthly Salary:</span>
                          <span className="font-bold text-emerald-700">
                            {formatCurrency(loan.application?.monthlySalary ?? 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500">Employment:</span>
                          <span className="font-semibold text-slate-700">
                            {loan.application?.employmentMode ?? "N/A"}
                          </span>
                        </div>

                        <div className="flex justify-between items-center pt-1 border-t border-slate-200/60">
                          <span className="text-slate-500">Salary Slip:</span>
                          {loan.application?._id ? (
                            <a
                              href={`${API_BASE_URL}/dashboard/documents/${loan.application._id}/salary-slip?token=${getToken() || ""}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 border border-indigo-200/70 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 hover:border-indigo-300 transition-colors shadow-2xs"
                            >
                              <FileText className="h-3.5 w-3.5 text-indigo-600" />
                              <span>View Salary Slip</span>
                              <ExternalLink className="h-3 w-3 text-indigo-400" />
                            </a>
                          ) : (
                            <span className="text-slate-400 italic">Not available</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Loan Financial Calculation Breakdown */}
                    <div className="lg:col-span-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                          Principal
                        </span>
                        <span className="text-base font-extrabold text-slate-900 block">
                          {formatCurrency(loan.principal)}
                        </span>
                        <span className="text-[10px] text-slate-400">Requested</span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                          Tenure
                        </span>
                        <span className="text-base font-extrabold text-slate-900 block">
                          {loan.tenureDays}
                        </span>
                        <span className="text-[10px] text-slate-400">Days</span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                          Interest (12%)
                        </span>
                        <span className="text-base font-extrabold text-amber-600 block">
                          +{formatCurrency(loan.interest)}
                        </span>
                        <span className="text-[10px] text-slate-400">Simple Interest</span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                          Total Due
                        </span>
                        <span className="text-base font-extrabold text-slate-900 block">
                          {formatCurrency(loan.totalRepayment)}
                        </span>
                        <span className="text-[10px] text-slate-400">P + SI</span>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="lg:col-span-3 space-y-2">
                      <button
                        className={`${buttonClass} w-full text-xs py-2.5`}
                        type="button"
                        disabled={actionLoading === loan._id}
                        onClick={() => handleApprove(loan._id)}
                      >
                        <Check className="mr-1.5 h-4 w-4" aria-hidden="true" />
                        {actionLoading === loan._id ? "Sanctioning..." : "Approve & Sanction"}
                      </button>

                      <button
                        className={`${dangerButtonClass} w-full text-xs py-2`}
                        type="button"
                        onClick={() =>
                          setRejectingId(rejectingId === loan._id ? null : loan._id)
                        }
                      >
                        <X className="mr-1.5 h-4 w-4" aria-hidden="true" />
                        {rejectingId === loan._id ? "Close Reject Form" : "Reject Application"}
                      </button>
                    </div>
                  </div>

                  {/* Structured Rejection Form Panel */}
                  {rejectingId === loan._id && (
                    <div className="mt-4 pt-4 border-t border-slate-100 rounded-2xl bg-rose-50/50 p-4 border border-rose-100">
                      <div className="flex items-center gap-2 mb-2 text-xs font-bold text-rose-800">
                        <AlertTriangle className="h-4 w-4 text-rose-600" />
                        <span>Select or enter rejection reason</span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {commonRejectionReasons.map((reason) => (
                          <button
                            key={reason}
                            type="button"
                            onClick={() => setCustomReason(reason)}
                            className="rounded-lg border border-rose-200 bg-white px-2.5 py-1 text-[11px] font-medium text-rose-700 hover:bg-rose-100 transition-colors"
                          >
                            {reason}
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <input
                          className={inputClass}
                          value={customReason}
                          onChange={(e) => setCustomReason(e.target.value)}
                          placeholder="Type or select reason..."
                        />
                        <button
                          className={`${dangerButtonClass} flex-none text-xs`}
                          type="button"
                          disabled={actionLoading === loan._id || !customReason.trim()}
                          onClick={() => handleReject(loan._id, customReason)}
                        >
                          Confirm Reject
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Tab Content 2: Underwriting History Archive */}
      {activeTab === "HISTORY" && (
        <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-soft space-y-4">
          {/* Filter and Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="relative min-w-[240px] max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search history by borrower, PAN, ID..."
                className={`${inputClass} pl-9 text-xs py-2`}
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setHistoryFilter("ALL")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                  historyFilter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Decisions ({historyLoans.length})
              </button>
              <button
                type="button"
                onClick={() => setHistoryFilter("SANCTIONED")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                  historyFilter === "SANCTIONED" ? "bg-emerald-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Sanctioned ({totalSanctionedCount})
              </button>
              <button
                type="button"
                onClick={() => setHistoryFilter("REJECTED")}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                  historyFilter === "REJECTED" ? "bg-rose-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Rejected ({totalRejectedCount})
              </button>
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                <History className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">No historical records found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery || historyFilter !== "ALL"
                  ? "No historical records matched your search and filter criteria."
                  : "No applications have been sanctioned or rejected yet."}
              </p>
            </div>
          ) : (
            <div className="grid gap-3.5">
              {filteredHistory.map((item) => {
                const isSanctioned =
                  item.status === "SANCTIONED" || item.status === "DISBURSED" || item.status === "CLOSED";
                const isRejected = item.status === "REJECTED";

                return (
                  <article
                    key={item._id}
                    className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition-colors"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {/* Left: Borrower & Status */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold text-white shadow-xs ${
                            isSanctioned
                              ? "bg-gradient-to-tr from-emerald-600 to-teal-500"
                              : "bg-gradient-to-tr from-rose-600 to-pink-500"
                          }`}
                        >
                          {(item.borrower?.name || "B").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900">
                              {item.borrower?.name ?? "Borrower"}
                            </h3>
                            <StatusBadge status={item.status} />
                            <span className="text-[10px] text-slate-400 font-mono">
                              #{item._id.slice(-6).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-0.5">
                            <span>{item.borrower?.email}</span>
                            <span>•</span>
                            <span className="font-mono">PAN: {item.application?.pan ?? "N/A"}</span>
                            <span>•</span>
                            <span className="font-semibold text-slate-700">
                              Salary: {formatCurrency(item.application?.monthlySalary ?? 0)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Financial Amount & Decision Date */}
                      <div className="text-right">
                        <span className="text-sm sm:text-base font-extrabold text-slate-900 block">
                          {formatCurrency(item.principal)}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {item.tenureDays} Days @ 12% • Total: {formatCurrency(item.totalRepayment)}
                        </span>
                      </div>
                    </div>

                    {/* Rejection reason callout if rejected */}
                    {isRejected && item.rejectionReason && (
                      <div className="mt-3 flex items-start gap-2 rounded-xl bg-rose-50/80 border border-rose-200/70 p-3 text-xs text-rose-800">
                        <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Rejection Reason:</span>{" "}
                          <span>{item.rejectionReason}</span>
                        </div>
                      </div>
                    )}

                    {/* Footer with Salary Slip link and Timestamp */}
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
                      <div className="flex items-center gap-2">
                        {item.application?._id ? (
                          <a
                            href={`${API_BASE_URL}/dashboard/documents/${item.application._id}/salary-slip?token=${getToken() || ""}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-indigo-600 font-semibold hover:underline"
                          >
                            <FileText className="h-3 w-3" />
                            <span>View Salary Slip</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        <span>
                          Decision Timestamp:{" "}
                          <span className="font-medium text-slate-600">
                            {formatDate(item.sanctionedAt || item.updatedAt || item.createdAt)}
                          </span>
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
