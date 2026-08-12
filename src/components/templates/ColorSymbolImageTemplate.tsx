"use client";

import type { TemplateProps } from "@/lib/types";
import { FieldBlock } from "@/components/common/WorksheetUi";
import { MemoTextArea } from "@/components/common/Fields";
import { fieldValue as v } from "@/components/templates/utils";
import { CSI_SECTIONS } from "@/lib/templates/csi";
import { useLessonWorksheetContent } from "@/hooks/useDissolutionLessonForm";

export function ColorSymbolImageTemplate({ values, onChange, readOnly, period }: TemplateProps) {
  const { get } = useLessonWorksheetContent("color-symbol-image", period);

  return (
    <div className="csi-worksheet space-y-4">
      {CSI_SECTIONS.map(
        ({
          badge,
          badgeClass,
          title,
          focusClass,
          textKey,
          reasonKey,
          question,
          textPlaceholder,
          reasonPlaceholder,
          showColorPicker,
          imageOnly,
        }) => {
          const hint = get(`hint_${reasonKey}`) || get(`hint_${textKey}`);
          const guide = hint || question;
          return (
            <FieldBlock key={badge} badge={badge} badgeClass={badgeClass} title={title} guide={guide}>
              {imageOnly ? (
                <MemoTextArea
                  className={focusClass}
                  rows={5}
                  value={v(values, reasonKey)}
                  readOnly={readOnly}
                  placeholder={reasonPlaceholder}
                  onChange={(val) => onChange(reasonKey, val)}
                />
              ) : (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="flex shrink-0 items-start gap-2 sm:w-1/3">
                    {showColorPicker && (
                      <input
                        type="color"
                        className="h-10 w-10 cursor-pointer rounded-lg border border-slate-200 bg-white shadow-sm disabled:opacity-60"
                        value={v(values, "colorPicker") || "#22c55e"}
                        disabled={readOnly}
                        title="색상 선택"
                        onChange={(e) => onChange("colorPicker", e.target.value)}
                      />
                    )}
                    <input
                      type="text"
                      className={`ui-input-compact no-memo ${focusClass}`}
                      value={v(values, textKey)}
                      disabled={readOnly}
                      placeholder={textPlaceholder}
                      onChange={(e) => onChange(textKey, e.target.value)}
                    />
                  </div>
                  <MemoTextArea
                    className={`flex-1 ${focusClass}`}
                    rows={5}
                    value={v(values, reasonKey)}
                    readOnly={readOnly}
                    placeholder={reasonPlaceholder}
                    onChange={(val) => onChange(reasonKey, val)}
                  />
                </div>
              )}
            </FieldBlock>
          );
        },
      )}
    </div>
  );
}
