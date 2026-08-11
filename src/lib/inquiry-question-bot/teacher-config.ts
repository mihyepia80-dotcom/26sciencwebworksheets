import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { QB_TURN_LIMIT_PER_PERIOD } from "./config";

export interface QuestionBotTeacherConfig {
  enabled: boolean;
  turnLimit: number;
  unitHints: Record<string, string>;
}

const DEFAULT_CONFIG: QuestionBotTeacherConfig = {
  enabled: true,
  turnLimit: QB_TURN_LIMIT_PER_PERIOD,
  unitHints: {},
};

export async function getQuestionBotTeacherConfig(
  teacherUid?: string,
): Promise<QuestionBotTeacherConfig> {
  if (!teacherUid || !isAdminConfigured()) return DEFAULT_CONFIG;

  const db = await getAdminDb();
  const snap = await db.collection("teachers").doc(teacherUid).get();
  const raw = snap.data()?.questionBotConfig as Partial<QuestionBotTeacherConfig> | undefined;
  if (!raw) return DEFAULT_CONFIG;

  return {
    enabled: raw.enabled !== false,
    turnLimit: Number(raw.turnLimit) > 0 ? Number(raw.turnLimit) : QB_TURN_LIMIT_PER_PERIOD,
    unitHints: raw.unitHints && typeof raw.unitHints === "object" ? raw.unitHints : {},
  };
}

export async function getStudentTeacherUid(studentUid: string): Promise<string | undefined> {
  if (!isAdminConfigured()) return undefined;
  const db = await getAdminDb();
  const snap = await db.collection("students").doc(studentUid).get();
  const uid = snap.data()?.teacherUid;
  return typeof uid === "string" && uid.trim() ? uid.trim() : undefined;
}

export function resolveUnitHint(config: QuestionBotTeacherConfig, unitId: string): string {
  return config.unitHints[unitId]?.trim() || unitId;
}
