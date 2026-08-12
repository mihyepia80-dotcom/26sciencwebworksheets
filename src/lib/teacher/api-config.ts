import { FieldValue } from "firebase-admin/firestore";
import { isPlatformAdmin, getPlatformGeminiApiKey, getPlatformPadletApiKey } from "@/lib/auth/platform-admin";
import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";

const SECRETS_COLLECTION = "teacherApiSecrets";

export type ApiKeySource = "platform" | "teacher" | "none";

export interface TeacherApiSecrets {
  geminiApiKey?: string;
  padletApiKey?: string;
  geminiUpdatedAt?: Date;
  padletUpdatedAt?: Date;
}

export interface TeacherApiStatus {
  isPlatformAdmin: boolean;
  gemini: { configured: boolean; source: ApiKeySource };
  padlet: { configured: boolean; source: ApiKeySource };
}

async function readTeacherSecrets(teacherUid: string): Promise<TeacherApiSecrets | null> {
  if (!isAdminConfigured()) return null;
  const db = await getAdminDb();
  const snap = await db.collection(SECRETS_COLLECTION).doc(teacherUid).get();
  if (!snap.exists) return null;
  const data = snap.data() ?? {};
  return {
    geminiApiKey: typeof data.geminiApiKey === "string" ? data.geminiApiKey.trim() : undefined,
    padletApiKey: typeof data.padletApiKey === "string" ? data.padletApiKey.trim() : undefined,
  };
}

export async function getTeacherApiStatus(teacherUid: string, email?: string | null): Promise<TeacherApiStatus> {
  const admin = isPlatformAdmin(teacherUid, email);
  const secrets = await readTeacherSecrets(teacherUid);

  const teacherGemini = Boolean(secrets?.geminiApiKey);
  const teacherPadlet = Boolean(secrets?.padletApiKey);
  const platformGemini = Boolean(getPlatformGeminiApiKey());
  const platformPadlet = Boolean(getPlatformPadletApiKey());

  let geminiSource: ApiKeySource = "none";
  if (admin && platformGemini) geminiSource = "platform";
  else if (teacherGemini) geminiSource = "teacher";

  let padletSource: ApiKeySource = "none";
  if (admin && platformPadlet) padletSource = "platform";
  else if (teacherPadlet) padletSource = "teacher";

  return {
    isPlatformAdmin: admin,
    gemini: { configured: geminiSource !== "none", source: geminiSource },
    padlet: { configured: padletSource !== "none", source: padletSource },
  };
}

export async function saveTeacherApiSecrets(
  teacherUid: string,
  input: { geminiApiKey?: string | null; padletApiKey?: string | null },
): Promise<void> {
  if (!isAdminConfigured()) throw new Error("서버 설정이 필요합니다.");
  const db = await getAdminDb();
  const ref = db.collection(SECRETS_COLLECTION).doc(teacherUid);
  const patch: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };

  if (input.geminiApiKey !== undefined) {
    const trimmed = input.geminiApiKey?.trim() ?? "";
    if (trimmed) {
      patch.geminiApiKey = trimmed;
      patch.geminiUpdatedAt = FieldValue.serverTimestamp();
    } else {
      patch.geminiApiKey = FieldValue.delete();
      patch.geminiUpdatedAt = FieldValue.delete();
    }
  }

  if (input.padletApiKey !== undefined) {
    const trimmed = input.padletApiKey?.trim() ?? "";
    if (trimmed) {
      patch.padletApiKey = trimmed;
      patch.padletUpdatedAt = FieldValue.serverTimestamp();
    } else {
      patch.padletApiKey = FieldValue.delete();
      patch.padletUpdatedAt = FieldValue.delete();
    }
  }

  await ref.set(patch, { merge: true });
}

export async function resolveGeminiApiKeyForTeacher(
  teacherUid: string,
  email?: string | null,
): Promise<{ key: string; source: Exclude<ApiKeySource, "none"> } | null> {
  if (isPlatformAdmin(teacherUid, email)) {
    const platform = getPlatformGeminiApiKey();
    if (platform) return { key: platform, source: "platform" };
  }

  const secrets = await readTeacherSecrets(teacherUid);
  if (secrets?.geminiApiKey) return { key: secrets.geminiApiKey, source: "teacher" };
  return null;
}

export async function resolvePadletApiKeyForTeacher(
  teacherUid: string,
  email?: string | null,
): Promise<{ key: string; source: Exclude<ApiKeySource, "none"> } | null> {
  if (isPlatformAdmin(teacherUid, email)) {
    const platform = getPlatformPadletApiKey();
    if (platform) return { key: platform, source: "platform" };
  }

  const secrets = await readTeacherSecrets(teacherUid);
  if (secrets?.padletApiKey) return { key: secrets.padletApiKey, source: "teacher" };
  return null;
}

export async function resolveGeminiApiKeyForStudent(studentUid: string): Promise<string | null> {
  if (!isAdminConfigured()) return null;
  const db = await getAdminDb();
  const snap = await db.collection("students").doc(studentUid).get();
  const teacherUid = typeof snap.data()?.teacherUid === "string" ? snap.data()!.teacherUid.trim() : "";
  if (!teacherUid) return null;

  const teacherSnap = await db.collection("teachers").doc(teacherUid).get();
  const email = typeof teacherSnap.data()?.email === "string" ? teacherSnap.data()!.email : undefined;
  const resolved = await resolveGeminiApiKeyForTeacher(teacherUid, email);
  return resolved?.key ?? null;
}
