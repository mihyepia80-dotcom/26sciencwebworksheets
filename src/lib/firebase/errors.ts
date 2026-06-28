const AUTH_ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-credential": "학번 또는 암호가 올바르지 않습니다.",
  "auth/wrong-password": "암호가 올바르지 않습니다.",
  "auth/weak-password": "암호 형식이 올바르지 않습니다. 선생님께 문의하세요.",
  "auth/user-not-found": "계정을 찾을 수 없습니다. 정보를 확인해 주세요.",
  "auth/email-already-in-use": "이미 등록된 학생입니다. 다시 로그인해 주세요.",
  "auth/operation-not-allowed": "Firebase에서 이메일/비밀번호 로그인을 활성화해 주세요.",
  "auth/popup-closed-by-user": "로그인 창이 닫혔습니다.",
  "auth/popup-blocked": "팝업이 차단되었습니다. 브라우저 설정을 확인해 주세요.",
  "auth/unauthorized-domain": "이 사이트 주소가 Firebase 승인 도메인에 없습니다. Firebase Console → Authentication → Settings → Authorized domains에 현재 주소를 추가해 주세요.",
  "auth/internal-error": "Firebase 인증 오류입니다. 이메일/비밀번호 로그인이 켜져 있는지, 승인 도메인이 등록됐는지 확인해 주세요.",
  "auth/account-exists-with-different-credential": "다른 방식으로 가입된 계정입니다. 학생 로그인을 먼저 로그아웃한 뒤 다시 시도해 주세요.",
  "auth/network-request-failed": "네트워크 오류입니다. 인터넷 연결을 확인해 주세요.",
  "permission-denied": "Firestore 권한이 없습니다. Firebase 규칙 배포(`npm run deploy:firestore`)를 확인해 주세요.",
  "failed-precondition": "Firestore 색인이 필요합니다. Firebase Console에서 색인을 생성하거나 deploy:firestore를 실행하세요.",
};

export function getFirebaseErrorCode(error: unknown): string | undefined {
  if (error && typeof error === "object" && "code" in error) {
    return String((error as { code?: string }).code);
  }
  if (error instanceof Error && (error as Error & { code?: string }).code) {
    return (error as Error & { code?: string }).code;
  }
  return undefined;
}

export function getFirebaseErrorMessage(error: unknown, fallback = "요청에 실패했습니다."): string {
  const code = getFirebaseErrorCode(error);

  if (code === "auth/unauthorized-domain") {
    const host = typeof window !== "undefined" ? window.location.hostname : "";
    const base = AUTH_ERROR_MESSAGES[code];
    return host ? `${base}\n\n추가할 도메인: ${host}` : base;
  }
  if (code && AUTH_ERROR_MESSAGES[code]) return AUTH_ERROR_MESSAGES[code];

  if (error instanceof Error) {
    if (error.message.includes("missing initial state")) {
      return "로그인 세션이 끊겼습니다. 다시 로그인해 주세요.";
    }
    return error.message || fallback;
  }
  return fallback;
}

/** 학생 화면용 — Firebase 기술 메시지를 숨깁니다. */
export function getStudentFirebaseErrorMessage(error: unknown, fallback = "잠시 후 다시 시도해 주세요."): string {
  if (error instanceof Error) {
    const code = (error as Error & { code?: string }).code;
    if (code === "failed-precondition" || code === "permission-denied") return fallback;
  }
  const msg = getFirebaseErrorMessage(error, fallback);
  if (msg.includes("Firestore") || msg.includes("deploy:") || msg.includes("Firebase Console")) {
    return fallback;
  }
  return msg;
}

/** 교사 모둠 활동 등 — 기술적 Firestore 안내를 짧은 문구로 바꿉니다. */
export function getTeacherFirebaseErrorMessage(error: unknown, fallback = "요청에 실패했습니다."): string {
  const code = getFirebaseErrorCode(error);
  if (code === "permission-denied") {
    return "데이터를 불러올 권한이 없습니다. 교사 로그아웃 후 다시 로그인해 주세요.";
  }
  if (code === "failed-precondition") {
    return "데이터 조회 설정이 필요합니다. 잠시 후 다시 시도해 주세요.";
  }
  const msg = getFirebaseErrorMessage(error, fallback);
  if (msg.includes("Firestore") || msg.includes("deploy:") || msg.includes("Firebase Console")) {
    return fallback;
  }
  return msg;
}
