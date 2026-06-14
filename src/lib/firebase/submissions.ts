"use client";

import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  where,
  type Timestamp,
} from "firebase/firestore";
import type { Answers, WorksheetMeta } from "@/lib/types";
import { getClientDb } from "./client";

export interface WorksheetSubmission {
  id?: string;
  templateId: string;
  templateName: string;
  meta: WorksheetMeta;
  values: Answers;
  studentUid: string;
  submittedAt: Timestamp | null;
}

export interface SaveSubmissionInput {
  templateId: string;
  templateName: string;
  meta: WorksheetMeta;
  values: Answers;
  studentUid: string;
}

function mapSubmissionDoc(id: string, data: Record<string, unknown>): WorksheetSubmission {
  return {
    id,
    templateId: String(data.templateId ?? ""),
    templateName: String(data.templateName ?? ""),
    meta: (data.meta ?? {}) as WorksheetMeta,
    values: (data.values ?? {}) as Answers,
    studentUid: String(data.studentUid ?? ""),
    submittedAt: (data.submittedAt as Timestamp | null) ?? null,
  };
}

export async function saveSubmission(input: SaveSubmissionInput): Promise<string> {
  const docRef = await addDoc(collection(getClientDb(), "submissions"), {
    templateId: input.templateId,
    templateName: input.templateName,
    meta: input.meta,
    values: input.values,
    studentUid: input.studentUid,
    submittedAt: serverTimestamp(),
  });
  return docRef.id;
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
