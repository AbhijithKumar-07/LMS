"use client";

import {
  Banknote,
  Landmark,
  RefreshCw,
  CheckCircle2,
  Clock,
  Calendar,
  SendHorizontal,
  History,
  Search,
  FileText,
  ExternalLink,
  Layers,
  Wallet
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";
import {
  buttonClass,
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

export default function DisbursementPage() {
  return (
    <AuthGate allow={["ADMIN", "DISBURSEMENT"]}>
      {(user) => (
        <AppShell user={user} section="dashboard">
          <DisbursementModule />
        </AppShell>
      )}
    </AuthGate>
  );
}

function DisbursementModule() {
  const [activeTab, setActiveTab] = useState<"QUEUE" | "HISTORY">("QUEUE");
  const [loans, setLoans] = useState<Loan[]>([]);
  const [historyLoans, setHistoryLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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
      const response = await apiRequest<{ loans: Loan[] }>("/dashboard/disbursement/loans", {
        token: getToken()
      });
      setLoans(response.loans);
    } catch (caught) {
      setMessage({
        type: "error",
        text: caught instanceof Error ? caught.message : "Failed to load disbursement queue."
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const response = await apiRequest<{ history: Loan[] }>("/dashboard/disbursement/history", {
        token: getToken()
      });
      setHistoryLoans(response.history);
    } catch (caught) {
      setMessage({
        type: "error",
        text: caught instanceof Error ? caught.message : "Failed to load disbursement history."
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

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      setMessage(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [message]);

  async function disburse(id: string) {
    setActionLoading(id);
    setMessage(null);
    try {
      await apiRequest(`/dashboard/disbursement/loans/${id}/disburse`, {
        method: "PATCH",
        token: getToken(),
        body: JSON.stringify({})
      });
      setMessage({
        type: "success",
        title: "Funds Disbursed",
        text: "Loan funds have been marked as disbursed and moved to Collections."
      });
      await loadAll();
    } catch (caught) {
      setMessage({
        type: "error",
        title: "Disbursement Failed",
        text: caught instanceof Error ? caught.message : "Failed to disburse loan."
      });
    } finally {
      setActionLoading(null);
    }
  }

  const totalDisbursementValue = loans.reduce((acc, curr) => acc + curr.principal, 0);
  const totalHistoricalReleased = historyLoans.reduce((acc, curr) => acc + curr.principal, 0);

  const filteredHistory = useMemo(() => {
    return historyLoans.filter((item) => {
      return (
        (item.borrower?.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (item.borrower?.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (item.application?.pan?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        item._id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [historyLoans, searchQuery]);

  return (
    <div className="grid gap-5 sm:gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div>
          <div className="inline-flex items-center gap-2.5 rounded-2xl bg-cyan-50 px-3 py-1.5 text-lg sm:text-2xl font-black tracking-tight text-cyan-900 border border-cyan-200/80 shadow-2xs mb-1">
            <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-xl bg-cyan-600 text-white shadow-xs">
              <Landmark className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <span>Disbursement Desk</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Authorize capital disbursement, release loan funds, and inspect historical payout ledgers
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
                  ? "bg-white text-cyan-700 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-600" />
              <span>Pending Disbursals</span>
              <span
                className={`rounded-full px-1.5 sm:px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === "QUEUE"
                    ? "bg-cyan-100 text-cyan-800"
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
                  ? "bg-white text-cyan-700 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <History className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-600" />
              <span>Disbursal History</span>
              <span
                className={`rounded-full px-1.5 sm:px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === "HISTORY"
                    ? "bg-cyan-100 text-cyan-800"
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
          label="Awaiting Disbursal"
          value={loans.length}
          subtitle="Sanctioned loans ready for release"
          icon={Clock}
          color="amber"
        />
        <MetricCard
          label="Pending Release Volume"
          value={formatCurrency(totalDisbursementValue)}
          subtitle="Net transfer volume in queue"
          icon={Banknote}
          color="emerald"
        />
        <MetricCard
          label="Total Capital Disbursed"
          value={formatCurrency(totalHistoricalReleased)}
          subtitle={`${historyLoans.length} executed loan payouts`}
          icon={History}
          color="sky"
        />
      </div>

      {/* Tab Content 1: Active Queue */}
      {activeTab === "QUEUE" && (
        <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-soft">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Sanctioned Loans Ready for Payout</h2>
              <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-xs font-semibold text-cyan-700">
                {loans.length}
              </span>
            </div>
          </div>

          {loans.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                <Landmark className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">No disbursements pending</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                All sanctioned loans have been released or no applications are currently in the SANCTIONED stage. Check Disbursal History for past payouts.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-3">Borrower Details</th>
                    <th className="py-3 px-3">Lifecycle Status</th>
                    <th className="py-3 px-3">Disbursement Amount</th>
                    <th className="py-3 px-3">Tenure & Repayment</th>
                    <th className="py-3 px-3 text-right">Authorize Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loans.map((loan) => (
                    <tr key={loan._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 text-xs font-bold text-white shadow-xs">
                            {(loan.borrower?.name || "B").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block">
                              {loan.borrower?.name ?? "Borrower"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              PAN: {loan.application?.pan ?? "N/A"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <StatusBadge status={loan.status} />
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-sm font-extrabold text-slate-900 block">
                          {formatCurrency(loan.principal)}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-semibold">
                          Net Payout
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-800 block">
                          {formatCurrency(loan.totalRepayment)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {loan.tenureDays} Days @ 12% p.a.
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          className={`${buttonClass} text-xs py-2 px-3`}
                          type="button"
                          disabled={actionLoading === loan._id}
                          onClick={() => disburse(loan._id)}
                        >
                          <Banknote className="mr-1.5 h-4 w-4" aria-hidden="true" />
                          {actionLoading === loan._id ? "Disbursing..." : "Disburse Funds"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* Tab Content 2: Disbursement History */}
      {activeTab === "HISTORY" && (
        <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-soft space-y-4">
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
            <div className="text-xs text-slate-500 font-semibold">
              Showing {filteredHistory.length} of {historyLoans.length} executed payouts
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                <History className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">No historical records</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? "No disbursed loans match your search term."
                  : "No loan disbursements have been executed yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-3">Borrower Details</th>
                    <th className="py-3 px-3">Current Status</th>
                    <th className="py-3 px-3">Principal Disbursed</th>
                    <th className="py-3 px-3">Total Repayment</th>
                    <th className="py-3 px-3">Disbursal Date</th>
                    <th className="py-3 px-3 text-right">Documents</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-500 text-xs font-bold text-white shadow-xs">
                            {(item.borrower?.name || "B").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block">
                              {item.borrower?.name ?? "Borrower"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              PAN: {item.application?.pan ?? "N/A"} • #{item._id.slice(-6).toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <StatusBadge status={item.status} />
                      </td>

                      <td className="py-3 px-3">
                        <span className="text-sm font-extrabold text-slate-900 block">
                          {formatCurrency(item.principal)}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-semibold">
                          IMPS/NEFT Transferred
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-800 block">
                          {formatCurrency(item.totalRepayment)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {item.tenureDays} Days @ 12% p.a.
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>{formatDate(item.disbursedAt || item.updatedAt || item.createdAt)}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right">
                        {item.application?._id ? (
                          <a
                            href={`${API_BASE_URL}/dashboard/documents/${item.application._id}/salary-slip?token=${getToken() || ""}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-cyan-700 font-semibold hover:underline"
                          >
                            <FileText className="h-3 w-3" />
                            <span>Salary Slip</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

