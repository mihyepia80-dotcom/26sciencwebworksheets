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

function str(data: Record<string, unknown>, key: string, fallback = ""): string {
  return String(data[key] ?? fallback);
}

function mapLegacyReport(data: Record<string, unknown>) {
  const hasNew = Boolean(data.unitName || data.curiousContent || data.inquiryProblem);
  if (hasNew) return null;
  return {
    unitName: str(data, "title"),
    lessonName: "",
    curiousContent: str(data, "content"),
    inquiryProblem: str(data, "title"),
    priorKnowledge: str(data, "materials"),
    processStep1: str(data, "processSummary"),
    inquiryResult: str(data, "resultSummary"),
    learnedAfter: str(data, "conclusion"),
    classLearned: str(data, "sceneDescription"),
    resultOrganized: str(data, "resultSummary"),
  };
}

function mapDoc(id: string, data: Record<string, unknown>): InquiryReportDoc {
  const members = Array.isArray(data.members) ? data.members.map(String) : ["", "", "", "", "", ""];
  while (members.length < 6) members.push("");
  const legacy = mapLegacyReport(data);

  return {
    id,
    studentUid: String(data.studentUid ?? ""),
    status: data.status === "submitted" ? "submitted" : "draft",
    groupNo: String(data.groupNo ?? ""),
    members: members.slice(0, 6),
    recorder: String(data.recorder ?? ""),
    unitName: legacy?.unitName ?? str(data, "unitName"),
    lessonName: legacy?.lessonName ?? str(data, "lessonName"),
    curiousContent: legacy?.curiousContent ?? str(data, "curiousContent"),
    inquiryProblem: legacy?.inquiryProblem ?? str(data, "inquiryProblem"),
    priorKnowledge: legacy?.priorKnowledge ?? str(data, "priorKnowledge"),
    processStep1: legacy?.processStep1 ?? str(data, "processStep1"),
    processStep2: str(data, "processStep2"),
    processStep3: str(data, "processStep3"),
    processStep4: str(data, "processStep4"),
    processStep5: str(data, "processStep5"),
    inquiryResult: legacy?.inquiryResult ?? str(data, "inquiryResult"),
    learnedAfter: legacy?.learnedAfter ?? str(data, "learnedAfter"),
    wantToKnowMore: str(data, "wantToKnowMore"),
    classLearned: legacy?.classLearned ?? str(data, "classLearned"),
    mostCurious: str(data, "mostCurious"),
    resultOrganized: legacy?.resultOrganized ?? str(data, "resultOrganized"),
    realLifeStory: str(data, "realLifeStory"),
    visualDrawing: str(data, "visualDrawing"),
    visualDescription: str(data, "visualDescription"),
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
