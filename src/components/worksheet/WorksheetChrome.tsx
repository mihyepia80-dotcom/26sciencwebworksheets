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
    <div className="ui-banner">
      본문 입력칸을 각각 <strong>{minFieldChars}자 이상 한글</strong>로 작성한 뒤 제출하세요.
      마무리 결론·셀프 체크·유도 질문 등은 글자수 제한 대상이 아닙니다.
      {studentMode && (
        <span className="mt-2 block text-slate-700">
          작성 중에는 <strong>임시 저장</strong>으로 이어서 쓸 수 있습니다. 예시 문장을 그대로 붙여 넣으면 제출할 수
          없습니다.
        </span>
      )}
      {aiQuota?.available === false ? (
        <span className="mt-2 block text-amber-800">
          {aiQuota.reason === "student"
            ? "오늘 AI 피드백은 학생 1인당 1회만 이용할 수 있습니다. 제출은 가능하지만 AI 피드백은 제공되지 않습니다."
            : `오늘 AI 무료 사용량(전체 ${aiQuota.globalLimit}회)을 모두 사용했습니다. 제출은 가능하지만 AI 피드백은 제공되지 않습니다.`}
        </span>
      ) : aiQuota ? (
        <span className="mt-2 block text-slate-600">
          AI 피드백: 오늘 내 남은 횟수 {aiQuota.studentRemaining}/{aiQuota.studentLimit}
          (전체 {aiQuota.globalRemaining}/{aiQuota.globalLimit})
        </span>
      ) : null}
    </div>
  );
}

interface WorksheetActionBarProps {
  submitted: boolean;
  submitting: boolean;
  savingDraft: boolean;
  hasSubmissionId: boolean;
  aiAvailable: boolean;
  persistEnabled?: boolean;
  onEdit: () => void;
  onDraftSave: () => void;
  onSubmit: () => void;
}

export function WorksheetPrintBar({ onBeforePrint }: { onBeforePrint?: () => void }) {
  return (
    <div className="mt-8 flex justify-end border-t border-slate-100 pt-6 print:hidden">
      <button
        type="button"
        className="ui-btn bg-slate-800 text-white hover:bg-slate-900"
        onClick={() => {
          onBeforePrint?.();
          window.print();
        }}
      >
        PDF 출력
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
  persistEnabled = true,
  onEdit,
  onDraftSave,
  onSubmit,
}: WorksheetActionBarProps) {
  const busy = submitting || savingDraft;

  return (
    <div className="flex flex-wrap items-center justify-end gap-3 pt-6">
      {submitted && persistEnabled && (
        <Link href="/my" className="ui-btn-secondary border-emerald-200 text-emerald-700 hover:bg-emerald-50">
          내 활동지 보기
        </Link>
      )}
      <button type="button" className="ui-btn-secondary" onClick={onEdit} disabled={busy || !submitted}>
        다시 수정
      </button>
      {!persistEnabled && !submitted && (
        <Link href="/login" className="ui-btn-primary min-w-[7rem]">
          로그인
        </Link>
      )}
      {persistEnabled && !submitted && (
        <button
          type="button"
          className="ui-btn border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100"
          onClick={onDraftSave}
          disabled={busy}
        >
          {savingDraft ? "저장 중..." : "임시 저장"}
        </button>
      )}
      {persistEnabled && (
        <button type="button" className="ui-btn-primary min-w-[7rem]" onClick={onSubmit} disabled={busy || submitted}>
          {submitting
            ? aiAvailable
              ? "AI 피드백 생성 중..."
              : "제출 중..."
            : hasSubmissionId
              ? "제출하기"
              : "제출하기"}
        </button>
      )}
    </div>
  );
}
