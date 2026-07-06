import type { ServiceAccount } from "firebase-admin/app";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";

type AdminModule = {
  db: Firestore;
  auth: Auth;
};

function unwrapQuotedJson(raw: string): string {
  let value = raw.trim();
  for (let i = 0; i < 3; i += 1) {
    if (!value.startsWith('"') || !value.endsWith('"')) break;
    try {
      const inner = JSON.parse(value);
      if (typeof inner !== "string") break;
      value = inner.trim();
    } catch {
      break;
    }
  }
  return value;
}

function decodeServiceAccountRaw(raw: string): string {
  let trimmed = unwrapQuotedJson(raw);
  if (trimmed.startsWith("{")) return trimmed;

  try {
    const decoded = Buffer.from(trimmed, "base64").toString("utf8").trim();
    if (decoded.startsWith("{")) return unwrapQuotedJson(decoded);
  } catch {
    // not base64
  }

  return trimmed;
}

function normalizeServiceAccount(raw: Record<string, unknown>): Record<string, unknown> {
  const privateKey = raw.privateKey ?? raw.private_key;
  if (typeof privateKey === "string" && privateKey.includes("\\n")) {
    const fixed = privateKey.replace(/\\n/g, "\n");
    if (typeof raw.privateKey === "string") {
      return { ...raw, privateKey: fixed };
    }
    return { ...raw, private_key: fixed };
  }
  return raw;
}

function hasRequiredServiceAccountFields(account: Record<string, unknown>): boolean {
  const privateKey = account.privateKey ?? account.private_key;
  const clientEmail = account.clientEmail ?? account.client_email;
  const projectId = account.projectId ?? account.project_id;
  return (
    typeof privateKey === "string" &&
    privateKey.length > 0 &&
    typeof clientEmail === "string" &&
    clientEmail.length > 0 &&
    typeof projectId === "string" &&
    projectId.length > 0
  );
}

function parseServiceAccountJson(raw: string): ServiceAccount | null {
  try {
    const parsed = normalizeServiceAccount(JSON.parse(decodeServiceAccountRaw(raw)) as Record<string, unknown>);
    if (!hasRequiredServiceAccountFields(parsed)) {
      console.error("Firebase Admin 서비스 계정 JSON에 필수 필드가 없습니다.");
      return null;
    }
    return parsed as ServiceAccount;
  } catch {
    console.error("Firebase Admin 서비스 계정 JSON 파싱에 실패했습니다.");
    return null;
  }
}

function loadServiceAccount(): ServiceAccount | null {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!json) return null;
  return parseServiceAccountJson(json);
}

let adminModulePromise: Promise<AdminModule> | null = null;

async function loadAdminModule(): Promise<AdminModule> {
  if (!adminModulePromise) {
    adminModulePromise = (async () => {
      try {
        const account = loadServiceAccount();
        if (!account) {
          throw new Error(
            "Firebase Admin 서비스 계정이 설정되지 않았습니다. Vercel 환경 변수 FIREBASE_SERVICE_ACCOUNT_JSON을 확인하세요.",
          );
        }

        const { cert, getApps, initializeApp } = await import("firebase-admin/app");
        if (!getApps().length) {
          initializeApp({ credential: cert(account) });
        }

        const { getFirestore } = await import("firebase-admin/firestore");
        const { getAuth } = await import("firebase-admin/auth");
        return { db: getFirestore(), auth: getAuth() };
      } catch (error) {
        adminModulePromise = null;
        throw error;
      }
    })();
  }

  return adminModulePromise;
}

export async function getAdminDb(): Promise<Firestore> {
  return (await loadAdminModule()).db;
}

export async function getAdminAuth(): Promise<Auth> {
  return (await loadAdminModule()).auth;
}

export async function adminServerTimestamp() {
  const { FieldValue } = await import("firebase-admin/firestore");
  return FieldValue.serverTimestamp();
}

export function isAdminConfigured(): boolean {
  return loadServiceAccount() !== null;
}

export async function verifyAdminConnection(): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isAdminConfigured()) {
    return { ok: false, error: "FIREBASE_SERVICE_ACCOUNT_JSON 미설정 또는 JSON 형식 오류" };
  }

  try {
    const db = await getAdminDb();
    await db.collection("teachers").limit(1).get();
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Firebase Admin 연결 실패";
    return { ok: false, error: message };
  }
}
