"use client";

import { INQUIRY_SECTIONS, type InquiryReportForm } from "@/lib/inquiry-report/types";

interface SharedInquiryReportViewProps {
  form: InquiryReportForm;
  title: string;
}

export function SharedInquiryReportView({ form, title }: SharedInquiryReportViewProps) {
  return (
    <main id="inquiry-report-print" className="inquiry-report-print mx-auto max-w-3xl px-4 py-8">
      <header className="mb-8 border-b border-slate-200 pb-6 text-center">
        <p className="text-xs text-slate-500">탐구보고서 미리보기</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {form.unitName} · {form.lessonName} · ({form.groupNo}) 모둠 · 기록자 {form.recorder}
        </p>
      </header>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <p className="font-medium text-slate-700">모둠원</p>
        <p className="mt-1 text-slate-600">{form.members.filter(Boolean).join(", ") || "—"}</p>
      </div>

      <div className="space-y-5">
        {INQUIRY_SECTIONS.map((section) => (
          <article
            key={section.id}
            className="rounded-xl border border-slate-200 bg-white p-5 print:break-inside-avoid"
          >
            <h2 className="mb-3 text-base font-bold text-slate-800">
              {section.num}. {section.label}
            </h2>
            {section.id === "visual" ? (
              <div>
                {form.visualDrawing ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.visualDrawing}
                    alt="탐구 그림"
                    className="max-h-80 w-full rounded-lg border border-slate-200 object-contain"
                  />
                ) : (
                  <p className="text-sm text-slate-400">그림 없음</p>
                )}
                {form.visualDescription.trim() && (
                  <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{form.visualDescription}</p>
                )}
              </div>
            ) : section.id === "process" ? (
              <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-slate-700">
                {[form.processStep1, form.processStep2, form.processStep3, form.processStep4, form.processStep5]
                  .filter((s) => s.trim())
                  .map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
              </ul>
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                {String(form[section.field as keyof InquiryReportForm] ?? "") || "—"}
              </p>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
