import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";

const QUOTA_COLLECTION = "apiQuota";
const STUDENT_DAILY_LIMIT = 1;

export function getGlobalDailyLimit(): number {
  const parsed = Number(process.env.GEMINI_DAILY_LIMIT ?? "100");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface AiQuotaStatus {
  available: boolean;
  /** 학생 오늘 사용 횟수 */
  studentUsed: number;
  /** 학생 1일 한도 (1회) */
  studentLimit: number;
  /** 학생 남은 횟수 */
  studentRemaining: number;
  /** 전체 오늘 사용 횟수 */
  globalUsed: number;
  /** 전체 1일 한도 (100회) */
  globalLimit: number;
  /** 전체 남은 횟수 */
  globalRemaining: number;
  /** 비활성 사유 */
  reason?: "student" | "global" | null;
}

function buildStatus(
  studentUsed: number,
  globalUsed: number,
  globalLimit: number,
): AiQuotaStatus {
  const studentLimit = STUDENT_DAILY_LIMIT;
  const studentRemaining = Math.max(0, studentLimit - studentUsed);
  const globalRemaining = Math.max(0, globalLimit - globalUsed);

  let reason: AiQuotaStatus["reason"] = null;
  if (studentUsed >= studentLimit) reason = "student";
  else if (globalUsed >= globalLimit) reason = "global";

  return {
    available: studentRemaining > 0 && globalRemaining > 0,
    studentUsed,
    studentLimit,
    studentRemaining,
    globalUsed,
    globalLimit,
    globalRemaining,
    reason,
  };
}

export async function getAiQuotaStatus(studentUid?: string): Promise<AiQuotaStatus> {
  const globalLimit = getGlobalDailyLimit();

  if (!isAdminConfigured()) {
    return buildStatus(0, 0, globalLimit);
  }

  const db = getAdminDb();
  const dateKey = todayKey();
  const globalSnap = await db.collection(QUOTA_COLLECTION).doc(dateKey).get();
  const globalUsed = globalSnap.exists ? Number(globalSnap.data()?.count ?? 0) : 0;

  let studentUsed = 0;
  if (studentUid) {
    const studentSnap = await db
      .collection(QUOTA_COLLECTION)
      .doc(dateKey)
      .collection("students")
      .doc(studentUid)
      .get();
    studentUsed = studentSnap.exists ? Number(studentSnap.data()?.count ?? 0) : 0;
  }

  return buildStatus(studentUsed, globalUsed, globalLimit);
}

export async function consumeAiQuota(studentUid: string): Promise<AiQuotaStatus> {
  const globalLimit = getGlobalDailyLimit();

  if (!studentUid) {
    return buildStatus(STUDENT_DAILY_LIMIT, globalLimit, globalLimit);
  }

  if (!isAdminConfigured()) {
    return buildStatus(0, 0, globalLimit);
  }

  const db = getAdminDb();
  const dateKey = todayKey();
  const globalRef = db.collection(QUOTA_COLLECTION).doc(dateKey);
  const studentRef = globalRef.collection("students").doc(studentUid);

  return db.runTransaction(async (tx) => {
    const [globalSnap, studentSnap] = await Promise.all([tx.get(globalRef), tx.get(studentRef)]);

    const globalUsed = globalSnap.exists ? Number(globalSnap.data()?.count ?? 0) : 0;
    const studentUsed = studentSnap.exists ? Number(studentSnap.data()?.count ?? 0) : 0;
    const status = buildStatus(studentUsed, globalUsed, globalLimit);

    if (!status.available) {
      return status;
    }

    const nextGlobal = globalUsed + 1;
    const nextStudent = studentUsed + 1;

    tx.set(
      globalRef,
      { count: nextGlobal, date: dateKey, updatedAt: new Date() },
      { merge: true },
    );
    tx.set(
      studentRef,
      { count: nextStudent, studentUid, date: dateKey, updatedAt: new Date() },
      { merge: true },
    );

    return buildStatus(nextStudent, nextGlobal, globalLimit);
  });
}
