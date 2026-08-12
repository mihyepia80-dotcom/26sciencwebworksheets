import type { TeacherApiStatus } from "@/lib/teacher/api-config";
import { parseApiJsonResponse } from "@/lib/api/parse-json-response";

type ApiStatusPayload = TeacherApiStatus & Record<string, unknown>;

export async function fetchTeacherApiStatus(idToken: string): Promise<TeacherApiStatus> {
  const response = await fetch("/api/teacher/api-config", {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  const payload = await parseApiJsonResponse<ApiStatusPayload>(
    response,
    "API 연동 상태를 불러오지 못했습니다.",
  );
  return payload;
}

export async function saveTeacherApiConfig(
  idToken: string,
  input: { geminiApiKey?: string | null; padletApiKey?: string | null },
): Promise<TeacherApiStatus & { ok?: boolean }> {
  const response = await fetch("/api/teacher/api-config", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(input),
  });
  return parseApiJsonResponse<ApiStatusPayload & { ok?: boolean }>(
    response,
    "API 키 저장에 실패했습니다.",
  );
}
