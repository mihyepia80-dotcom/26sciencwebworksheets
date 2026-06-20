"use client";

import { doc, getDoc, onSnapshot, serverTimestamp, setDoc, type Timestamp } from "firebase/firestore";
import { getClientDb } from "./client";

export interface WorksheetContentDoc {
  templateId: string;
  fields: Record<string, string>;
  updatedBy: string;
  updatedAt: Date | null;
}

function mapDoc(templateId: string, data: Record<string, unknown>): WorksheetContentDoc {
  return {
    templateId,
    fields: (data.fields ?? {}) as Record<string, string>,
    updatedBy: String(data.updatedBy ?? ""),
    updatedAt: (data.updatedAt as Timestamp | null)?.toDate?.() ?? null,
  };
}

export async function getWorksheetContent(templateId: string): Promise<WorksheetContentDoc | null> {
  const snap = await getDoc(doc(getClientDb(), "worksheetContent", templateId));
  if (!snap.exists()) return null;
  return mapDoc(templateId, snap.data());
}

export function subscribeWorksheetContent(
  templateId: string,
  onData: (doc: WorksheetContentDoc | null) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    doc(getClientDb(), "worksheetContent", templateId),
    (snap) => {
      onData(snap.exists() ? mapDoc(templateId, snap.data()) : null);
    },
    (err) => onError?.(err),
  );
}

export async function publishWorksheetContent(
  templateId: string,
  fields: Record<string, string>,
  teacherUid: string,
): Promise<void> {
  await setDoc(
    doc(getClientDb(), "worksheetContent", templateId),
    {
      templateId,
      fields,
      updatedBy: teacherUid,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
