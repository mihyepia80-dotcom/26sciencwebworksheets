import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import {
  QB_DAILY_LIMIT_PER_STUDENT,
  QB_TURN_LIMIT_PER_PERIOD,
} from "@/lib/inquiry-question-bot/config";
import {
  getQuestionBotTeacherConfig,
  getStudentTeacherUid,
} from "@/lib/inquiry-question-bot/teacher-config";

const QB_QUOTA_COLLECTION = "apiQuota";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function periodKey(unitId: string, period: string): string {
  return `${unitId}_${period.trim()}`;
}

export interface QuestionBotQuotaStatus {
  enabled: boolean;
  turnsLeftThisPeriod: number;
  turnsLeftToday: number;
  periodLimit: number;
  dailyLimit: number;
}

function buildStatus(
  periodUsed: number,
  dailyUsed: number,
  periodLimit: number,
  enabledByTeacher: boolean,
): QuestionBotQuotaStatus {
  const dailyLimit = QB_DAILY_LIMIT_PER_STUDENT;
  const turnsLeftThisPeriod = Math.max(0, periodLimit - periodUsed);
  const turnsLeftToday = Math.max(0, dailyLimit - dailyUsed);
  return {
    enabled: enabledByTeacher && turnsLeftThisPeriod > 0 && turnsLeftToday > 0,
    turnsLeftThisPeriod,
    turnsLeftToday,
    periodLimit,
    dailyLimit,
  };
}

export async function getQuestionBotQuotaStatus(
  studentUid?: string,
  unitId?: string,
  period?: string,
): Promise<QuestionBotQuotaStatus> {
  if (!studentUid || !isAdminConfigured()) {
    return buildStatus(0, 0, QB_TURN_LIMIT_PER_PERIOD, true);
  }

  const teacherUid = await getStudentTeacherUid(studentUid);
  const teacherConfig = await getQuestionBotTeacherConfig(teacherUid);
  const periodLimit = teacherConfig.turnLimit;

  const db = await getAdminDb();
  const dateKey = todayKey();
  const studentRef = db.collection(QB_QUOTA_COLLECTION).doc(dateKey).collection("students").doc(studentUid);
  const snap = await studentRef.get();
  const data = snap.data() ?? {};

  const dailyUsed = Number(data.questionBotTurns ?? 0);
  const periods = (data.questionBotPeriods ?? {}) as Record<string, number>;
  const periodUsed =
    unitId && period ? Number(periods[periodKey(unitId, period)] ?? 0) : 0;

  return buildStatus(periodUsed, dailyUsed, periodLimit, teacherConfig.enabled);
}

export async function consumeQuestionBotQuota(
  studentUid: string,
  unitId: string,
  period: string,
): Promise<QuestionBotQuotaStatus> {
  if (!isAdminConfigured()) {
    return buildStatus(0, 0, QB_TURN_LIMIT_PER_PERIOD, true);
  }

  const teacherUid = await getStudentTeacherUid(studentUid);
  const teacherConfig = await getQuestionBotTeacherConfig(teacherUid);
  const periodLimit = teacherConfig.turnLimit;

  const db = await getAdminDb();
  const dateKey = todayKey();
  const globalRef = db.collection(QB_QUOTA_COLLECTION).doc(dateKey);
  const studentRef = globalRef.collection("students").doc(studentUid);
  const pk = periodKey(unitId, period);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(studentRef);
    const data = snap.data() ?? {};
    const dailyUsed = Number(data.questionBotTurns ?? 0);
    const periods = { ...((data.questionBotPeriods ?? {}) as Record<string, number>) };
    const periodUsed = Number(periods[pk] ?? 0);

    const status = buildStatus(periodUsed, dailyUsed, periodLimit, teacherConfig.enabled);
    if (!status.enabled) return status;

    periods[pk] = periodUsed + 1;
    tx.set(
      studentRef,
      {
        studentUid,
        date: dateKey,
        questionBotTurns: dailyUsed + 1,
        questionBotPeriods: periods,
        updatedAt: new Date(),
      },
      { merge: true },
    );

    return buildStatus(periodUsed + 1, dailyUsed + 1, periodLimit, teacherConfig.enabled);
  });
}
