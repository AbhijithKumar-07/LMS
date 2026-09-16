"use client";

import {
  ReceiptText,
  Calendar,
  CheckCircle2,
  Clock,
  RefreshCw,
  Wallet,
  ShieldCheck,
  TrendingUp,
  Percent,
  Coins,
  Banknote,
  Search,
  CheckCircle,
  FileText,
  ExternalLink,
  Award,
  History
} from "lucide-react";
import { SyntheticEvent, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { AuthGate } from "@/components/AuthGate";
import {
  buttonClass,
  inputClass,
  MetricCard,
  MetricSkeleton,
  Notice,
  ProgressBar,
  secondaryButtonClass,
  StatusBadge,
  TableSkeleton
} from "@/components/ui";
import { apiRequest, formatCurrency, formatDate } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { getLocalCache, setLocalCache } from "@/lib/cache";
import type { Loan } from "@/types";

export default function CollectionPage() {
  return (
    <AuthGate allow={["ADMIN", "COLLECTION"]}>
      {(user) => (
        <AppShell user={user} section="dashboard">
          <CollectionModule />
        </AppShell>
      )}
    </AuthGate>
  );
}

function CollectionModule() {
  const [loans, setLoans] = useState<Loan[]>(() => getLocalCache<Loan[]>("lms_cache_collection_loans") || []);
  const [history, setHistory] = useState<Loan[]>(() => getLocalCache<Loan[]>("lms_cache_collection_history") || []);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "HISTORY">("ACTIVE");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(() => !getLocalCache<Loan[]>("lms_cache_collection_loans"));
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
    title?: string;
  } | null>(null);

  const [todayDate, setTodayDate] = useState("");

  // Sync tab with URL search param so browser refresh preserves the current tab
  useEffect(() => {
    if (typeof window !== "undefined") {
      const param = new URLSearchParams(window.location.search).get("tab");
      if (param === "history" || param === "settled") {
        setActiveTab("HISTORY");
      } else if (param === "active" || param === "queue") {
        setActiveTab("ACTIVE");
      }
    }
  }, []);

  function handleTabSwitch(tab: "ACTIVE" | "HISTORY") {
    setActiveTab(tab);
    setSearchQuery("");
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab === "HISTORY" ? "history" : "active");
      window.history.replaceState(null, "", url.toString());
    }
  }

  async function load() {
    setLoading(true);
    try {
      const [loansRes, historyRes] = await Promise.all([
        apiRequest<{ loans: Loan[] }>("/dashboard/collection/loans", {
          token: getToken()
        }),
        apiRequest<{ history: Loan[] }>("/dashboard/collection/history", {
          token: getToken()
        })
      ]);
      const fetchedLoans = loansRes.loans || [];
      const fetchedHistory = historyRes.history || [];
      setLoans(fetchedLoans);
      setHistory(fetchedHistory);
      setLocalCache("lms_cache_collection_loans", fetchedLoans);
      setLocalCache("lms_cache_collection_history", fetchedHistory);
    } catch (caught) {
      setMessage({
        type: "error",
        text: caught instanceof Error ? caught.message : "Failed to load collection queue."
      });
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }

  useEffect(() => {
    setTodayDate(new Date().toISOString().split("T")[0]);
    load();
  }, []);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      setMessage(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [message]);

  async function recordPayment(event: SyntheticEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setRecordingId(id);
    setMessage(null);

    const form = new FormData(formElement);
    const amountVal = Number(form.get("amount"));

    try {
      const result = await apiRequest<{ payment: unknown; loan: Loan }>(
        `/dashboard/collection/loans/${id}/payments`,
        {
          method: "POST",
          token: getToken(),
          body: JSON.stringify({
            utrNumber: form.get("utrNumber"),
            amount: amountVal,
            paidAt: form.get("paidAt")
          })
        }
      );

      const isClosed = result.loan.status === "CLOSED";
      setMessage({
        type: "success",
        title: isClosed ? "Loan Fully Settled & CLOSED!" : "Payment Successfully Recorded",
        text: isClosed
          ? `Full payment of ${formatCurrency(amountVal)} received. Outstanding balance is ₹0, and loan status has transitioned to CLOSED.`
          : `Recorded payment of ${formatCurrency(amountVal)}. Remaining balance: ${formatCurrency(result.loan.outstandingAmount)}.`
      });

      formElement?.reset();
      await load();
    } catch (caught) {
      setMessage({
        type: "error",
        title: "Payment Recording Failed",
        text: caught instanceof Error ? caught.message : "Failed to record payment."
      });
    } finally {
      setRecordingId(null);
    }
  }

  const totalOutstanding = loans.reduce((acc, curr) => acc + (curr.outstandingAmount || 0), 0);
  const totalCollectedActive = loans.reduce((acc, curr) => acc + (curr.totalPaid || 0), 0);
  const totalSettledHistory = history.reduce((acc, curr) => acc + (curr.totalPaid || curr.totalRepayment || 0), 0);
  const totalCollected = totalCollectedActive + totalSettledHistory;

  // Filtered history
  const filteredHistory = useMemo(() => {
    return (history || []).filter((loan) => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      const borrowerName = loan.borrower?.name || "";
      const borrowerEmail = loan.borrower?.email || "";
      const loanId = String(loan._id || "");
      return (
        borrowerName.toLowerCase().includes(q) ||
        borrowerEmail.toLowerCase().includes(q) ||
        loanId.toLowerCase().includes(q)
      );
    });
  }, [history, searchQuery]);

  return (
    <div className="grid gap-5 sm:gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
        <div>
          <div className="inline-flex items-center gap-2.5 rounded-2xl bg-emerald-50 px-3 py-1.5 text-lg sm:text-2xl font-black tracking-tight text-emerald-900 border border-emerald-200/80 shadow-2xs mb-1">
            <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <ReceiptText className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
            <span>Collections Hub</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Log UTR payment transactions against active disbursed loans. Auto-closes upon complete settlement.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
          {/* Segmented Control Tabs */}
          <div className="inline-flex flex-none rounded-2xl border border-slate-200/90 bg-slate-100/90 p-1 shadow-inner text-xs font-semibold">
            <button
              type="button"
              onClick={() => handleTabSwitch("ACTIVE")}
              className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-4 py-1.5 sm:py-2 transition-all ${
                activeTab === "ACTIVE"
                  ? "bg-white text-emerald-700 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ReceiptText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
              <span>Active Loans</span>
              <span
                className={`rounded-full px-1.5 sm:px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === "ACTIVE"
                    ? "bg-emerald-100 text-emerald-800"
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
                  ? "bg-white text-emerald-700 shadow-sm font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <History className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
              <span>Settled Archive</span>
              <span
                className={`rounded-full px-1.5 sm:px-2 py-0.5 text-[10px] font-bold ${
                  activeTab === "HISTORY"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200/80 text-slate-600"
                }`}
              >
                {history.length}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={load}
            disabled={loading}
            className={`${secondaryButtonClass} text-xs py-1.5 sm:py-2 px-2.5 sm:px-3 flex-none`}
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {message && <Notice type={message.type} message={message.text} title={message.title} />}

      {/* KPI Stats */}
      {initialLoading && loans.length === 0 && history.length === 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <MetricSkeleton />
          <MetricSkeleton />
          <MetricSkeleton />
          <MetricSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <MetricCard
            label="Active Disbursed"
            value={loans.length}
            subtitle="Awaiting settlement"
            icon={Wallet}
            color="emerald"
          />
          <MetricCard
            label="Total Outstanding"
            value={formatCurrency(totalOutstanding)}
            subtitle="Remaining capital"
            icon={Banknote}
            color="brand"
          />
          <MetricCard
            label="Total Recovered"
            value={formatCurrency(totalCollected)}
            subtitle="Active + settled"
            icon={Coins}
            color="sky"
          />
          <MetricCard
            label="Fully Settled"
            value={history.length}
            subtitle="100% recovered"
            icon={Award}
            color="emerald"
          />
        </div>
      )}

      {/* TAB 1: ACTIVE DISBURSED LOANS */}
      {activeTab === "ACTIVE" && (
        <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-soft">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Active Repayment Queue</h2>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                {loans.length} Active
              </span>
            </div>
          </div>

          {initialLoading && loans.length === 0 ? (
            <TableSkeleton rows={3} />
          ) : loans.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">No active loans waiting for collection</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                All disbursed loans are either fully repaid and archived in the settled tab, or no new loans have been disbursed yet.
              </p>
            </div>
          ) : (
            <div className="grid gap-5">
              {loans.map((loan) => {
                const paidPercent = Math.min(
                  100,
                  Math.round((loan.totalPaid / loan.totalRepayment) * 100)
                );

                return (
                  <article
                    key={loan._id}
                    className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:border-slate-300"
                  >
                    <div className="grid gap-5 xl:grid-cols-12 items-start">
                      {/* Borrower Profile & Status */}
                      <div className="xl:col-span-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <StatusBadge status={loan.status} />
                          <span className="text-[11px] text-slate-400 font-mono">
                            #{loan._id.slice(-6).toUpperCase()}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-sm font-bold text-white shadow-xs">
                            {(loan.borrower?.name || "B").charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">
                              {loan.borrower?.name ?? "Borrower"}
                            </h3>
                            <p className="text-xs text-slate-500">{loan.borrower?.email}</p>
                          </div>
                        </div>

                        {/* Repayment Progress Bar */}
                        <div className="pt-1">
                          <ProgressBar
                            value={loan.totalPaid}
                            max={loan.totalRepayment}
                            color="emerald"
                          />
                          <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                            <span>Paid: {formatCurrency(loan.totalPaid)}</span>
                            <span className="font-semibold text-brand-700">
                              Left: {formatCurrency(loan.outstandingAmount)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Financial Summary */}
                      <div className="xl:col-span-3 grid grid-cols-2 gap-2 text-xs bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                            Total Repayment
                          </span>
                          <span className="text-sm font-bold text-slate-800">
                            {formatCurrency(loan.totalRepayment)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                            Tenure
                          </span>
                          <span className="text-sm font-bold text-slate-800">
                            {loan.tenureDays} Days
                          </span>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-slate-200/60 flex justify-between items-baseline">
                          <span className="text-slate-600 font-medium">Outstanding:</span>
                          <span className="text-base font-extrabold text-slate-900">
                            {formatCurrency(loan.outstandingAmount)}
                          </span>
                        </div>
                      </div>

                      {/* Payment Recording Form */}
                      <div className="xl:col-span-5 bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <ReceiptText className="h-3.5 w-3.5 text-brand-600" />
                            Record UTR Payment
                          </span>
                          <span className="text-[10px] text-slate-400">Unique UTR required</span>
                        </div>

                        <form
                          id={`form-${loan._id}`}
                          className="grid gap-2 sm:grid-cols-2"
                          onSubmit={(event) => recordPayment(event, loan._id)}
                        >
                          <div className="sm:col-span-2">
                            <input
                              className={`${inputClass} text-xs py-2 uppercase font-mono tracking-wider`}
                              name="utrNumber"
                              placeholder="Unique UTR (e.g. UTR8392019482)"
                              required
                            />
                          </div>

                          <div>
                            <div className="relative">
                              <input
                                className={`${inputClass} text-xs py-2`}
                                name="amount"
                                id={`amount-${loan._id}`}
                                type="number"
                                min={1}
                                max={loan.outstandingAmount}
                                placeholder={`Amount (max ₹${loan.outstandingAmount})`}
                                required
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const input = document.getElementById(
                                    `amount-${loan._id}`
                                  ) as HTMLInputElement;
                                  if (input) input.value = String(loan.outstandingAmount);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 px-1.5 py-0.5 rounded transition-colors"
                              >
                                Full
                              </button>
                            </div>
                          </div>

                          <div>
                            <input
                              className={`${inputClass} text-xs py-2`}
                              name="paidAt"
                              type="date"
                              defaultValue={todayDate}
                              max={todayDate || new Date().toISOString().split("T")[0]}
                              required
                            />
                          </div>

                          <div className="sm:col-span-2 pt-1">
                            <button
                              className={`${buttonClass} w-full text-xs py-2`}
                              type="submit"
                              disabled={recordingId === loan._id}
                            >
                              <ReceiptText className="mr-1.5 h-3.5 w-3.5" />
                              {recordingId === loan._id ? "Recording Payment..." : "Record Payment & Reconcile"}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: SETTLED & CLOSED LOANS ARCHIVE */}
      {activeTab === "HISTORY" && (
        <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-soft">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Closed & Fully Settled Archive</h2>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                {filteredHistory.length} of {history.length} Settled
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
                placeholder="Search borrower, email, loan ID..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/10 transition-colors"
              />
            </div>
          </div>

          {initialLoading && history.length === 0 ? (
            <TableSkeleton rows={3} />
          ) : filteredHistory.length === 0 ? (
            <div className="py-14 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                <Award className="h-6 w-6 text-slate-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">No settled loans in archive</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery
                  ? "No closed loans match your search criteria."
                  : "When borrowers complete their full repayment, their loans will be permanently archived here as 100% recovered."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-3">Borrower / Loan</th>
                    <th className="py-3 px-3">Principal & Interest</th>
                    <th className="py-3 px-3">Total Recovered</th>
                    <th className="py-3 px-3">Settlement Date</th>
                    <th className="py-3 px-3 text-right">Status & Certificate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.map((loan) => {
                    const borrowerName = loan.borrower?.name || "Borrower";
                    const shortId = loan._id.slice(-6).toUpperCase();

                    return (
                      <tr key={loan._id} className="hover:bg-slate-50/70 transition-colors group">
                        {/* Borrower details */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-xs font-bold text-white shadow-xs">
                              {borrowerName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{borrowerName}</span>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                <span>{loan.borrower?.email}</span>
                                <span>•</span>
                                <span className="font-mono font-bold text-slate-500">#{shortId}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Principal & Interest */}
                        <td className="py-3.5 px-3">
                          <div>
                            <span className="font-bold text-slate-800 block text-xs">
                              {formatCurrency(loan.principal)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Total: {formatCurrency(loan.totalRepayment)} ({loan.tenureDays}d @ {loan.interestRate}%)
                            </span>
                          </div>
                        </td>

                        {/* Total Recovered */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle className="h-4 w-4 text-emerald-600 flex-none" />
                            <div>
                              <span className="font-bold text-emerald-700 block text-xs">
                                {formatCurrency(loan.totalPaid || loan.totalRepayment)}
                              </span>
                              <span className="text-[10px] font-semibold text-emerald-600">
                                100% Fully Recovered (₹0 Left)
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Settlement Date */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Calendar className="h-3.5 w-3.5 text-slate-400 flex-none" />
                            <span suppressHydrationWarning>
                              {formatDate(loan.closedAt || loan.updatedAt)}
                            </span>
                          </div>
                        </td>

                        {/* Status & NOC */}
                        <td className="py-3.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 shadow-2xs">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                            <span>CLOSED & NOC ISSUED</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
