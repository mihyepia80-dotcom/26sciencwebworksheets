"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { listStudentSubmissions } from "@/lib/firebase";
import { getCategoryGroups, getSortedTemplates } from "@/lib/templates/registry";
import { formatTemplateTitle, getGlobalSequenceNumber, getTemplateOrderInCategory } from "@/lib/templates/curriculum";

export function StudentTemplateGrid() {
  const { user, role } = useAuth();
  const isStudent = role === "student";
  const templates = getSortedTemplates();
  const groups = getCategoryGroups();
  const [usedTemplateIds, setUsedTemplateIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !isStudent) return;
    let cancelled = false;
    setLoading(true);
    listStudentSubmissions(user.uid)
      .then((list) => {
        if (cancelled) return;
        setUsedTemplateIds(new Set(list.map((s) => s.templateId)));
      })
      .catch(() => {
        if (!cancelled) setUsedTemplateIds(new Set());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, isStudent]);

  const usageSummary = useMemo(() => {
    const used = templates.filter((t) => usedTemplateIds.has(t.id)).length;
    return { used, total: templates.length };
  }, [templates, usedTemplateIds]);

  return (
    <>
      {isStudent && (
        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-800">사고도구 학습지 현황</h2>
              <p className="mt-1 text-sm text-slate-500">
                {loading
                  ? "제출 기록을 불러오는 중…"
                  : `${usageSummary.used}개 사용 · ${usageSummary.total - usageSummary.used}개 미사용`}
              </p>
            </div>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                사용함
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-300" />
                미사용
              </span>
            </div>
          </div>
          {!loading && usageSummary.total > 0 && (
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${(usageSummary.used / usageSummary.total) * 100}%` }}
              />
            </div>
          )}
        </section>
      )}

      {groups.map((group) => (
        <section key={group.id} className="mb-10">
          <h2 className="text-lg font-bold text-slate-800">
            {group.label}
            <span className="ml-2 text-sm font-normal text-slate-400">({group.templates.length})</span>
          </h2>
          {group.subtitle && <p className="mb-4 text-sm text-slate-500">{group.subtitle}</p>}
          {!group.subtitle && <div className="mb-4" />}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.templates.map((t) => {
              const used = isStudent && usedTemplateIds.has(t.id);
              const stageOrder = getTemplateOrderInCategory(t, group.id);
              const seqNo = getGlobalSequenceNumber(t);
              return (
                <Link
                  key={`${group.id}-${t.id}`}
                  href={`/templates/${t.id}`}
                  className={`group relative flex flex-col rounded-xl border p-4 shadow-sm transition hover:shadow-md ${
                    used
                      ? "border-emerald-200 bg-emerald-50/40 hover:border-emerald-300"
                      : "border-slate-200 bg-white hover:border-blue-300"
                  }`}
                >
                  <div className="mb-2 flex flex-wrap items-center gap-1.5 pr-14">
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                      {seqNo}
                    </span>
                    <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                      단계 {stageOrder}
                    </span>
                    {t.perLesson && (
                      <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
                        차시 반영
                      </span>
                    )}
                  </div>
                  {isStudent && (
                    <span
                      className={`absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        used ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {used ? "사용함" : "미사용"}
                    </span>
                  )}
                  <h3
                    className={`font-semibold leading-snug ${used ? "text-emerald-900 group-hover:text-emerald-800" : "text-slate-800 group-hover:text-blue-700"}`}
                  >
                    {formatTemplateTitle(t)}
                  </h3>
                  {t.thinkingTraits && t.thinkingTraits.length > 0 && (
                    <p className="mt-1.5 text-[10px] text-slate-500">
                      {t.thinkingTraits.join(" · ")}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-slate-500">{t.description}</p>
                  {t.aiFeatureLabel && (
                    <p className="mt-2 text-xs font-medium text-violet-700">[{t.aiFeatureLabel}]</p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
