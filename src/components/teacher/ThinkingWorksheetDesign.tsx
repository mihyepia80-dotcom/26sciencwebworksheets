"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { TeachingDesignSteps } from "@/components/teacher/TeachingDesignSteps";
import {
  applyDesignPreset,
  buildTeachingDesignHref,
  getDesignPresetsForUnit,
  getLessonUnit,
  LESSON_UNITS,
  parseTeachingDesignContext,
} from "@/lib/curriculum/design-flow";
import { getPeriodPreset } from "@/lib/lesson-plan/unit-curriculum";
import { getTemplateById } from "@/lib/templates/registry";

const INPUT = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";
const SELECT = `${INPUT} bg-white`;

export function ThinkingWorksheetDesign() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role } = useAuth();

  const initial = useMemo(() => parseTeachingDesignContext(searchParams), [searchParams]);
  const [unitId, setUnitId] = useState(initial.unitId);
  const [customUnitLabel, setCustomUnitLabel] = useState(
    initial.unitId === "custom" ? initial.unitLabel : "",
  );
  const [period, setPeriod] = useState(initial.period);
  const [learningTopic, setLearningTopic] = useState(initial.learningTopic);

  const selectedUnit = getLessonUnit(unitId);
  const ctx = applyDesignPreset(unitId, period, customUnitLabel || undefined);
  const displayCtx = { ...ctx, learningTopic: learningTopic || ctx.learningTopic };
  const template = ctx.templateId ? getTemplateById(ctx.templateId) : undefined;
  const periodPresets = getDesignPresetsForUnit(unitId);

  const syncUrl = useCallback(
    (nextPeriod: string, nextTopic?: string) => {
      const next = applyDesignPreset(unitId, nextPeriod, customUnitLabel || undefined);
      const topic = nextTopic ?? next.learningTopic;
      router.replace(
        buildTeachingDesignHref(1, { ...next, learningTopic: topic }),
        { scroll: false },
      );
    },
    [unitId, customUnitLabel, router],
  );

  const handleUnitChange = (nextUnitId: string) => {
    setUnitId(nextUnitId);
    const unit = getLessonUnit(nextUnitId);
    const firstPeriod = unit.periodPresets[0]?.period ?? period;
    setPeriod(firstPeriod);
    if (unit.periodPresets[0]) {
      setLearningTopic(unit.periodPresets[0].learningTopic);
    }
    const next = applyDesignPreset(nextUnitId, firstPeriod, customUnitLabel || undefined);
    router.replace(buildTeachingDesignHref(1, next), { scroll: false });
  };

  const handlePeriodSelect = (nextPeriod: string) => {
    setPeriod(nextPeriod);
    const next = applyDesignPreset(unitId, nextPeriod, customUnitLabel || undefined);
    setLearningTopic(next.learningTopic);
    syncUrl(nextPeriod, next.learningTopic);
  };

  if (role !== "teacher") {
    return (
      <p className="text-sm text-slate-600">
        교사 로그인이 필요합니다.{" "}
        <Link href="/teacher" className="text-blue-600 hover:underline">
          교사 대시보드
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <TeachingDesignSteps currentStep={1} ctx={displayCtx} />

      <section className="rounded-xl border border-violet-200 bg-violet-50/50 p-5">
        <h2 className="text-base font-bold text-violet-950">① 사고 활동지 — 단원·차시·주제 선택</h2>
        <p className="mt-1 text-sm text-violet-900/90">
          이 차시에 사용할 <strong>사고 활동지(사고도구)</strong>와 학습 주제를 정합니다. 선택 내용은 ② 지도안·③
          학습지 텍스트 편집에 그대로 이어집니다.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-violet-900">단원</span>
            <select className={SELECT} value={unitId} onChange={(e) => handleUnitChange(e.target.value)}>
              {LESSON_UNITS.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </label>
          {selectedUnit.customLabel && (
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-semibold text-violet-900">단원명 (직접 입력)</span>
              <input
                className={INPUT}
                value={customUnitLabel}
                onChange={(e) => setCustomUnitLabel(e.target.value)}
                placeholder="예: 5. 생물과 환경"
              />
            </label>
          )}
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-violet-900">차시</span>
            <input
              className={INPUT}
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value);
                syncUrl(e.target.value, learningTopic);
              }}
              placeholder="1/8"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-xs font-semibold text-violet-900">학습 주제</span>
            <input
              className={INPUT}
              value={learningTopic}
              onChange={(e) => {
                setLearningTopic(e.target.value);
                syncUrl(period, e.target.value);
              }}
              placeholder="이번 차시 학습 주제"
            />
          </label>
        </div>

        {periodPresets.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-violet-900">차시별 프리셋 (주제·사고 활동지 연동)</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {periodPresets.map((p) => (
                <button
                  key={p.period}
                  type="button"
                  onClick={() => handlePeriodSelect(p.period)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                    period === p.period
                      ? "bg-violet-700 text-white"
                      : "border border-violet-300 bg-white text-violet-900 hover:bg-violet-50"
                  }`}
                >
              {p.lessonLabel ?? p.period}
                  {p.thinkingTool ? ` · ${p.thinkingTool.split("(")[0].trim()}` : ""}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800">선택된 사고 활동지</h3>
        {ctx.templateId ? (
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            <p>
              <span className="font-semibold text-slate-500">사고도구 활동지:</span>{" "}
              {ctx.templateLabel || template?.name}
            </p>
            {ctx.inquiryQuestion && (
              <p>
                <span className="font-semibold text-slate-500">핵심 질문:</span> {ctx.inquiryQuestion}
              </p>
            )}
            {getPeriodPreset(unitId, period)?.structureUnderstanding && (
              <p className="text-xs leading-relaxed text-slate-600">
                <span className="font-semibold text-slate-500">구조 이해:</span>{" "}
                {getPeriodPreset(unitId, period)?.structureUnderstanding}
              </p>
            )}
            {getPeriodPreset(unitId, period)?.templatePrompt && (
              <p className="text-xs leading-relaxed text-slate-600">
                <span className="font-semibold text-slate-500">템플릿 프롬프트:</span>{" "}
                {getPeriodPreset(unitId, period)?.templatePrompt}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {getPeriodPreset(unitId, period)?.htmlPath && (
                <Link
                  href={getPeriodPreset(unitId, period)!.htmlPath!}
                  className="rounded-lg border border-violet-300 bg-violet-50 px-4 py-2 text-sm text-violet-900 hover:bg-violet-100"
                  target="_blank"
                >
                  Standalone HTML 학습지
                </Link>
              )}
              <Link
                href={`/templates/${ctx.templateId}?period=${encodeURIComponent(period)}`}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
                target="_blank"
              >
                활동지 미리보기
              </Link>
              <Link
                href={`/workspace?template=${ctx.templateId}&period=${encodeURIComponent(period)}`}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
                target="_blank"
              >
                탐구 활동실에서 체험
              </Link>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">
            이 단원·차시에는 등록된 사고 활동지 프리셋이 없습니다. ②에서 지도안을 작성한 뒤 ③에서 학습지를
            직접 선택하세요.
          </p>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href={buildTeachingDesignHref(2, displayCtx)}
          className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-800"
        >
          ② 수업지도안 설계로 →
        </Link>
        {ctx.templateId && (
          <Link
            href={buildTeachingDesignHref(3, displayCtx)}
            className="rounded-lg border border-indigo-300 bg-indigo-50 px-5 py-2.5 text-sm font-medium text-indigo-900 hover:bg-indigo-100"
          >
            ③ 학습지 텍스트 편집으로 →
          </Link>
        )}
      </div>
    </div>
  );
}
