"use client";

import type { TemplateProps } from "@/lib/types";
import { FieldBlock, WorksheetCallout } from "@/components/common/WorksheetUi";
import { fieldValue as v } from "@/components/templates/utils";
import { CSQ_SECTIONS } from "@/lib/templates/csq";
import { useLessonWorksheetContent } from "@/hooks/useDissolutionLessonForm";

const CSQ_BADGES: Record<string, { badge: string; badgeClass: string }> = {
  claim: { badge: "C", badgeClass: "bg-blue-600" },
  support: { badge: "S", badgeClass: "bg-emerald-600" },
  question: { badge: "Q", badgeClass: "bg-amber-600" },
};

export function ClaimSupportQuestionTemplate({ values, onChange, readOnly, period }: TemplateProps) {
  const { get } = useLessonWorksheetContent("claim-support-question", period);
  const memos = [get("memo1"), get("memo2")].filter(Boolean);

  return (
    <div className="csq-worksheet space-y-5">
      {memos.length > 0 && (
        <WorksheetCallout variant="reminder" title="나의 탐구 데이터 핵심 메모">
          <ul className="list-disc space-y-1 pl-4">
            {memos.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </WorksheetCallout>
      )}

      <div className="space-y-4">
        {CSQ_SECTIONS.map(({ key, guide, placeholder, rows, focusClass }) => {
          const badgeMeta = CSQ_BADGES[key] ?? { badge: key[0].toUpperCase(), badgeClass: "bg-indigo-600" };
          const guideText = get(`guide_${key}`) || guide;
          const placeholderText = get(`hint_${key}`) || placeholder;
          const displayTitle =
            key === "claim" ? "Claim (주장)" : key === "support" ? "Support (근거)" : "Question (질문)";
          return (
            <FieldBlock key={key} badge={badgeMeta.badge} badgeClass={badgeMeta.badgeClass} title={displayTitle} guide={guideText}>
              <textarea
                className={`ui-textarea ${focusClass}`}
                rows={rows}
                value={v(values, key)}
                disabled={readOnly}
                placeholder={placeholderText}
                onChange={(e) => onChange(key, e.target.value)}
              />
            </FieldBlock>
          );
        })}
      </div>
    </div>
  );
}
