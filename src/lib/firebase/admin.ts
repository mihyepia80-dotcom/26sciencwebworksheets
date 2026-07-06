import type { ServiceAccount } from "firebase-admin/app";
import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";

type AdminModule = {
  db: Firestore;
  auth: Auth;
};

function decodeServiceAccountRaw(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) return trimmed;

  try {
    const decoded = Buffer.from(trimmed, "base64").toString("utf8").trim();
    if (decoded.startsWith("{")) return decoded;
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

function parseServiceAccountJson(raw: string): ServiceAccount | null {
  try {
    const parsed = normalizeServiceAccount(JSON.parse(decodeServiceAccountRaw(raw)) as Record<string, unknown>);
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
