"use client";

import type { TemplateProps } from "@/lib/types";
import { FieldBlock } from "@/components/common/WorksheetUi";
import { DissolutionLessonExtras } from "@/components/worksheet/DissolutionLessonExtras";
import { fieldValue as v } from "@/components/templates/utils";
import { HEADLINE_PLACEHOLDERS } from "@/lib/templates/headlines";
import { useDissolutionLessonForm, useLessonWorksheetContent } from "@/hooks/useDissolutionLessonForm";

export function HeadlineTemplate({ values, onChange, readOnly, period }: TemplateProps) {
  const lessonForm = useDissolutionLessonForm(period, "headline");
  const { get } = useLessonWorksheetContent("headline", period);

  return (
    <div className="headline-worksheet space-y-4">
      {lessonForm && (
        <DissolutionLessonExtras form={lessonForm} values={values} onChange={onChange} readOnly={readOnly} />
      )}

      <FieldBlock
        badge="Headline"
        badgeClass="bg-slate-800"
        title="헤드라인 (한 줄)"
        guide="탐구 내용의 핵심 본질과 가치를 한 줄로 관통하는 제목을 작성하세요."
      >
        <textarea
          className="ui-textarea min-h-[4rem] !text-base font-medium"
          rows={2}
          value={v(values, "headline")}
          disabled={readOnly}
          placeholder={get("hint_headline") || HEADLINE_PLACEHOLDERS.headline}
          onChange={(e) => onChange("headline", e.target.value)}
        />
      </FieldBlock>

      <FieldBlock
        badge="Why"
        badgeClass="bg-teal-700"
        title="이유 설명"
        guide="왜 그렇게 표제를 정했는지, 과학적 사실(실험·조사 데이터)과 인과 관계를 담아 서술하세요."
      >
        <textarea
          className="ui-textarea min-h-[12rem]"
          rows={8}
          value={v(values, "headlineReason")}
          disabled={readOnly}
          placeholder={get("hint_headlineReason") || HEADLINE_PLACEHOLDERS.reason}
          onChange={(e) => onChange("headlineReason", e.target.value)}
        />
      </FieldBlock>
    </div>
  );
}
