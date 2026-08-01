"use client";

import type { ReactNode } from "react";

export type WorksheetCalloutVariant = "inquiry" | "reminder" | "guide" | "tip" | "structure" | "neutral";

const CALLOUT_STYLES: Record<WorksheetCalloutVariant, string> = {
  inquiry: "border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50/80",
  reminder: "border-indigo-200 bg-gradient-to-br from-indigo-50 to-blue-50/60",
  guide: "border-l-4 border-indigo-400 bg-slate-50/80 pl-4",
  tip: "border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/50",
  structure: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50/50",
  neutral: "border-slate-200 bg-slate-50/80",
};

export function WorksheetBadge({
  children,
  className = "bg-indigo-600",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-bold tracking-wide text-white uppercase ${className}`}
    >
      {children}
    </span>
  );
}

export function WorksheetCallout({
  variant = "neutral",
  title,
  children,
  className = "",
}: {
  variant?: WorksheetCalloutVariant;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const isGuide = variant === "guide";
  return (
    <div className={`ws-callout rounded-xl border p-4 ${CALLOUT_STYLES[variant]} ${className}`}>
      {title && (
        <h3 className={`mb-2 font-bold text-slate-900 ${isGuide ? "text-sm" : "text-sm"}`}>{title}</h3>
      )}
      <div className="text-sm leading-relaxed text-slate-700">{children}</div>
    </div>
  );
}

export function RoutinePanel({
  badge,
  badgeClass = "bg-indigo-600",
  icon,
  title,
  subtitle,
  children,
  accent = "border-slate-200",
}: {
  badge?: string;
  badgeClass?: string;
  icon?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  accent?: string;
}) {
  return (
    <div className={`ws-routine-panel flex h-full flex-col rounded-xl border bg-white p-4 shadow-sm ${accent}`}>
      <div className="mb-3 flex items-start gap-2.5">
        {icon && <span className="text-xl leading-none" aria-hidden>{icon}</span>}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {badge && <WorksheetBadge className={badgeClass}>{badge}</WorksheetBadge>}
            <h3 className="text-base font-bold text-slate-900">{title}</h3>
          </div>
          {subtitle && <p className="mt-1 text-sm leading-snug text-slate-600">{subtitle}</p>}
        </div>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

export function FieldBlock({
  badge,
  badgeClass = "bg-indigo-600",
  title,
  guide,
  children,
}: {
  badge?: string;
  badgeClass?: string;
  title: string;
  guide?: string;
  children: ReactNode;
}) {
  return (
    <div className="ws-field-block rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {badge && <WorksheetBadge className={badgeClass}>{badge}</WorksheetBadge>}
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
      </div>
      {guide && <p className="mb-3 text-sm leading-relaxed text-slate-600">{guide}</p>}
      {children}
    </div>
  );
}
