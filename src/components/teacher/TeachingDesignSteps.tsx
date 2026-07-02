"use client";

import Link from "next/link";
import {
  buildTeachingDesignHref,
  TEACHING_DESIGN_STEPS,
  type TeachingDesignContext,
  type TeachingDesignStep,
} from "@/lib/curriculum/design-flow";

export function TeachingDesignSteps({
  currentStep,
  ctx,
}: {
  currentStep: TeachingDesignStep;
  ctx: Partial<TeachingDesignContext>;
}) {
  return (
    <nav className="rounded-xl border border-slate-200 bg-slate-50/80 p-4" aria-label="수업 설계 단계">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">학습 주제 맞춤 수업 설계</p>
      <ol className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {TEACHING_DESIGN_STEPS.map(({ step, shortLabel, label }) => {
          const active = step === currentStep;
          return (
            <li key={step} className="flex items-center gap-2">
              <Link
                href={buildTeachingDesignHref(step, ctx)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-slate-900 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                }`}
                aria-current={active ? "step" : undefined}
              >
                {shortLabel}
                <span className="ml-1 hidden font-normal opacity-80 sm:inline">· {label}</span>
              </Link>
              {step < 3 && <span className="hidden text-slate-300 sm:inline" aria-hidden>→</span>}
            </li>
          );
        })}
      </ol>
      {(ctx.unitLabel || ctx.period || ctx.learningTopic) && (
        <p className="mt-3 text-sm text-slate-600">
          <strong>{ctx.unitLabel}</strong>
          {ctx.period ? ` · ${ctx.period}차시` : ""}
          {ctx.learningTopic ? ` · ${ctx.learningTopic}` : ""}
        </p>
      )}
    </nav>
  );
}
