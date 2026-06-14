"use client";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import type { AiRating } from "@/lib/ai/feedback";
import type { Answers, WorksheetMeta } from "@/lib/types";
import { getClientDb } from "./client";
import type { WorksheetSubmission } from "./submissions";

export interface ShareRecord {
  submissionId: string;
  studentUid: string;
  templateId: string;
  templateName: string;
  meta: WorksheetMeta;
  values: Answers;
  aiFeedback?: string;
  aiRating?: AiRating;
  submittedAt: Timestamp | null;
  createdAt: Timestamp | null;
}

function generateShareToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function mapShareDoc(id: string, data: Record<string, unknown>): ShareRecord {
  const rating = data.aiRating;
  const validRating =
    rating === "잘함" || rating === "보통" || rating === "노력요함" ? rating : undefined;

  return {
    submissionId: String(data.submissionId ?? ""),
    studentUid: String(data.studentUid ?? ""),
    templateId: String(data.templateId ?? ""),
    templateName: String(data.templateName ?? ""),
    meta: (data.meta ?? {}) as WorksheetMeta,
    values: (data.values ?? {}) as Answers,
    aiFeedback: data.aiFeedback ? String(data.aiFeedback) : undefined,
    aiRating: validRating,
    submittedAt: (data.submittedAt as Timestamp | null) ?? null,
    createdAt: (data.createdAt as Timestamp | null) ?? null,
  };
}

function buildSharePayload(submission: WorksheetSubmission, studentUid: string) {
  return {
    submissionId: submission.id ?? "",
    studentUid,
    templateId: submission.templateId,
    templateName: submission.templateName,
    meta: submission.meta,
    values: submission.values,
    ...(submission.aiFeedback ? { aiFeedback: submission.aiFeedback } : {}),
    ...(submission.aiRating ? { aiRating: submission.aiRating } : {}),
    ...(submission.submittedAt ? { submittedAt: submission.submittedAt } : {}),
    updatedAt: serverTimestamp(),
  };
}

export async function getShareByToken(token: string): Promise<ShareRecord | null> {
  const snap = await getDoc(doc(getClientDb(), "shares", token));
  if (!snap.exists()) return null;
  return mapShareDoc(snap.id, snap.data());
}

export async function createShareLink(
  submission: WorksheetSubmission,
  studentUid: string,
): Promise<string> {
  if (!submission.id || submission.studentUid !== studentUid) {
    throw new Error("공유할 수 없는 활동지입니다.");
  }

  const db = getClientDb();
  const existing = await getDocs(
    query(
      collection(db, "shares"),
      where("submissionId", "==", submission.id),
      where("studentUid", "==", studentUid),
      limit(1),
    ),
  );

  const payload = buildSharePayload(submission, studentUid);

  if (!existing.empty) {
    const token = existing.docs[0].id;
    await setDoc(doc(db, "shares", token), payload, { merge: true });
    return token;
  }

  const token = generateShareToken();
  await setDoc(doc(db, "shares", token), {
    ...payload,
    createdAt: serverTimestamp(),
  });
  return token;
}

export async function deleteSharesForSubmission(submissionId: string): Promise<void> {
  const db = getClientDb();
  const shares = await getDocs(
    query(collection(db, "shares"), where("submissionId", "==", submissionId)),
  );
  await Promise.all(shares.docs.map((snap) => deleteDoc(doc(db, "shares", snap.id))));
}
