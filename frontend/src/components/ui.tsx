import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";
import React from "react";

export function Field({
  label,
  children,
  hint,
  badge,
  error
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  badge?: string;
  error?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
          {label}
        </label>
        {badge && (
          <span className="text-[11px] font-medium text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
            {badge}
          </span>
        )}
      </div>
      {children}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
    </div>
  );
}

export const inputClass =
  "w-full rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm transition-all duration-150 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 disabled:bg-slate-50 disabled:text-slate-500";

export const selectClass =
  "w-full rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm transition-all duration-150 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 disabled:bg-slate-50 disabled:text-slate-500";

export const buttonClass =
  "inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-brand-500/25 transition-all duration-150 hover:from-brand-700 hover:to-indigo-700 hover:shadow-md hover:shadow-brand-500/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-none";

export const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-150 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60";

export const dangerButtonClass =
  "inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm font-semibold text-rose-700 transition-all duration-150 hover:bg-rose-100 hover:border-rose-300 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60";

export const successButtonClass =
  "inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-emerald-600/25 transition-all duration-150 hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60";

export function Notice({
  type,
  message,
  title
}: {
  type: "success" | "error" | "info" | "warning";
  message: string;
  title?: string;
}) {
  const configs = {
    success: {
      Icon: CheckCircle2,
      container: "border-emerald-200 bg-emerald-50/80 text-emerald-900",
      iconColor: "text-emerald-600"
    },
    error: {
      Icon: AlertCircle,
      container: "border-rose-200 bg-rose-50/80 text-rose-900",
      iconColor: "text-rose-600"
    },
    warning: {
      Icon: AlertTriangle,
      container: "border-amber-200 bg-amber-50/80 text-amber-900",
      iconColor: "text-amber-600"
    },
    info: {
      Icon: Info,
      container: "border-blue-200 bg-blue-50/80 text-blue-900",
      iconColor: "text-blue-600"
    }
  };

  const config = configs[type] || configs.info;
  const Icon = config.Icon;

  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 shadow-sm backdrop-blur-sm ${config.container}`}>
      <Icon className={`mt-0.5 h-5 w-5 flex-none ${config.iconColor}`} aria-hidden="true" />
      <div className="text-sm">
        {title && <h4 className="font-semibold">{title}</h4>}
        <p className="mt-0.5 leading-relaxed">{message}</p>
      </div>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; text: string; ring: string; dot: string }> = {
    APPLIED: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      ring: "ring-blue-600/20",
      dot: "bg-blue-600"
    },
    SANCTIONED: {
      bg: "bg-amber-50",
      text: "text-amber-800",
      ring: "ring-amber-600/20",
      dot: "bg-amber-500"
    },
    REJECTED: {
      bg: "bg-rose-50",
      text: "text-rose-700",
      ring: "ring-rose-600/20",
      dot: "bg-rose-600"
    },
    DISBURSED: {
      bg: "bg-cyan-50",
      text: "text-cyan-800",
      ring: "ring-cyan-600/20",
      dot: "bg-cyan-500"
    },
    CLOSED: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      ring: "ring-emerald-600/20",
      dot: "bg-emerald-500"
    }
  };

  const style = styles[status] ?? {
    bg: "bg-slate-50",
    text: "text-slate-700",
    ring: "ring-slate-600/20",
    dot: "bg-slate-400"
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style.bg} ${style.text} ${style.ring}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "brand"
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  trend?: string;
  color?: "brand" | "emerald" | "amber" | "sky";
}) {
  const iconBg = {
    brand: "bg-brand-50 text-brand-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    sky: "bg-sky-50 text-sky-600"
  }[color];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft transition-all duration-200 hover:shadow-card-hover">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        {Icon && (
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900">{value}</span>
        {trend && <span className="text-xs font-semibold text-emerald-600">{trend}</span>}
      </div>
      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
}

export function ProgressBar({
  value,
  max,
  color = "brand"
}: {
  value: number;
  max: number;
  color?: "brand" | "emerald" | "amber";
}) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100))) || 0;
  const barColor = {
    brand: "bg-brand-600",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500"
  }[color];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1">
        <span>Progress</span>
        <span>{percentage}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-200/80 ${className || "h-6 w-full"}`}
    />
  );
}

export function MetricSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-3 w-40" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-soft space-y-4">
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div className="space-y-3 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-3 border-b border-slate-50">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-7 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
