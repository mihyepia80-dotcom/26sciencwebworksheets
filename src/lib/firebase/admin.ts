import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

function loadServiceAccount(): ServiceAccount | null {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    return JSON.parse(json) as ServiceAccount;
  }

  const keyPath = join(process.cwd(), "firebase-service-account.json");
  if (existsSync(keyPath)) {
    return JSON.parse(readFileSync(keyPath, "utf8")) as ServiceAccount;
  }

  return null;
}

export function getAdminDb() {
  if (!getApps().length) {
    const account = loadServiceAccount();
    if (!account) {
      throw new Error("Firebase Admin 서비스 계정이 설정되지 않았습니다.");
    }
    initializeApp({ credential: cert(account) });
  }
  return getFirestore();
}

export function isAdminConfigured(): boolean {
  return loadServiceAccount() !== null;
}
