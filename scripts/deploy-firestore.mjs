import { spawnSync } from "child_process";
import { existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const keyPath = join(root, "firebase-service-account.json");
const projectId = "scienceworksheets-3ae8e";

if (!existsSync(keyPath)) {
  console.error("firebase-service-account.json 파일이 없습니다.");
  console.error("Firebase Console → 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성");
  console.error("다운로드한 JSON을 프로젝트 루트에 firebase-service-account.json 으로 저장하세요.");
  process.exit(1);
}

process.env.GOOGLE_APPLICATION_CREDENTIALS = keyPath;

const only = process.argv[2] ?? "firestore";
const args = [
  "firebase-tools",
  "deploy",
  "--only",
  only,
  "--project",
  projectId,
  "--non-interactive",
];

console.log(`firebase deploy --only ${only} --project ${projectId} --non-interactive`);

const result = spawnSync("npx", args, { stdio: "inherit", shell: true, cwd: root });

process.exit(result.status ?? 1);
