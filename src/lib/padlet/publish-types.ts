import type { PadletPostColor } from "@/lib/padlet/types";

export type PadletPostStatus = "pending" | "published" | "failed" | "stale";
export type PublishResultStatus =
  | "published"
  | "updated"
  | "duplicate"
  | "closed"
  | "not_submitted"
  | "no_board"
  | "no_column"
  | "rate_limited"
  | "error";

export interface PublishRequest {
  submissionId: string;
  boardDocId?: string;
  mode?: "publish" | "republish";
  targetStudentNo?: number;
}

export interface PublishResponse {
  status: PublishResultStatus;
  postUrl: string | null;
  boardUrl: string | null;
  sectionLabel: string | null;
  subject: string | null;
  message?: string;
}

export interface PadletBoardScope {
  grade: number;
  classNo: number;
  unitId: string;
  periods: number[];
}

export interface PadletBoardPublishConfig {
  open: boolean;
  allowRepublish: boolean;
  closedAt?: Date | null;
}

export interface PadletBoardDoc {
  id?: string;
  teacherUid: string;
  boardId: string;
  boardUrl: string;
  title: string;
  layout: string;
  columnMode: "numbers" | "groups";
  scope: PadletBoardScope;
  columnMap: Record<string, string>;
  publish: PadletBoardPublishConfig;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PadletPostDoc {
  boardDocId: string;
  boardId: string;
  sectionId: string;
  studentUid: string;
  studentNo: number;
  period: number;
  templateId: string;
  submissionId: string;
  padletPostId: string | null;
  postUrl: string | null;
  subject: string;
  bodyHash: string;
  status: PadletPostStatus;
  attempts: number;
  lastError: string | null;
  publishedAt?: Date | null;
  updatedAt?: Date;
}

export interface SubmissionPadletPost {
  boardId: string;
  postDocId: string;
  postUrl: string | null;
  status: PadletPostStatus;
  publishedAt?: Date | null;
}

export interface ComposedPost {
  subject: string;
  body: string;
  color: PadletPostColor;
  bodyHash: string;
}

export interface PadletBoardMineResponse {
  boardDocId: string;
  boardUrl: string;
  title: string;
  publishOpen: boolean;
  myPosts: Array<{ period: number; status: string; postUrl: string | null }>;
}
