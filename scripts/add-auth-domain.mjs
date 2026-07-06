import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { GoogleAuth } from "google-auth-library";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const keyPath = join(root, "firebase-service-account.json");
const projectId = "scienceworksheets-3ae8e";

/** Vercel 프로덕션 + 로컬 개발용 */
const DOMAINS_TO_ENSURE = [
  "localhost",
  "127.0.0.1",
  "sagodogu-toktok.vercel.app",
  "sagodogu-toktok-mihyepia-s-projects.vercel.app",
  "scienceworksheets-3ae8e.firebaseapp.com",
  "scienceworksheets-3ae8e.web.app",
];

const configUrl = `https://identitytoolkit.googleapis.com/admin/v2/projects/${projectId}/config`;

async function getAccessToken() {
  if (!existsSync(keyPath)) {
    throw new Error("firebase-service-account.json 이 없습니다.");
  }
  const auth = new GoogleAuth({
    keyFile: keyPath,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  if (!token.token) throw new Error("액세스 토큰을 발급하지 못했습니다.");
  return token.token;
}

async function main() {
  const extra = process.argv.slice(2).filter(Boolean);
  const toEnsure = [...new Set([...DOMAINS_TO_ENSURE, ...extra])];

  const token = await getAccessToken();
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  const getRes = await fetch(configUrl, { headers });
  if (!getRes.ok) {
    const body = await getRes.text();
    throw new Error(`설정 조회 실패 (${getRes.status}): ${body}`);
  }

  const current = await getRes.json();
  const existing = Array.isArray(current.authorizedDomains) ? current.authorizedDomains : [];
  const merged = [...new Set([...existing, ...toEnsure])];
  const added = merged.filter((d) => !existing.includes(d));

  if (added.length === 0) {
    console.log("추가할 도메인이 없습니다. 이미 모두 등록되어 있습니다.");
    console.log("현재 승인 도메인:", merged.join(", "));
    return;
  }

  const patchRes = await fetch(`${configUrl}?updateMask=authorizedDomains`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ authorizedDomains: merged }),
  });

  if (!patchRes.ok) {
    const body = await patchRes.text();
    throw new Error(`도메인 등록 실패 (${patchRes.status}): ${body}`);
  }

  console.log("Firebase 승인 도메인을 추가했습니다:");
  for (const domain of added) console.log(`  + ${domain}`);
  console.log("\n전체 목록:", merged.join(", "));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  console.error("\n수동 등록: Firebase Console → Authentication → Settings → Authorized domains");
  process.exit(1);
});
