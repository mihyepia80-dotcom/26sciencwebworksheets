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
import type { InquiryReportForm } from "@/lib/inquiry-report/types";
import { getClientDb } from "./client";

export type InquiryReportStatus = "draft" | "submitted";

export interface InquiryReportDoc extends InquiryReportForm {
  id?: string;
  studentUid: string;
  status: InquiryReportStatus;
  submittedAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

function mapDoc(id: string, data: Record<string, unknown>): InquiryReportDoc {
  const members = Array.isArray(data.members) ? data.members.map(String) : ["", "", "", "", "", ""];
  while (members.length < 6) members.push("");

  return {
    id,
    studentUid: String(data.studentUid ?? ""),
    status: data.status === "submitted" ? "submitted" : "draft",
    groupNo: String(data.groupNo ?? ""),
    members: members.slice(0, 6),
    recorder: String(data.recorder ?? ""),
    title: String(data.title ?? ""),
    materials: String(data.materials ?? ""),
    content: String(data.content ?? ""),
    processSummary: String(data.processSummary ?? ""),
    sceneDescription: String(data.sceneDescription ?? ""),
    resultSummary: String(data.resultSummary ?? ""),
    conclusion: String(data.conclusion ?? ""),
    submittedAt: (data.submittedAt as Timestamp | null) ?? null,
    updatedAt: (data.updatedAt as Timestamp | null) ?? null,
  };
}

function toFirestorePayload(form: InquiryReportForm, studentUid: string, status: InquiryReportStatus) {
  return {
    ...form,
    members: form.members.slice(0, 6),
    studentUid,
    status,
    updatedAt: serverTimestamp(),
    ...(status === "submitted" ? { submittedAt: serverTimestamp() } : {}),
  };
}

export async function createInquiryReportDraft(
  form: InquiryReportForm,
  studentUid: string,
): Promise<string> {
  const ref = await addDoc(collection(getClientDb(), "inquiryReports"), {
    ...toFirestorePayload(form, studentUid, "draft"),
    submittedAt: null,
  });
  return ref.id;
}

export async function updateInquiryReport(
  reportId: string,
  form: InquiryReportForm,
  studentUid: string,
  status: InquiryReportStatus,
): Promise<void> {
  await updateDoc(doc(getClientDb(), "inquiryReports", reportId), toFirestorePayload(form, studentUid, status));
}

export async function getInquiryReport(reportId: string): Promise<InquiryReportDoc | null> {
  const snap = await getDoc(doc(getClientDb(), "inquiryReports", reportId));
  if (!snap.exists()) return null;
  return mapDoc(snap.id, snap.data());
}

export async function listStudentInquiryReports(studentUid: string, max = 20): Promise<InquiryReportDoc[]> {
  const snap = await getDocs(
    query(
      collection(getClientDb(), "inquiryReports"),
      where("studentUid", "==", studentUid),
      orderBy("updatedAt", "desc"),
      limit(max),
    ),
  );
  return snap.docs.map((d) => mapDoc(d.id, d.data()));
}

export async function listAllInquiryReports(max = 100): Promise<InquiryReportDoc[]> {
  const snap = await getDocs(
    query(collection(getClientDb(), "inquiryReports"), orderBy("updatedAt", "desc"), limit(max)),
  );
  return snap.docs.map((d) => mapDoc(d.id, d.data()));
}

export async function deleteInquiryReport(reportId: string): Promise<void> {
  await deleteDoc(doc(getClientDb(), "inquiryReports", reportId));
}
