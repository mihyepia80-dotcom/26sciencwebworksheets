"use client";

import { useStudentTemplateProgress } from "@/hooks/useStudentTemplateProgress";
import { getSortedTemplates } from "@/lib/templates/registry";
import { getProgressVisualFromProgress } from "@/lib/student-progress/rating-styles";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatTemplateTitle, getGlobalSequenceNumber, getTemplateOrderInCategory } from "@/lib/templates/curriculum";
import { getCategoryGroups } from "@/lib/templates/registry";

export function StudentTemplateGrid() {
  const router = useRouter();
  const templates = getSortedTemplates();
  const groups = getCategoryGroups();
  const { loading, getProgress, summary, isStudent } = useStudentTemplateProgress();

  return (
    <>
      {isStudent && (
        <section className="ui-card mb-10 p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="ui-section-title">학습지 현황</h2>
              <p className="ui-section-desc">
                {loading
                  ? "제출 기록을 불러오는 중…"
                  : `완료 ${summary.completed} · 작성 중 ${summary.draft} · 미완료 ${templates.length - summary.completed - summary.draft}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-600">
              <LegendDot className="bg-slate-300" label="미완료" />
              <LegendDot className="bg-sky-500" label="작성 중" />
              <LegendDot className="bg-emerald-500" label="잘함" />
              <LegendDot className="bg-amber-400" label="보통" />
              <LegendDot className="bg-red-400" label="노력요함" />
            </div>
          </div>
          {!loading && templates.length > 0 && (
            <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${(summary.completed / templates.length) * 100}%` }}
              />
            </div>
          )}
        </section>
      )}

      {groups.map((group) => (
        <section key={group.id} className="mb-12">
          <div className="mb-5">
            <h2 className="ui-section-title">
              {group.label}
              <span className="ml-2 text-base font-normal text-slate-400">({group.templates.length})</span>
            </h2>
            {group.subtitle && <p className="ui-section-desc">{group.subtitle}</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.templates.map((t) => {
              const progress = isStudent ? getProgress(t.id) : { status: "none" as const, aiRating: null };
              const style = getProgressVisualFromProgress(isStudent ? progress : undefined);
              const stageOrder = getTemplateOrderInCategory(t, group.id);
              const seqNo = getGlobalSequenceNumber(t);
              return (
                <div
                  key={`${group.id}-${t.id}`}
                  className={`group relative flex flex-col rounded-2xl border p-5 transition hover:shadow-md ${style.card}`}
                >
                  <Link href={`/workspace?template=${t.id}`} className="flex flex-1 flex-col pr-12">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="ui-chip bg-white/90 text-slate-600">{seqNo}</span>
                      <span className="ui-chip bg-white/90 text-blue-700">단계 {stageOrder}</span>
                      {isStudent && (
                        <span className={`ui-chip ${style.badge}`}>
                          <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${style.dot}`} />
                          {style.label}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold leading-snug text-slate-800 group-hover:text-slate-900">
                      {formatTemplateTitle(t)}
                    </h3>
                    <p className="mt-2 text-base leading-relaxed text-slate-600">{t.description}</p>
                    {t.aiFeatureLabel && (
                      <p className="mt-3 text-sm font-medium text-violet-700">{t.aiFeatureLabel}</p>
                    )}
                  </Link>
                  <button
                    type="button"
                    title="같은 유형 활동지 추가"
                    onClick={() => router.push(`/workspace?template=${t.id}&new=1`)}
                    className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full border border-blue-200 bg-white text-xl font-bold text-blue-600 shadow-sm hover:bg-blue-50"
                  >
                    +
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${className}`} />
      {label}
    </span>
  );
}
