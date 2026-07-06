import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

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

function normalizeServiceAccount(account: ServiceAccount): ServiceAccount {
  const privateKey = account.privateKey;
  if (typeof privateKey === "string" && privateKey.includes("\\n")) {
    return { ...account, privateKey: privateKey.replace(/\\n/g, "\n") };
  }
  return account;
}

function parseServiceAccountJson(raw: string): ServiceAccount | null {
  try {
    const parsed = JSON.parse(decodeServiceAccountRaw(raw)) as ServiceAccount;
    return normalizeServiceAccount(parsed);
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

export function getAdminDb() {
  if (!getApps().length) {
    const account = loadServiceAccount();
    if (!account) {
      throw new Error(
        "Firebase Admin 서비스 계정이 설정되지 않았습니다. Vercel 환경 변수 FIREBASE_SERVICE_ACCOUNT_JSON을 확인하세요.",
      );
    }
    initializeApp({ credential: cert(account) });
  }
  return getFirestore();
}

export function getAdminAuth() {
  getAdminDb();
  return getAuth();
}

export function isAdminConfigured(): boolean {
  return loadServiceAccount() !== null;
}
