import type { WorksheetMeta } from "@/lib/types";
import type { WorksheetSubmissionStatus } from "@/lib/firebase/submissions";
import type { PadletBoardDoc, PadletPostDoc, PublishResultStatus } from "@/lib/padlet/publish-types";
import { parsePeriodFromMeta } from "@/lib/padlet/post-composer";

export type PublishSubmissionRef = {
  status: WorksheetSubmissionStatus;
  meta: WorksheetMeta;
};

export function isPadletPublishEnabled(): boolean {  return process.env.PADLET_PUBLISH_ENABLED !== "false";
}

export function resolveStudentNo(
  submission: PublishSubmissionRef,
  profileStudentNo?: number,
): number | null {  const fromMeta = Number(submission.meta.studentNo);
  if (Number.isFinite(fromMeta) && fromMeta > 0) return fromMeta;
  if (profileStudentNo && profileStudentNo > 0) return profileStudentNo;
  return null;
}

export function resolvePeriod(submission: PublishSubmissionRef, defaultPeriod?: number): number {  return parsePeriodFromMeta(submission.meta.period, defaultPeriod ?? 1);
}

export interface PublishGuardInput {
  submission: PublishSubmissionRef;  board: PadletBoardDoc | null;
  existingPost: PadletPostDoc | null;
  studentNo: number;
  period: number;
  bodyHash: string;
  isTeacherProxy: boolean;
  mode: "publish" | "republish";
}

export function evaluatePublishGuard(input: PublishGuardInput): {
  allowed: boolean;
  status?: PublishResultStatus;
  message?: string;
} {
  if (!isPadletPublishEnabled()) {
    return { allowed: false, status: "error", message: "패들렛 게시 기능이 꺼져 있습니다." };
  }

  if (input.submission.status !== "submitted") {
    return { allowed: false, status: "not_submitted", message: "먼저 학습지를 제출해야 게시할 수 있어요." };
  }

  if (!input.board) {
    return { allowed: false, status: "no_board", message: "연결된 나눔 게시판이 없어요. 선생님께 문의해 주세요." };
  }

  if (!input.board.publish.open) {
    return { allowed: false, status: "closed", message: "선생님이 게시를 마감했어요." };
  }

  if (!input.board.scope.periods.includes(input.period)) {
    return {
      allowed: false,
      status: "no_board",
      message: `${input.period}차시는 이 게시판에 연결되지 않았어요.`,
    };
  }

  const sectionId = input.board.columnMap[String(input.studentNo)];
  if (!sectionId) {
    return {
      allowed: false,
      status: "no_column",
      message: `${input.studentNo}번 칸이 게시판에 없어요. 선생님께 보드 설정을 요청해 주세요.`,
    };
  }

  if (input.existingPost?.status === "published" && input.existingPost.bodyHash === input.bodyHash) {
    return { allowed: false, status: "duplicate", message: "이미 같은 내용이 게시되어 있어요." };
  }

  if (
    input.existingPost?.status === "published" &&
    input.existingPost.bodyHash !== input.bodyHash &&
    !input.board.publish.allowRepublish &&
    !input.isTeacherProxy
  ) {
    return { allowed: false, status: "closed", message: "재게시가 허용되지 않았어요." };
  }

  if (input.mode === "republish" && !input.board.publish.allowRepublish && !input.isTeacherProxy) {
    return { allowed: false, status: "closed", message: "재게시가 허용되지 않았어요." };
  }

  return { allowed: true };
}

export function postDocId(boardId: string, studentNo: number, period: number): string {
  return `${boardId}_${studentNo}_${period}`;
}
