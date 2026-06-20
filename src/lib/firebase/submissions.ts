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

export type WorksheetSubmissionStatus = "draft" | "submitted";

export interface WorksheetSubmission {
  id?: string;
  templateId: string;
  templateName: string;
  meta: WorksheetMeta;
  values: Answers;
  studentUid: string;
  status: WorksheetSubmissionStatus;
  submittedAt: Timestamp | null;
  updatedAt: Timestamp | null;
  linkedReportId?: string;
  instanceNo?: number;
  aiFeedback?: string;
  aiRating?: AiRating;
}

export interface SaveSubmissionInput {
  templateId: string;
  templateName: string;
  meta: WorksheetMeta;
  values: Answers;
  studentUid: string;
  linkedReportId?: string;
  instanceNo?: number;
  aiFeedback?: string;
  aiRating?: AiRating;
}

function inferStatus(data: Record<string, unknown>): WorksheetSubmissionStatus {
  if (data.status === "draft") return "draft";
  if (data.status === "submitted") return "submitted";
  return data.submittedAt ? "submitted" : "draft";
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
    status: inferStatus(data),
    submittedAt: (data.submittedAt as Timestamp | null) ?? null,
    updatedAt: (data.updatedAt as Timestamp | null) ?? null,
    aiFeedback: data.aiFeedback ? String(data.aiFeedback) : undefined,
    aiRating: validRating,
    linkedReportId: data.linkedReportId ? String(data.linkedReportId) : undefined,
    instanceNo: typeof data.instanceNo === "number" ? data.instanceNo : undefined,
  };
}

function buildSubmissionDoc(input: SaveSubmissionInput, status: WorksheetSubmissionStatus) {
  const doc: Record<string, unknown> = {
    templateId: input.templateId,
    templateName: input.templateName,
    meta: input.meta,
    values: input.values,
    studentUid: input.studentUid,
    grade: String(input.meta.grade ?? ""),
    classNo: String(input.meta.classNo ?? ""),
    status,
    updatedAt: serverTimestamp(),
  };

  if (status === "submitted") {
    doc.submittedAt = serverTimestamp();
  } else {
    doc.submittedAt = null;
  }

  if (input.aiFeedback) doc.aiFeedback = input.aiFeedback;
  if (input.aiRating) doc.aiRating = input.aiRating;
  if (input.linkedReportId) doc.linkedReportId = input.linkedReportId;
  if (typeof input.instanceNo === "number") doc.instanceNo = input.instanceNo;
  return doc;
}

export async function saveSubmission(input: SaveSubmissionInput): Promise<string> {
  const docRef = await addDoc(
    collection(getClientDb(), "submissions"),
    buildSubmissionDoc(input, "submitted"),
  );
  return docRef.id;
}

export async function saveSubmissionDraft(
  input: Omit<SaveSubmissionInput, "aiFeedback" | "aiRating">,
): Promise<string> {
  const docRef = await addDoc(
    collection(getClientDb(), "submissions"),
    buildSubmissionDoc(input, "draft"),
  );
  return docRef.id;
}

export async function getSubmission(submissionId: string): Promise<WorksheetSubmission | null> {
  const snap = await getDoc(doc(getClientDb(), "submissions", submissionId));
  if (!snap.exists()) return null;
  return mapSubmissionDoc(snap.id, snap.data());
}

export async function findStudentDraftForTemplate(
  studentUid: string,
  templateId: string,
): Promise<WorksheetSubmission | null> {
  const snapshot = await getDocs(
    query(
      collection(getClientDb(), "submissions"),
      where("studentUid", "==", studentUid),
      where("templateId", "==", templateId),
      where("status", "==", "draft"),
      limit(1),
    ),
  );
  const first = snapshot.docs[0];
  if (!first) return null;
  return mapSubmissionDoc(first.id, first.data());
}

export async function findStudentDraftForReport(
  studentUid: string,
  templateId: string,
  reportId: string,
  submissionId?: string | null,
): Promise<WorksheetSubmission | null> {
  if (submissionId) {
    const doc = await getSubmission(submissionId);
    if (doc && doc.studentUid === studentUid && doc.linkedReportId === reportId) return doc;
  }

  const snapshot = await getDocs(
    query(
      collection(getClientDb(), "submissions"),
      where("studentUid", "==", studentUid),
      where("linkedReportId", "==", reportId),
      where("templateId", "==", templateId),
      where("status", "==", "draft"),
      limit(20),
    ),
  );

  const drafts = snapshot.docs.map((d) => mapSubmissionDoc(d.id, d.data()));
  if (drafts.length === 0) return null;
  drafts.sort((a, b) => (b.instanceNo ?? 0) - (a.instanceNo ?? 0));
  return drafts[0];
}

export async function listSubmissionsForReport(reportId: string): Promise<WorksheetSubmission[]> {
  const snapshot = await getDocs(
    query(
      collection(getClientDb(), "submissions"),
      where("linkedReportId", "==", reportId),
      orderBy("updatedAt", "desc"),
      limit(100),
    ),
  );
  return snapshot.docs.map((d) => mapSubmissionDoc(d.id, d.data()));
}

export async function getNextInstanceNo(
  studentUid: string,
  templateId: string,
  reportId: string,
): Promise<number> {
  const snapshot = await getDocs(
    query(
      collection(getClientDb(), "submissions"),
      where("studentUid", "==", studentUid),
      where("linkedReportId", "==", reportId),
      where("templateId", "==", templateId),
      limit(50),
    ),
  );
  let max = 0;
  for (const d of snapshot.docs) {
    const n = Number(d.data().instanceNo ?? 0);
    if (n > max) max = n;
  }
  return max + 1;
}

export async function updateSubmissionDraft(
  submissionId: string,
  input: Omit<SaveSubmissionInput, "studentUid" | "aiFeedback" | "aiRating"> & { studentUid: string },
): Promise<void> {
  await updateDoc(
    doc(getClientDb(), "submissions", submissionId),
    buildSubmissionDoc(input, "draft"),
  );
}

export async function updateSubmission(
  submissionId: string,
  input: Omit<SaveSubmissionInput, "studentUid"> & { studentUid: string },
): Promise<void> {
  await updateDoc(
    doc(getClientDb(), "submissions", submissionId),
    buildSubmissionDoc(input, "submitted"),
  );
}

export async function deleteSubmission(submissionId: string): Promise<void> {
  await deleteSharesForSubmission(submissionId);
  await deleteDoc(doc(getClientDb(), "submissions", submissionId));
}

export async function listSubmissions(max = 100): Promise<WorksheetSubmission[]> {
  const snapshot = await getDocs(
    query(collection(getClientDb(), "submissions"), orderBy("submittedAt", "desc"), limit(max)),
  );
  return snapshot.docs
    .map((doc) => mapSubmissionDoc(doc.id, doc.data()))
    .filter((s) => s.status === "submitted");
}

/** 교사용: 제출·임시저장 포함 최근 활동지 목록 */
export async function listTeacherSubmissions(max = 200): Promise<WorksheetSubmission[]> {
  const [byUpdated, bySubmitted] = await Promise.all([
    getDocs(
      query(collection(getClientDb(), "submissions"), orderBy("updatedAt", "desc"), limit(max)),
    ),
    getDocs(
      query(collection(getClientDb(), "submissions"), orderBy("submittedAt", "desc"), limit(max)),
    ),
  ]);

  const merged = new Map<string, WorksheetSubmission>();
  for (const docSnap of [...byUpdated.docs, ...bySubmitted.docs]) {
    merged.set(docSnap.id, mapSubmissionDoc(docSnap.id, docSnap.data()));
  }

  return [...merged.values()]
    .sort((a, b) => submissionSortTime(b) - submissionSortTime(a))
    .slice(0, max);
}

function submissionSortTime(submission: WorksheetSubmission): number {
  const ts = submission.updatedAt ?? submission.submittedAt;
  return ts?.toMillis() ?? 0;
}

export async function listStudentSubmissions(studentUid: string, max = 50): Promise<WorksheetSubmission[]> {
  const [byUpdated, bySubmitted] = await Promise.all([
    getDocs(
      query(
        collection(getClientDb(), "submissions"),
        where("studentUid", "==", studentUid),
        orderBy("updatedAt", "desc"),
        limit(max),
      ),
    ),
    getDocs(
      query(
        collection(getClientDb(), "submissions"),
        where("studentUid", "==", studentUid),
        orderBy("submittedAt", "desc"),
        limit(max),
      ),
    ),
  ]);

  const merged = new Map<string, WorksheetSubmission>();
  for (const doc of [...byUpdated.docs, ...bySubmitted.docs]) {
    merged.set(doc.id, mapSubmissionDoc(doc.id, doc.data()));
  }

  return [...merged.values()].sort((a, b) => submissionSortTime(b) - submissionSortTime(a)).slice(0, max);
}
