import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import type { Answers, WorksheetMeta } from "@/lib/types";
import type { SubmissionPadletPost } from "@/lib/padlet/publish-types";
import type { WorksheetSubmissionStatus } from "@/lib/firebase/submissions";

export interface ServerWorksheetSubmission {
  id: string;
  templateId: string;
  templateName: string;
  meta: WorksheetMeta;
  values: Answers;
  studentUid: string;
  status: WorksheetSubmissionStatus;
  padletPost?: SubmissionPadletPost;
}

function mapSubmission(id: string, data: FirebaseFirestore.DocumentData): ServerWorksheetSubmission {
  const padlet = data.padletPost as SubmissionPadletPost | undefined;
  return {
    id,
    templateId: String(data.templateId ?? ""),
    templateName: String(data.templateName ?? ""),
    meta: (data.meta ?? {}) as WorksheetMeta,
    values: (data.values ?? {}) as Answers,
    studentUid: String(data.studentUid ?? ""),
    status: data.status === "draft" ? "draft" : "submitted",
    padletPost: padlet,
  };
}

export async function getSubmissionServer(submissionId: string): Promise<ServerWorksheetSubmission | null> {
  if (!isAdminConfigured()) return null;
  const db = await getAdminDb();
  const snap = await db.collection("submissions").doc(submissionId).get();
  if (!snap.exists) return null;
  return mapSubmission(snap.id, snap.data() ?? {});
}

export async function updateSubmissionPadletPost(
  submissionId: string,
  padletPost: SubmissionPadletPost,
): Promise<void> {
  if (!isAdminConfigured()) return;
  const db = await getAdminDb();
  await db.collection("submissions").doc(submissionId).update({
    padletPost: {
      ...padletPost,
      publishedAt: padletPost.publishedAt ?? new Date(),
    },
    updatedAt: new Date(),
  });
}

export async function markSubmissionPadletStale(submissionId: string): Promise<void> {
  if (!isAdminConfigured()) return;
  const db = await getAdminDb();
  const ref = db.collection("submissions").doc(submissionId);
  const snap = await ref.get();
  if (!snap.exists) return;
  const existing = snap.data()?.padletPost;
  if (!existing || existing.status !== "published") return;
  await ref.update({
    "padletPost.status": "stale",
    updatedAt: new Date(),
  });
}

export async function getOrCreateShareUrl(submissionId: string, studentUid: string): Promise<string | null> {
  if (!isAdminConfigured()) return null;
  const db = await getAdminDb();
  const existing = await db
    .collection("shares")
    .where("submissionId", "==", submissionId)
    .limit(1)
    .get();
  if (!existing.empty) {
    const token = existing.docs[0].id;
    return null; // 클라이언트에서 origin 조합 — 서버에서는 token만 반환 가능
  }
  return null;
}

export async function findShareTokenForSubmission(submissionId: string): Promise<string | null> {
  if (!isAdminConfigured()) return null;
  const db = await getAdminDb();
  const snap = await db.collection("shares").where("submissionId", "==", submissionId).limit(1).get();
  if (snap.empty) return null;
  return snap.docs[0].id;
}

export async function createShareTokenForSubmission(
  submission: ServerWorksheetSubmission,
  origin: string,
): Promise<string | null> {
  if (!isAdminConfigured()) return null;
  const db = await getAdminDb();
  let token = await findShareTokenForSubmission(submission.id);
  if (!token) {
    const crypto = await import("crypto");
    token = crypto.randomBytes(24).toString("hex");
    await db.collection("shares").doc(token).set({
      submissionId: submission.id,
      studentUid: submission.studentUid,
      templateId: submission.templateId,
      templateName: submission.templateName,
      meta: submission.meta,
      values: submission.values,
      submittedAt: new Date(),
      createdAt: new Date(),
    });
  }
  return `${origin.replace(/\/$/, "")}/share/${token}`;
}
