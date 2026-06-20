"use client";

import {
  collection,
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
import type { InquiryReportForm } from "@/lib/inquiry-report/types";
import { inquiryReportTitle } from "@/lib/inquiry-report/types";
import { getClientDb } from "./client";

export interface InquiryReportShareRecord {
  token: string;
  reportId: string;
  studentUid: string;
  title: string;
  form: InquiryReportForm;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

function generateShareToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function mapShareDoc(token: string, data: Record<string, unknown>): InquiryReportShareRecord {
  const members = Array.isArray(data.members) ? data.members.map(String) : ["", "", "", "", "", ""];
  while (members.length < 6) members.push("");

  const form: InquiryReportForm = {
    groupNo: String(data.groupNo ?? ""),
    members: members.slice(0, 6),
    recorder: String(data.recorder ?? ""),
    unitName: String(data.unitName ?? ""),
    lessonName: String(data.lessonName ?? ""),
    curiousContent: String(data.curiousContent ?? ""),
    inquiryProblem: String(data.inquiryProblem ?? ""),
    priorKnowledge: String(data.priorKnowledge ?? ""),
    processStep1: String(data.processStep1 ?? ""),
    processStep2: String(data.processStep2 ?? ""),
    processStep3: String(data.processStep3 ?? ""),
    processStep4: String(data.processStep4 ?? ""),
    processStep5: String(data.processStep5 ?? ""),
    inquiryResult: String(data.inquiryResult ?? ""),
    learnedAfter: String(data.learnedAfter ?? ""),
    wantToKnowMore: String(data.wantToKnowMore ?? ""),
    classLearned: String(data.classLearned ?? ""),
    mostCurious: String(data.mostCurious ?? ""),
    resultOrganized: String(data.resultOrganized ?? ""),
    realLifeStory: String(data.realLifeStory ?? ""),
    visualDrawing: String(data.visualDrawing ?? ""),
    visualDescription: String(data.visualDescription ?? ""),
  };

  return {
    token,
    reportId: String(data.reportId ?? ""),
    studentUid: String(data.studentUid ?? ""),
    title: String(data.title ?? inquiryReportTitle(form)),
    form,
    createdAt: (data.createdAt as Timestamp | null) ?? null,
    updatedAt: (data.updatedAt as Timestamp | null) ?? null,
  };
}

function buildSharePayload(
  reportId: string,
  studentUid: string,
  form: InquiryReportForm,
) {
  return {
    reportId,
    studentUid,
    title: inquiryReportTitle(form),
    ...form,
    members: form.members.slice(0, 6),
    updatedAt: serverTimestamp(),
  };
}

/** Firestore 1MB 제한 — 과도하게 큰 그림 데이터는 저장 전 축소 */
export function sanitizeInquiryReportForSave(form: InquiryReportForm): InquiryReportForm {
  const next = { ...form, members: form.members.slice(0, 6) };
  if (next.visualDrawing.length > 900_000) {
    next.visualDrawing = "";
  }
  return next;
}

export async function getInquiryReportShareByToken(token: string): Promise<InquiryReportShareRecord | null> {
  const snap = await getDoc(doc(getClientDb(), "inquiryReportShares", token));
  if (!snap.exists()) return null;
  return mapShareDoc(snap.id, snap.data());
}

export async function createInquiryReportShareLink(
  reportId: string,
  studentUid: string,
  form: InquiryReportForm,
): Promise<string> {
  const db = getClientDb();
  const safeForm = sanitizeInquiryReportForSave(form);
  const payload = buildSharePayload(reportId, studentUid, safeForm);

  const existing = await getDocs(
    query(
      collection(db, "inquiryReportShares"),
      where("reportId", "==", reportId),
      where("studentUid", "==", studentUid),
      limit(1),
    ),
  );

  if (!existing.empty) {
    const token = existing.docs[0].id;
    await setDoc(doc(db, "inquiryReportShares", token), payload, { merge: true });
    return token;
  }

  const token = generateShareToken();
  await setDoc(doc(db, "inquiryReportShares", token), {
    ...payload,
    createdAt: serverTimestamp(),
  });
  return token;
}
