import {
  hasKorean,
  MIN_FEEDBACK_FIELD_CHARS,
} from "@/lib/worksheet-validation";

export type PeerFeedbackTargetType = "worksheet" | "inquiry-report";

export const MAX_PEER_FEEDBACK_COUNT = 2;

export interface PeerFeedbackForm {
  differentPoint: string;
  goodPoint: string;
  curiousPoint: string;
}

export const EMPTY_PEER_FEEDBACK: PeerFeedbackForm = {
  differentPoint: "",
  goodPoint: "",
  curiousPoint: "",
};

export interface ClassmateInfo {
  uid: string;
  studentName: string;
  studentNo: string;
  grade: string;
  classNo: string;
}

export function validatePeerFeedbackForm(form: PeerFeedbackForm): string[] {
  const errors: string[] = [];
  const fields: { key: keyof PeerFeedbackForm; label: string }[] = [
    { key: "differentPoint", label: "나와 다른 점" },
    { key: "goodPoint", label: "잘한 점" },
    { key: "curiousPoint", label: "궁금한 점" },
  ];

  for (const { key, label } of fields) {
    const text = form[key].trim();
    if (!text) {
      errors.push(`${label}을(를) 입력하세요.`);
      continue;
    }
    if (text.length < MIN_FEEDBACK_FIELD_CHARS || !hasKorean(text)) {
      errors.push(
        `${label}: ${MIN_FEEDBACK_FIELD_CHARS}자 이상 한글로 작성해 주세요 (현재 ${text.length}자)`,
      );
    }
  }

  return errors;
}
