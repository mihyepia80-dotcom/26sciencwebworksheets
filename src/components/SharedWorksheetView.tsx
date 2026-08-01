"use client";

import { AiFeedbackCard } from "@/components/AiFeedbackCard";
import { WorksheetHeader } from "@/components/common/WorksheetHeader";
import { TemplateRenderer } from "@/components/templates";
import { WorksheetPrintBar } from "@/components/worksheet/WorksheetChrome";
import { getTemplateById } from "@/lib/templates/registry";
import type { ShareRecord } from "@/lib/firebase/shares";

export function SharedWorksheetView({ share }: { share: ShareRecord }) {
  const template = getTemplateById(share.templateId);

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 print:max-w-none print:p-0">
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-800 print:hidden">
        보기 전용 공유 페이지입니다. 수정할 수 없습니다.
      </div>

      <h1 className="text-xl font-bold text-slate-900 print:hidden">{share.templateName}</h1>

      {template && (
        <div id="worksheet-print" className="worksheet-print-area space-y-4">
          <WorksheetHeader
            toolName={template.name}
            meta={share.meta}
            onMetaChange={() => {}}
            readOnly
          />
          <TemplateRenderer
            templateId={share.templateId}
            period={share.meta.period}
            values={share.values}
            onChange={() => {}}
            readOnly
          />
          <WorksheetPrintBar />
        </div>
      )}

      {share.aiRating && share.aiFeedback && (
        <div className="print:hidden">
          <AiFeedbackCard rating={share.aiRating} feedback={share.aiFeedback} />
        </div>
      )}
    </div>
  );
}
