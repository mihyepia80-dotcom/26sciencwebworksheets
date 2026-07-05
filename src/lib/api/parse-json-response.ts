export async function parseApiJsonResponse<T extends Record<string, unknown>>(
  response: Response,
  htmlFallbackMessage: string,
): Promise<T> {
  const text = await response.text();
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    if (text.trimStart().startsWith("<!DOCTYPE") || text.trimStart().startsWith("<html")) {
      throw new Error(htmlFallbackMessage);
    }
    throw new Error("서버 응답 형식이 올바르지 않습니다. 잠시 후 다시 시도해 주세요.");
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("서버 응답을 처리할 수 없습니다. 잠시 후 다시 시도해 주세요.");
  }
}
