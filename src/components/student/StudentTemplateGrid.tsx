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
        <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-800">사고도구 학습지 현황</h2>
              <p className="mt-1 text-sm text-slate-500">
                {loading
                  ? "제출 기록을 불러오는 중…"
                  : `완료 ${summary.completed} · 작성 중 ${summary.draft} · 미완료 ${templates.length - summary.completed - summary.draft}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                미완료
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                작성 중
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                잘함
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                보통
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                노력요함
              </span>
            </div>
          </div>
          {!loading && templates.length > 0 && (
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${(summary.completed / templates.length) * 100}%` }}
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
              const progress = isStudent ? getProgress(t.id) : { status: "none" as const, aiRating: null };
              const style = getProgressVisualFromProgress(isStudent ? progress : undefined);
              const stageOrder = getTemplateOrderInCategory(t, group.id);
              const seqNo = getGlobalSequenceNumber(t);
              return (
                <div
                  key={`${group.id}-${t.id}`}
                  className={`group relative flex flex-col rounded-xl border p-4 shadow-sm transition hover:shadow-md ${style.card}`}
                >
                  <Link href={`/workspace?template=${t.id}`} className="flex flex-1 flex-col">
                  <div className="mb-2 flex flex-wrap items-center gap-1.5 pr-16">
                    <span className="rounded bg-white/80 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                      {seqNo}
                    </span>
                    <span className="rounded bg-white/80 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
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
                      className={`absolute right-3 top-3 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${style.badge}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                      {style.label}
                    </span>
                  )}
                  <h3 className="font-semibold leading-snug text-slate-800 group-hover:text-slate-900">
                    {formatTemplateTitle(t)}
                  </h3>
                  {t.thinkingTraits && t.thinkingTraits.length > 0 && (
                    <p className="mt-1.5 text-[10px] text-slate-500">{t.thinkingTraits.join(" · ")}</p>
                  )}
                  <p className="mt-1 text-sm text-slate-500">{t.description}</p>
                  {t.aiFeatureLabel && (
                    <p className="mt-2 text-xs font-medium text-violet-700">[{t.aiFeatureLabel}]</p>
                  )}
                  </Link>
                  <button
                    type="button"
                    title="같은 유형 활동지 추가"
                    onClick={() => router.push(`/workspace?template=${t.id}&new=1`)}
                    className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full border border-blue-200 bg-white text-lg font-bold text-blue-600 shadow-sm hover:bg-blue-50"
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
