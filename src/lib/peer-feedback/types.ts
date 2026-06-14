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
  if (!form.differentPoint.trim()) errors.push("나와 다른 점을 입력하세요.");
  if (!form.goodPoint.trim()) errors.push("잘한 점을 입력하세요.");
  if (!form.curiousPoint.trim()) errors.push("궁금한 점을 입력하세요.");
  return errors;
}
