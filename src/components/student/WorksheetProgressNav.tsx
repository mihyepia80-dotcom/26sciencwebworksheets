"use client";

import Link from "next/link";
import { getCategoryGroups } from "@/lib/templates/registry";
import { formatTemplateTitle, getGlobalSequenceNumber } from "@/lib/templates/curriculum";
import { getProgressVisualFromProgress } from "@/lib/student-progress/rating-styles";
import type { TemplateProgress } from "@/lib/student-progress/types";

interface WorksheetProgressNavProps {
  currentTemplateId: string;
  getProgress: (templateId: string) => TemplateProgress;
  loading?: boolean;
  variant?: "sidebar" | "tabs";
}

export function WorksheetProgressNav({
  currentTemplateId,
  getProgress,
  loading,
  variant = "sidebar",
}: WorksheetProgressNavProps) {
  const groups = getCategoryGroups();

  if (variant === "tabs") {
    return (
      <nav className="print:hidden" aria-label="학습지 진행 현황">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
          <LegendDot className="bg-slate-300" label="미완료" />
          <LegendDot className="bg-sky-500" label="작성 중" />
          <LegendDot className="bg-emerald-500" label="잘함" />
          <LegendDot className="bg-amber-400" label="보통" />
          <LegendDot className="bg-red-500" label="노력요함" />
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto pb-2">
          {groups.flatMap((g) =>
            g.templates.map((t) => {
              const progress = getProgress(t.id);
              const style = getProgressVisualFromProgress(progress);
              const active = t.id === currentTemplateId;
              return (
                <Link
                  key={t.id}
                  href={`/templates/${t.id}`}
                  title={`${formatTemplateTitle(t)} — ${style.label}`}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                    active ? style.navActive : style.navIdle
                  }`}
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
                  <span className="max-w-[7rem] truncate">{getGlobalSequenceNumber(t)}</span>
                </Link>
              );
            }),
          )}
        </div>
        {loading && <p className="text-[10px] text-slate-400">현황 불러오는 중…</p>}
      </nav>
    );
  }

  return (
    <nav
      className="print:hidden lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto"
      aria-label="학습지 진행 현황"
    >
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <h2 className="mb-2 text-xs font-bold text-slate-800">학습지 현황</h2>
        <div className="mb-3 space-y-1 text-[10px] text-slate-500">
          <LegendDot className="bg-slate-300" label="미완료" />
          <LegendDot className="bg-sky-500" label="작성 중" />
          <LegendDot className="bg-emerald-500" label="잘함" />
          <LegendDot className="bg-amber-400" label="보통" />
          <LegendDot className="bg-red-500" label="노력요함" />
        </div>
        {loading && <p className="mb-2 text-[10px] text-slate-400">불러오는 중…</p>}
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.id}>
              <p className="mb-1.5 text-[10px] font-semibold text-slate-500">{group.label}</p>
              <ul className="space-y-0.5">
                {group.templates.map((t) => {
                  const progress = getProgress(t.id);
                  const style = getProgressVisualFromProgress(progress);
                  const active = t.id === currentTemplateId;
                  return (
                    <li key={t.id}>
                      <Link
                        href={`/templates/${t.id}`}
                        className={`flex items-start gap-2 rounded-lg border px-2 py-1.5 text-[11px] leading-snug transition ${
                          active ? style.navActive : `${style.navIdle} border-transparent`
                        }`}
                      >
                        <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
                        <span className="min-w-0 flex-1">
                          <span className="font-semibold">{getGlobalSequenceNumber(t)}.</span>{" "}
                          <span className={active ? "font-medium" : ""}>{t.name}</span>
                          <span className="mt-0.5 block text-[10px] opacity-75">{style.label}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`inline-block h-2 w-2 rounded-full ${className}`} />
      {label}
    </span>
  );
}
