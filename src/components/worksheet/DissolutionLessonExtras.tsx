"use client";

import type { TemplateProps } from "@/lib/types";
import { SectionBox, TextAreaField } from "@/components/common/Fields";
import { FieldBlock } from "@/components/common/WorksheetUi";
import { fieldValue as v } from "@/components/templates/utils";
import type { DissolutionLessonFormConfig } from "@/lib/worksheet-content/dissolution-lesson-forms";

interface DissolutionLessonExtrasProps extends Pick<TemplateProps, "values" | "onChange" | "readOnly"> {
  form: DissolutionLessonFormConfig;
}

export function DissolutionLessonExtras({ form, values, onChange, readOnly }: DissolutionLessonExtrasProps) {
  return (
    <div className="dissolution-lesson-extras space-y-4">
      {form.experiment && (
        <FieldBlock
          title={form.experiment.title}
          guide={form.experiment.guide}
          badge={form.periodLabel}
          badgeClass="bg-slate-600"
        >
          <TextAreaField
            value={v(values, form.experiment.key)}
            onChange={(val) => onChange(form.experiment!.key, val)}
            placeholder={form.experiment.placeholder}
            rows={form.experiment.rows ?? 3}
            readOnly={readOnly}
          />
        </FieldBlock>
      )}

      {form.investigation && (
        <FieldBlock title={form.investigation.title} guide={form.investigation.guide} badge="조사" badgeClass="bg-indigo-600">
          <TextAreaField
            value={v(values, form.investigation.key)}
            onChange={(val) => onChange(form.investigation!.key, val)}
            placeholder={form.investigation.placeholder}
            rows={form.investigation.rows ?? 4}
            readOnly={readOnly}
          />
        </FieldBlock>
      )}

      {form.bridge321 && (
        <SectionBox
          title="3-2-1 Bridge"
          subtitle="수업 후 배운 것 3가지, 흥미로웠던 점 2가지, 아직 궁금한 점 1가지를 적고, 수업 전·후 생각을 연결해 보세요."
          badge="Bridge"
          color="amber"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="ui-label text-sky-800">배운 것 3</label>
              <TextAreaField
                value={v(values, form.bridge321.learnedKey)}
                onChange={(val) => onChange(form.bridge321!.learnedKey, val)}
                placeholder="1. / 2. / 3."
                rows={4}
                readOnly={readOnly}
              />
            </div>
            <div>
              <label className="ui-label text-rose-800">흥미로웠던 점 2</label>
              <TextAreaField
                value={v(values, form.bridge321.curiousKey)}
                onChange={(val) => onChange(form.bridge321!.curiousKey, val)}
                placeholder="1. / 2."
                rows={4}
                readOnly={readOnly}
              />
            </div>
            <div>
              <label className="ui-label text-amber-800">궁금한 점 1 · Bridge</label>
              <TextAreaField
                value={v(values, form.bridge321.bridgeKey)}
                onChange={(val) => onChange(form.bridge321!.bridgeKey, val)}
                placeholder="아직 궁금한 점과, 수업 전·후 생각이 어떻게 연결되는지 적어 보세요."
                rows={4}
                readOnly={readOnly}
              />
            </div>
          </div>
        </SectionBox>
      )}
    </div>
  );
}
