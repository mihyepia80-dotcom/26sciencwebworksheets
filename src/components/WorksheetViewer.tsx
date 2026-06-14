"use client";

import { useState } from "react";
import Link from "next/link";
import { WorksheetHeader } from "@/components/common/WorksheetHeader";
import { TemplateRenderer } from "@/components/templates";
import { useAuth } from "@/components/AuthProvider";
import { isFirebaseConfigured, saveSubmission } from "@/lib/firebase";
import { getTemplateById } from "@/lib/templates/registry";
import { DEFAULT_META, type WorksheetMeta } from "@/lib/types";
import { useWorksheetState } from "@/lib/useWorksheetState";

interface WorksheetViewerProps {
  templateId: string;
}

export function WorksheetViewer({ templateId }: WorksheetViewerProps) {
  const { user, role, studentProfile } = useAuth();
  const template = getTemplateById(templateId);
  const [meta, setMeta] = useState<WorksheetMeta>(() => ({
    ...DEFAULT_META,
    grade: studentProfile?.grade ?? "",
    classNo: studentProfile?.classNo ?? "",
    studentNo: studentProfile?.studentNo ?? "",
    studentName: studentProfile?.studentName ?? "",
  }));
  const { values, onChange } = useWorksheetState();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  if (!template) return null;

  const onMetaChange = (key: keyof WorksheetMeta, value: string) => {
    setMeta((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!isFirebaseConfigured()) {
      setSubmitError("Firebase 설정이 없습니다. .env 파일을 확인하세요.");
      return;
    }

    if (!user || role !== "student") {
      setSubmitError("학생 로그인 후 제출할 수 있습니다.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      await saveSubmission({
        templateId,
        templateName: template.name,
        meta,
        values,
        studentUid: user.uid,
      });
      setSubmitted(true);
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : "제출에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = () => {
    setSubmitted(false);
    setSubmitError("");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← 템플릿 목록
        </Link>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
          #{template.order}
        </span>
      </div>

      <WorksheetHeader
        toolName={template.name}
        meta={meta}
        onMetaChange={onMetaChange}
        extraFields={template.headerFields}
        readOnly={submitted}
      />

      <TemplateRenderer templateId={templateId} values={values} onChange={onChange} readOnly={submitted} />

      <div className="flex flex-wrap justify-end gap-3 pt-4">
        {submitted && (
          <Link
            href="/my"
            className="rounded-lg border border-green-300 px-4 py-2 text-sm text-green-700 hover:bg-green-50"
          >
            내 활동지 보기
          </Link>
        )}
        <button
          type="button"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          onClick={handleEdit}
          disabled={submitting}
        >
          다시 수정
        </button>
        <button
          type="button"
          className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          onClick={handleSubmit}
          disabled={submitting || submitted}
        >
          {submitting ? "저장 중..." : "저장하기"}
        </button>
      </div>

      {submitError && <p className="text-center text-sm text-red-600">{submitError}</p>}

      {submitted && (
        <p className="text-center text-sm text-green-600">저장 완료! 내 활동지에서 다시 볼 수 있습니다.</p>
      )}
    </div>
  );
}
