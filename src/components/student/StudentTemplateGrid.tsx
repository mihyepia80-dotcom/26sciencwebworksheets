"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStudentTemplateProgress } from "@/hooks/useStudentTemplateProgress";
import {
  CATEGORY_SHORT_LABELS,
} from "@/lib/templates/categories";
import { getCategoryGroups, getSortedTemplates } from "@/lib/templates/registry";
import {
  formatTemplateTitle,
  getGlobalSequenceNumber,
  getTemplateOrderInCategory,
} from "@/lib/templates/curriculum";
import { getProgressVisualFromProgress } from "@/lib/student-progress/rating-styles";
import type { TemplateDefinition } from "@/lib/types";

function categoryAnchorId(groupId: string) {
  return `worksheet-stage-${groupId}`;
}

function displayTemplateName(t: TemplateDefinition) {
  return t.nameEn?.trim() || formatTemplateTitle(t);
}

function displayTemplateSubtitle(t: TemplateDefinition) {
  if (t.nameEn?.trim()) return formatTemplateTitle(t);
  return null;
}

export function StudentTemplateGrid() {
  const router = useRouter();
  const templates = getSortedTemplates();
  const groups = getCategoryGroups();
  const { loading, getProgress, summary, isStudent } = useStudentTemplateProgress();

  return (
    <div className="home-worksheet-hub">
      {/* 상단 요약 + 단계 빠른 이동 */}
      <header className="home-worksheet-hub__header">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-wide text-violet-700 uppercase">
              사고기법 학습지
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              탐구 단계별 {templates.length}종
            </h2>
            <p className="mt-1 text-base text-slate-600">
              7단계 · 카테고리를 누르면 해당 구역으로 이동합니다.
            </p>
          </div>
          <Link href="/workspace" className="ui-btn-accent ui-btn-sm shrink-0">
            탐구 활동실
          </Link>
        </div>

        {isStudent && (
          <div className="mt-5 rounded-xl border border-slate-200/90 bg-white px-4 py-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium text-slate-800">
                {loading
                  ? "제출 기록 불러오는 중…"
                  : `완료 ${summary.completed} · 작성 중 ${summary.draft} · 미완료 ${templates.length - summary.completed - summary.draft}`}
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                <LegendDot className="bg-slate-300" label="미완료" />
                <LegendDot className="bg-sky-500" label="작성 중" />
                <LegendDot className="bg-emerald-500" label="완료" />
              </div>
            </div>
            {!loading && templates.length > 0 && (
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${(summary.completed / templates.length) * 100}%` }}
                />
              </div>
            )}
          </div>
        )}

        <nav
          className="home-worksheet-hub__nav mt-5"
          aria-label="탐구 단계 빠른 이동"
        >
          {groups.map((group, index) => (
            <a
              key={group.id}
              href={`#${categoryAnchorId(group.id)}`}
              className="home-worksheet-hub__nav-pill"
            >
              <span className="font-bold text-violet-700">{index + 1}</span>
              <span>{CATEGORY_SHORT_LABELS[group.id]}</span>
              <span className="text-slate-400">({group.templates.length})</span>
            </a>
          ))}
        </nav>
      </header>

      {/* 단계별 그리드 */}
      <div className="home-worksheet-hub__sections">
        {groups.map((group, groupIndex) => (
          <section
            key={group.id}
            id={categoryAnchorId(group.id)}
            className="home-worksheet-hub__section scroll-mt-28"
          >
            <div className="home-worksheet-hub__section-head">
              <span className="home-worksheet-hub__stage-badge">{groupIndex + 1}</span>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-slate-900 sm:text-xl">
                  {group.label.replace(/^[①-⑦]\s*/, "")}
                </h3>
                {group.subtitle && (
                  <p className="mt-0.5 text-sm text-slate-600">{group.subtitle}</p>
                )}
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {group.templates.length}종
              </span>
            </div>

            <ul className="home-worksheet-hub__grid">
              {group.templates.map((t) => {
                const progress = isStudent
                  ? getProgress(t.id)
                  : { status: "none" as const, aiRating: null };
                const style = getProgressVisualFromProgress(isStudent ? progress : undefined);
                const stageOrder = getTemplateOrderInCategory(t, group.id);
                const seqNo = getGlobalSequenceNumber(t);
                const subtitle = displayTemplateSubtitle(t);

                return (
                  <li key={`${group.id}-${t.id}`}>
                    <article
                      className={`home-worksheet-card group ${style.card}`}
                    >
                      <Link
                        href={`/workspace?template=${t.id}`}
                        className="home-worksheet-card__link"
                      >
                        <div className="home-worksheet-card__meta">
                          <span className="home-worksheet-card__no">{seqNo}</span>
                          <span className="home-worksheet-card__stage">
                            {groupIndex + 1}-{stageOrder}
                          </span>
                          {isStudent && (
                            <span className={`home-worksheet-card__status ${style.badge}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                              {style.label}
                            </span>
                          )}
                        </div>
                        <h4 className="home-worksheet-card__title">
                          {displayTemplateName(t)}
                        </h4>
                        {subtitle && (
                          <p className="home-worksheet-card__subtitle">{subtitle}</p>
                        )}
                        <p className="home-worksheet-card__desc">{t.description}</p>
                      </Link>
                      <button
                        type="button"
                        title="새 활동지 추가"
                        onClick={() => router.push(`/workspace?template=${t.id}&new=1`)}
                        className="home-worksheet-card__add"
                      >
                        +
                      </button>
                    </article>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${className}`} />
      {label}
    </span>
  );
}
