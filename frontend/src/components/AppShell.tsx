"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut,
  TrendingUp,
  ShieldCheck,
  Landmark,
  ReceiptText,
  Layers
} from "lucide-react";
import { useLogout } from "./AuthGate";
import { AppMark } from "./AppMark";
import type { Role, User } from "@/types";

const dashboardNav: Array<{
  href: string;
  label: string;
  roles: Role[];
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}> = [
  {
    href: "/dashboard/sales",
    label: "Sales Leads",
    roles: ["SALES"],
    icon: TrendingUp,
    description: "Lead tracking & pre-application pipeline"
  },
  {
    href: "/dashboard/sanction",
    label: "Sanction Queue",
    roles: ["SANCTION"],
    icon: ShieldCheck,
    description: "Underwriting review & approval engine"
  },
  {
    href: "/dashboard/disbursement",
    label: "Disbursement",
    roles: ["DISBURSEMENT"],
    icon: Landmark,
    description: "Fund release & payout authorization"
  },
  {
    href: "/dashboard/collection",
    label: "Collections",
    roles: ["COLLECTION"],
    icon: ReceiptText,
    description: "Payment reconciliation & auto-closure"
  }
];

function visibleDashboardNav(role: Role) {
  if (role === "ADMIN") {
    return dashboardNav;
  }
  return dashboardNav.filter((item) => item.roles.includes(role));
}

export function AppShell({
  user,
  children,
  section
}: {
  user: User;
  children: React.ReactNode;
  section: "borrower" | "dashboard";
}) {
  const pathname = usePathname();
  const logout = useLogout();
  const nav =
    section === "borrower"
      ? []
      : visibleDashboardNav(user.role);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-50/50 to-slate-100/70 text-slate-900 flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5 gap-2 sm:gap-4">
          {/* Brand Logo */}
          <div className="cursor-default select-none flex-none">
            <AppMark compact={section === "dashboard" && user.role === "ADMIN"} />
          </div>

          {/* Desktop Navigation (Visible on lg+ screens for ADMIN) */}
          {section === "dashboard" && user.role === "ADMIN" && (
            <nav className="hidden lg:flex items-center gap-1 py-1 px-1.5 rounded-2xl bg-slate-100/80 border border-slate-200/70 shadow-2xs">
              <Link
                href="/dashboard"
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                  pathname === "/dashboard"
                    ? "bg-white text-slate-900 shadow-xs ring-1 ring-slate-200/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                <Layers className={`h-3.5 w-3.5 ${pathname === "/dashboard" ? "text-brand-600" : "text-slate-400"}`} />
                <span>Overview</span>
              </Link>

              {nav.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                      active
                        ? "bg-white text-slate-900 shadow-xs ring-1 ring-slate-200/80"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    }`}
                  >
                    <Icon
                      className={`h-3.5 w-3.5 ${
                        active ? "text-brand-600" : "text-slate-400"
                      }`}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2 sm:gap-3 flex-none">
            {/* User info pill */}
            <div className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-slate-200/80 bg-slate-50/80 px-2 sm:px-2.5 py-1 shadow-2xs">
              <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-gradient-to-tr from-brand-600 to-indigo-500 text-[11px] sm:text-xs font-bold text-white shadow-xs flex-none">
                {(user?.name || "U").charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col text-left pr-1">
                <span className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[120px] md:max-w-[160px]">
                  {user?.name || "Operations User"}
                </span>
                <span className="text-[10px] text-slate-500 leading-tight">
                  {user?.role || ""}
                </span>
              </div>
            </div>

            {/* Logout button - Fully Responsive with generous touch target & feedback */}
            <button
              type="button"
              onClick={logout}
              className="flex items-center justify-center gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl border border-slate-200/90 bg-white text-slate-700 shadow-2xs hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 active:scale-95 active:bg-rose-100 transition-all text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20 flex-none cursor-pointer group"
              title="Log out"
              aria-label="Log out"
            >
              <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-slate-500 group-hover:text-rose-600 transition-colors" aria-hidden="true" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Navigation Sub-Bar (Visible for ADMIN on < lg screens) */}
        {section === "dashboard" && user.role === "ADMIN" && (
          <div className="lg:hidden border-t border-slate-100 bg-slate-50/90 px-3 py-1.5 overflow-x-auto scrollbar-none">
            <nav className="flex items-center gap-1 min-w-max">
              <Link
                href="/dashboard"
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all whitespace-nowrap ${
                  pathname === "/dashboard"
                    ? "bg-white text-slate-900 shadow-xs ring-1 ring-slate-200"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                }`}
              >
                <Layers className={`h-3.5 w-3.5 ${pathname === "/dashboard" ? "text-brand-600" : "text-slate-400"}`} />
                <span>Overview</span>
              </Link>

              {nav.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all whitespace-nowrap ${
                      active
                        ? "bg-white text-slate-900 shadow-xs ring-1 ring-slate-200"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
                    }`}
                  >
                    <Icon
                      className={`h-3.5 w-3.5 ${
                        active ? "text-brand-600" : "text-slate-400"
                      }`}
                    />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {children}
      </main>
    </div>
  );
}
