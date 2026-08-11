import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import type { QbChecklist, QbSlots, QbSource } from "./types";

const SESSION_COLLECTION = "inquiryQuestionSessions";

export interface QbSessionTurn {
  at: Date;
  slots: QbSlots;
  source: QbSource;
  probe: string | null;
  candidates: string[];
  picked: string | null;
  usage?: { promptTokens: number; outputTokens: number };
}

export async function appendQuestionBotTurn(
  studentUid: string,
  meta: {
    grade: string;
    classNo: string;
    studentNo: string;
    unitId: string;
    period: string;
    templateId: string;
  },
  turn: QbSessionTurn,
  initialQuestion?: string,
  finalQuestion?: string,
  qualityInitial?: 0 | 1 | 2 | 3,
  qualityFinal?: 0 | 1 | 2 | 3,
): Promise<void> {
  if (!isAdminConfigured()) return;
  const db = await getAdminDb();
  const sessionId = `${studentUid}_${meta.unitId}_${meta.period}_${meta.templateId}`;
  const ref = db.collection(SESSION_COLLECTION).doc(sessionId);
  const snap = await ref.get();

  if (!snap.exists) {
    await ref.set({
      studentUid,
      meta: {
        grade: Number(meta.grade) || meta.grade,
        classNo: Number(meta.classNo) || meta.classNo,
        studentNo: Number(meta.studentNo) || meta.studentNo,
        unitId: meta.unitId,
        period: meta.period,
        templateId: meta.templateId,
      },
      turns: [{ ...turn, at: turn.at }],
      initialQuestion: initialQuestion ?? "",
      finalQuestion: finalQuestion ?? "",
      qualityInitial: qualityInitial ?? 0,
      qualityFinal: qualityFinal ?? 0,
      updatedAt: new Date(),
    });
    return;
  }

  const existing = snap.data()?.turns ?? [];
  await ref.update({
    turns: [...existing, { ...turn, at: turn.at }],
    ...(initialQuestion !== undefined ? { initialQuestion } : {}),
    ...(finalQuestion !== undefined ? { finalQuestion } : {}),
    ...(qualityInitial !== undefined ? { qualityInitial } : {}),
    ...(qualityFinal !== undefined ? { qualityFinal } : {}),
    updatedAt: new Date(),
  });
}

export async function confirmQuestionBotSession(
  studentUid: string,
  unitId: string,
  period: string,
  templateId: string,
  finalQuestion: string,
  qualityFinal: 0 | 1 | 2 | 3,
): Promise<void> {
  if (!isAdminConfigured()) return;
  const db = await getAdminDb();
  const sessionId = `${studentUid}_${unitId}_${period}_${templateId}`;
  const ref = db.collection(SESSION_COLLECTION).doc(sessionId);
  await ref.set(
    { finalQuestion, qualityFinal, updatedAt: new Date() },
    { merge: true },
  );
}

export async function listQuestionBotSessionsForTeacher(limit = 100) {
  if (!isAdminConfigured()) return [];
  const db = await getAdminDb();
  const snap = await db.collection(SESSION_COLLECTION).orderBy("updatedAt", "desc").limit(limit).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
