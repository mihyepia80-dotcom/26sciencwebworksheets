function looksLikeHtml(text: string): boolean {
  const trimmed = text.trimStart();
  return trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html") || trimmed.startsWith("<!");
}

function tryParseJson<T extends Record<string, unknown>>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function extractErrorMessage(payload: Record<string, unknown>): string | undefined {
  const error = payload.error;
  if (typeof error === "string" && error.trim()) return error;
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message?: unknown }).message ?? "").trim();
    if (message) return message;
  }
  return undefined;
}

export async function parseApiJsonResponse<T extends Record<string, unknown>>(
  response: Response,
  htmlFallbackMessage: string,
): Promise<T> {
  const text = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  const parsed = tryParseJson<T>(text);

  if (parsed) {
    const protection = parsed.protection as { vercel_auth_enabled?: boolean } | undefined;
    if (protection?.vercel_auth_enabled) {
      throw new Error(
        "Vercel 배포 보호(Deployment Protection) 때문에 API에 접근할 수 없습니다. Vercel 프로젝트 설정에서 Production 보호를 끄거나, 학생·교사가 접속할 공개 URL을 사용해 주세요.",
      );
    }
    const nestedError = extractErrorMessage(parsed);
    if (!response.ok && nestedError) {
      throw new Error(nestedError);
    }
    return parsed;
  }

  if (looksLikeHtml(text)) {
    if (text.includes("Internal Server Error") || text.includes("500")) {
      throw new Error(
        "서버 API 오류(500)입니다. Vercel 환경 변수 FIREBASE_SERVICE_ACCOUNT_JSON 설정 후 재배포했는지 확인해 주세요.",
      );
    }
    throw new Error(htmlFallbackMessage);
  }

  if (!contentType.includes("application/json")) {
    throw new Error("서버 응답 형식이 올바르지 않습니다. 잠시 후 다시 시도해 주세요.");
  }

  throw new Error("서버 응답을 처리할 수 없습니다. 잠시 후 다시 시도해 주세요.");
}
