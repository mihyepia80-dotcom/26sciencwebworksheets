export type TeacherInviteMode = "worksheet" | "report" | "workspace";

export interface TeacherInviteRecord {
  token: string;
  teacherUid: string;
  mode: TeacherInviteMode;
  templateId: string;
  templateName: string;
  label: string;
  active: boolean;
  createdAt: import("firebase/firestore").Timestamp | null;
  updatedAt: import("firebase/firestore").Timestamp | null;
}

export const TEACHER_INVITE_MODE_LABELS: Record<TeacherInviteMode, string> = {
  worksheet: "사고 활동지",
  report: "탐구보고서",
  workspace: "2분할 통합(활동지+보고서)",
};

export function buildInviteRedirectPath(invite: Pick<TeacherInviteRecord, "mode" | "templateId">): string {
  const params = new URLSearchParams();
  if (invite.templateId) params.set("template", invite.templateId);
  if (invite.mode === "worksheet") params.set("panel", "worksheet");
  else if (invite.mode === "report") params.set("panel", "report");
  else params.set("panel", "split");
  const query = params.toString();
  return query ? `/workspace?${query}` : "/workspace";
}

export function buildJoinUrl(token: string, origin = ""): string {
  return `${origin}/join/${token}`;
}
