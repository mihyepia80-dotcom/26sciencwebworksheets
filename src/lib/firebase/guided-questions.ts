import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import type { GuidedQuestionSet } from "@/lib/guided-questions/types";
import { normalizeTopicKey } from "@/lib/guided-questions/topic-key";
import { getClientDb } from "./client";

const COLLECTION = "guidedQuestionSets";

function mapDoc(id: string, data: Record<string, unknown>): GuidedQuestionSet {
  const updatedAt = data.updatedAt as Timestamp | undefined;
  return {
    id,
    teacherUid: String(data.teacherUid ?? ""),
    templateId: String(data.templateId ?? ""),
    templateName: String(data.templateName ?? ""),
    topic: String(data.topic ?? ""),
    topicKey: String(data.topicKey ?? ""),
    unit: data.unit ? String(data.unit) : undefined,
    grade: data.grade ? String(data.grade) : undefined,
    questions: Array.isArray(data.questions) ? data.questions.map(String) : [],
    pinned: Boolean(data.pinned),
    updatedAt: updatedAt?.toDate?.() ?? null,
  };
}

/** 학생·교사: 고정된 유도 질문 조회 (최신 1건) */
export async function findPinnedGuidedQuestions(
  templateId: string,
  topic: string,
): Promise<GuidedQuestionSet | null> {
  const topicKey = normalizeTopicKey(topic);
  if (!topicKey) return null;

  const q = query(
    collection(getClientDb(), COLLECTION),
    where("templateId", "==", templateId),
    where("topicKey", "==", topicKey),
    where("pinned", "==", true),
    orderBy("updatedAt", "desc"),
    limit(1),
  );

  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return mapDoc(docSnap.id, docSnap.data() as Record<string, unknown>);
}

export async function listTeacherGuidedQuestionSets(
  teacherUid: string,
  max = 50,
): Promise<GuidedQuestionSet[]> {
  const q = query(
    collection(getClientDb(), COLLECTION),
    where("teacherUid", "==", teacherUid),
    orderBy("updatedAt", "desc"),
    limit(max),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapDoc(d.id, d.data() as Record<string, unknown>));
}

export interface SaveGuidedQuestionSetInput {
  teacherUid: string;
  templateId: string;
  templateName: string;
  topic: string;
  unit?: string;
  grade?: string;
  questions: string[];
  pinned: boolean;
}

export async function createGuidedQuestionSet(input: SaveGuidedQuestionSetInput): Promise<string> {
  const topicKey = normalizeTopicKey(input.topic);
  const ref = await addDoc(collection(getClientDb(), COLLECTION), {
    ...input,
    topicKey,
    questions: input.questions.filter((q) => q.trim().length > 0),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateGuidedQuestionSet(
  id: string,
  input: Partial<SaveGuidedQuestionSetInput>,
): Promise<void> {
  const payload: Record<string, unknown> = {
    ...input,
    updatedAt: serverTimestamp(),
  };
  if (input.topic) {
    payload.topicKey = normalizeTopicKey(input.topic);
  }
  if (input.questions) {
    payload.questions = input.questions.filter((q) => q.trim().length > 0);
  }
  await updateDoc(doc(getClientDb(), COLLECTION, id), payload);
}

export async function deleteGuidedQuestionSet(id: string): Promise<void> {
  await deleteDoc(doc(getClientDb(), COLLECTION, id));
}
