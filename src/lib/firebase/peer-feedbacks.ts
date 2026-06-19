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
  where,
  type Timestamp,
} from "firebase/firestore";
import type { StudentProfile } from "@/lib/firebase/student-auth";
import type { PeerFeedbackForm, PeerFeedbackTargetType } from "@/lib/peer-feedback/types";
import { getClientDb } from "./client";

export interface PeerFeedbackDoc extends PeerFeedbackForm {
  id?: string;
  authorUid: string;
  authorName: string;
  targetUid: string;
  targetName: string;
  grade: string;
  classNo: string;
  targetType: PeerFeedbackTargetType;
  targetDocId: string;
  templateId: string;
  templateName: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

function mapFeedback(id: string, data: Record<string, unknown>): PeerFeedbackDoc {
  return {
    id,
    authorUid: String(data.authorUid ?? ""),
    authorName: String(data.authorName ?? ""),
    targetUid: String(data.targetUid ?? ""),
    targetName: String(data.targetName ?? ""),
    grade: String(data.grade ?? ""),
    classNo: String(data.classNo ?? ""),
    targetType: data.targetType === "inquiry-report" ? "inquiry-report" : "worksheet",
    targetDocId: String(data.targetDocId ?? ""),
    templateId: String(data.templateId ?? ""),
    templateName: String(data.templateName ?? ""),
    differentPoint: String(data.differentPoint ?? ""),
    goodPoint: String(data.goodPoint ?? ""),
    curiousPoint: String(data.curiousPoint ?? ""),
    createdAt: (data.createdAt as Timestamp | null) ?? null,
    updatedAt: (data.updatedAt as Timestamp | null) ?? null,
  };
}

export async function listClassmates(grade: string, classNo: string, excludeUid: string) {
  const snap = await getDocs(
    query(
      collection(getClientDb(), "students"),
      where("grade", "==", grade),
      where("classNo", "==", classNo),
      limit(60),
    ),
  );
  return snap.docs
    .map((d) => ({
      uid: d.id,
      studentName: String(d.data().studentName ?? ""),
      studentNo: String(d.data().studentNo ?? ""),
      grade: String(d.data().grade ?? ""),
      classNo: String(d.data().classNo ?? ""),
    }))
    .filter((s) => s.uid !== excludeUid && s.studentName.trim());
}

export async function listAuthorPeerFeedbacks(
  authorUid: string,
  targetType: PeerFeedbackTargetType,
  templateId: string,
): Promise<PeerFeedbackDoc[]> {
  const snap = await getDocs(
    query(
      collection(getClientDb(), "peerFeedbacks"),
      where("authorUid", "==", authorUid),
      where("targetType", "==", targetType),
      where("templateId", "==", templateId),
      orderBy("createdAt", "desc"),
      limit(10),
    ),
  );
  return snap.docs.map((d) => mapFeedback(d.id, d.data()));
}

export async function listReceivedPeerFeedbacks(targetUid: string, max = 30): Promise<PeerFeedbackDoc[]> {
  const snap = await getDocs(
    query(
      collection(getClientDb(), "peerFeedbacks"),
      where("targetUid", "==", targetUid),
      orderBy("createdAt", "desc"),
      limit(max),
    ),
  );
  return snap.docs.map((d) => mapFeedback(d.id, d.data()));
}

export async function findClassmateWorkDocId(
  grade: string,
  classNo: string,
  targetType: PeerFeedbackTargetType,
  templateId: string,
  targetUid: string,
): Promise<string | null> {
  if (targetType === "worksheet") {
    if (grade && classNo) {
      const byClass = await getDocs(
        query(
          collection(getClientDb(), "submissions"),
          where("grade", "==", grade),
          where("classNo", "==", classNo),
          where("templateId", "==", templateId),
          where("studentUid", "==", targetUid),
          where("status", "==", "submitted"),
          orderBy("submittedAt", "desc"),
          limit(1),
        ),
      );
      if (byClass.docs[0]) return byClass.docs[0].id;
    }

    const byStudent = await getDocs(
      query(
        collection(getClientDb(), "submissions"),
        where("studentUid", "==", targetUid),
        where("templateId", "==", templateId),
        where("status", "==", "submitted"),
        orderBy("submittedAt", "desc"),
        limit(1),
      ),
    );
    return byStudent.docs[0]?.id ?? null;
  }

  if (grade && classNo) {
    const byClass = await getDocs(
      query(
        collection(getClientDb(), "inquiryReports"),
        where("grade", "==", grade),
        where("classNo", "==", classNo),
        where("studentUid", "==", targetUid),
        where("status", "==", "submitted"),
        orderBy("updatedAt", "desc"),
        limit(1),
      ),
    );
    if (byClass.docs[0]) return byClass.docs[0].id;
  }

  const byStudent = await getDocs(
    query(
      collection(getClientDb(), "inquiryReports"),
      where("studentUid", "==", targetUid),
      where("status", "==", "submitted"),
      orderBy("updatedAt", "desc"),
      limit(1),
    ),
  );
  return byStudent.docs[0]?.id ?? null;
}

export async function hasAuthorSubmittedSameKind(
  authorUid: string,
  targetType: PeerFeedbackTargetType,
  templateId: string,
  ownDocId?: string | null,
): Promise<boolean> {
  if (targetType === "worksheet") {
    if (ownDocId) {
      const snap = await getDoc(doc(getClientDb(), "submissions", ownDocId));
      return (
        snap.exists() &&
        snap.data()?.studentUid === authorUid &&
        (snap.data()?.status === "submitted" || (!snap.data()?.status && snap.data()?.submittedAt))
      );
    }
    const snap = await getDocs(
      query(
        collection(getClientDb(), "submissions"),
        where("studentUid", "==", authorUid),
        where("templateId", "==", templateId),
        where("status", "==", "submitted"),
        limit(1),
      ),
    );
    return !snap.empty;
  }

  if (ownDocId) {
    const snap = await getDoc(doc(getClientDb(), "inquiryReports", ownDocId));
    return snap.exists() && snap.data()?.studentUid === authorUid && snap.data()?.status === "submitted";
  }
  const snap = await getDocs(
    query(
      collection(getClientDb(), "inquiryReports"),
      where("studentUid", "==", authorUid),
      where("status", "==", "submitted"),
      limit(1),
    ),
  );
  return !snap.empty;
}

export async function listAllPeerFeedbacks(max = 200): Promise<PeerFeedbackDoc[]> {
  const snap = await getDocs(
    query(collection(getClientDb(), "peerFeedbacks"), orderBy("createdAt", "desc"), limit(max)),
  );
  return snap.docs.map((d) => mapFeedback(d.id, d.data()));
}

export async function deletePeerFeedback(feedbackId: string): Promise<void> {
  await deleteDoc(doc(getClientDb(), "peerFeedbacks", feedbackId));
}

export async function createPeerFeedback(input: {
  author: StudentProfile & { uid: string };
  target: { uid: string; studentName: string };
  targetType: PeerFeedbackTargetType;
  targetDocId: string;
  templateId: string;
  templateName: string;
  form: PeerFeedbackForm;
}): Promise<string> {
  const ref = await addDoc(collection(getClientDb(), "peerFeedbacks"), {
    authorUid: input.author.uid,
    authorName: input.author.studentName,
    targetUid: input.target.uid,
    targetName: input.target.studentName,
    grade: input.author.grade,
    classNo: input.author.classNo,
    targetType: input.targetType,
    targetDocId: input.targetDocId,
    templateId: input.templateId,
    templateName: input.templateName,
    differentPoint: input.form.differentPoint.trim(),
    goodPoint: input.form.goodPoint.trim(),
    curiousPoint: input.form.curiousPoint.trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}
