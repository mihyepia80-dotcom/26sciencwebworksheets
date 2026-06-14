"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import type { AiRating } from "@/lib/ai/feedback";
import type { Answers, WorksheetMeta } from "@/lib/types";
import { getClientDb } from "./client";
import { deleteSharesForSubmission } from "./shares";

export interface WorksheetSubmission {
  id?: string;
  templateId: string;
  templateName: string;
  meta: WorksheetMeta;
  values: Answers;
  studentUid: string;
  submittedAt: Timestamp | null;
  aiFeedback?: string;
  aiRating?: AiRating;
}

export interface SaveSubmissionInput {
  templateId: string;
  templateName: string;
  meta: WorksheetMeta;
  values: Answers;
  studentUid: string;
  aiFeedback?: string;
  aiRating?: AiRating;
}

function mapSubmissionDoc(id: string, data: Record<string, unknown>): WorksheetSubmission {
  const rating = data.aiRating;
  const validRating =
    rating === "잘함" || rating === "보통" || rating === "노력요함" ? rating : undefined;

  return {
    id,
    templateId: String(data.templateId ?? ""),
    templateName: String(data.templateName ?? ""),
    meta: (data.meta ?? {}) as WorksheetMeta,
    values: (data.values ?? {}) as Answers,
    studentUid: String(data.studentUid ?? ""),
    submittedAt: (data.submittedAt as Timestamp | null) ?? null,
    aiFeedback: data.aiFeedback ? String(data.aiFeedback) : undefined,
    aiRating: validRating,
  };
}

function buildSubmissionDoc(input: SaveSubmissionInput) {
  const doc: Record<string, unknown> = {
    templateId: input.templateId,
    templateName: input.templateName,
    meta: input.meta,
    values: input.values,
    studentUid: input.studentUid,
    grade: String(input.meta.grade ?? ""),
    classNo: String(input.meta.classNo ?? ""),
    submittedAt: serverTimestamp(),
  };
  if (input.aiFeedback) doc.aiFeedback = input.aiFeedback;
  if (input.aiRating) doc.aiRating = input.aiRating;
  return doc;
}

export async function saveSubmission(input: SaveSubmissionInput): Promise<string> {
  const docRef = await addDoc(collection(getClientDb(), "submissions"), buildSubmissionDoc(input));
  return docRef.id;
}

export async function getSubmission(submissionId: string): Promise<WorksheetSubmission | null> {
  const snap = await getDoc(doc(getClientDb(), "submissions", submissionId));
  if (!snap.exists()) return null;
  return mapSubmissionDoc(snap.id, snap.data());
}

export async function updateSubmission(
  submissionId: string,
  input: Omit<SaveSubmissionInput, "studentUid"> & { studentUid: string },
): Promise<void> {
  await updateDoc(doc(getClientDb(), "submissions", submissionId), buildSubmissionDoc(input));
}

export async function deleteSubmission(submissionId: string): Promise<void> {
  await deleteSharesForSubmission(submissionId);
  await deleteDoc(doc(getClientDb(), "submissions", submissionId));
}

export async function listSubmissions(max = 100): Promise<WorksheetSubmission[]> {
  const snapshot = await getDocs(
    query(collection(getClientDb(), "submissions"), orderBy("submittedAt", "desc"), limit(max)),
  );
  return snapshot.docs.map((doc) => mapSubmissionDoc(doc.id, doc.data()));
}

export async function listStudentSubmissions(studentUid: string, max = 50): Promise<WorksheetSubmission[]> {
  const snapshot = await getDocs(
    query(
      collection(getClientDb(), "submissions"),
      where("studentUid", "==", studentUid),
      orderBy("submittedAt", "desc"),
      limit(max),
    ),
  );
  return snapshot.docs.map((doc) => mapSubmissionDoc(doc.id, doc.data()));
}
