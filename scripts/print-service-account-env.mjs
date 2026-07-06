import { existsSync, readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const keyPath = join(root, "firebase-service-account.json");

if (!existsSync(keyPath)) {
  console.error("firebase-service-account.json 파일이 없습니다.");
  console.error("Firebase Console → 서비스 계정 → 새 비공개 키 생성 후 프로젝트 루트에 저장하세요.");
  process.exit(1);
}

const json = readFileSync(keyPath, "utf8").trim();
JSON.parse(json);

console.log("Vercel Dashboard → Settings → Environment Variables");
console.log("(.env 파일이 아닌 Vercel 환경 변수에만 입력)");
console.log("이름: FIREBASE_SERVICE_ACCOUNT_JSON");
console.log("값(한 줄 JSON, 아래 전체 복사):");
console.log("");
console.log(json);
