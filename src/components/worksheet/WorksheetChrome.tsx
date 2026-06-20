"use client";

import Link from "next/link";
import type { AiQuotaStatus } from "@/lib/ai/feedback";
import { getMinFieldChars } from "@/lib/worksheet-validation";

interface WorksheetGuidanceBannerProps {
  templateId: string;
  aiQuota: AiQuotaStatus | null;
  studentMode?: boolean;
}

export function WorksheetGuidanceBanner({ templateId, aiQuota, studentMode }: WorksheetGuidanceBannerProps) {
  const minFieldChars = getMinFieldChars(templateId);
  return (
    <p className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-xs text-blue-800">
      각 항목을 <strong>{minFieldChars}자 이상 한글</strong>로 작성한 뒤 제출하세요.
      {studentMode && (
        <span className="mt-1 block">
          작성 중에는 <strong>임시 저장</strong>으로 이어서 쓸 수 있습니다. 예시 문장을 그대로 붙여 넣으면 제출할 수
          없습니다.
        </span>
      )}
      {aiQuota?.available === false ? (
        <span className="mt-1 block text-amber-700">
          {aiQuota.reason === "student"
            ? "오늘 AI 피드백은 학생 1인당 1회만 이용할 수 있습니다. 제출은 가능하지만 AI 피드백은 제공되지 않습니다."
            : `오늘 AI 무료 사용량(전체 ${aiQuota.globalLimit}회)을 모두 사용했습니다. 제출은 가능하지만 AI 피드백은 제공되지 않습니다.`}
        </span>
      ) : aiQuota ? (
        <span className="mt-1 block text-slate-600">
          AI 피드백: 오늘 내 남은 횟수 {aiQuota.studentRemaining}/{aiQuota.studentLimit}
          (전체 {aiQuota.globalRemaining}/{aiQuota.globalLimit})
        </span>
      ) : null}
    </p>
  );
}

interface WorksheetActionBarProps {
  submitted: boolean;
  submitting: boolean;
  savingDraft: boolean;
  hasSubmissionId: boolean;
  aiAvailable: boolean;
  onEdit: () => void;
  onDraftSave: () => void;
  onSubmit: () => void;
}

export function WorksheetPrintBar({ onBeforePrint }: { onBeforePrint?: () => void }) {
  return (
    <div className="mt-6 flex justify-end border-t border-slate-200 pt-4 print:hidden">
      <button
        type="button"
        className="rounded-lg bg-slate-800 px-5 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-900"
        onClick={() => {
          onBeforePrint?.();
          window.print();
        }}
      >
        최종 결과 저장 및 PDF 출력
      </button>
    </div>
  );
}

export function WorksheetActionBar({
  submitted,
  submitting,
  savingDraft,
  hasSubmissionId,
  aiAvailable,
  onEdit,
  onDraftSave,
  onSubmit,
}: WorksheetActionBarProps) {
  const busy = submitting || savingDraft;

  return (
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
        onClick={onEdit}
        disabled={busy || !submitted}
      >
        다시 수정
      </button>
      {!submitted && (
        <button
          type="button"
          className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-60"
          onClick={onDraftSave}
          disabled={busy}
        >
          {savingDraft ? "저장 중..." : "임시 저장"}
        </button>
      )}
      <button
        type="button"
        className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        onClick={onSubmit}
        disabled={busy || submitted}
      >
        {submitting
          ? aiAvailable
            ? "AI 피드백 생성 중..."
            : "제출 중..."
          : hasSubmissionId
            ? "제출하기"
            : "제출하기"}
      </button>
    </div>
  );
}
