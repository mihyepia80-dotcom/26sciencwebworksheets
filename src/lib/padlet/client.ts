import { parseApiJsonResponse } from "@/lib/api/parse-json-response";
import type {
  PadletBoardSummary,
  PadletCreateBoardRequest,
  PadletCreateBoardResponse,
  PadletPostInput,
  PadletPostSummary,
  PadletRecipeBoardStatus,
} from "@/lib/padlet/types";
import type { PublishRequest, PublishResponse } from "@/lib/padlet/publish-types";

async function teacherPadletFetch<T extends Record<string, unknown>>(
  idToken: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
      ...(init?.headers ?? {}),
    },
  });

  return parseApiJsonResponse<T>(
    response,
    "Padlet API 연결에 문제가 있습니다. Vercel PADLET_API_KEY 설정과 배포 URL을 확인해 주세요.",
  );
}

export async function fetchPadletStatus(idToken: string): Promise<{ configured: boolean }> {
  const payload = await teacherPadletFetch(idToken, "/api/padlet/status");
  return { configured: Boolean(payload.configured) };
}

export async function createPadletBoard(
  idToken: string,
  input: PadletCreateBoardRequest,
): Promise<PadletCreateBoardResponse> {
  const response = await fetch("/api/padlet/boards", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(input),
  });
  const payload = await parseApiJsonResponse(
    response,
    "Padlet API 연결에 문제가 있습니다. Vercel PADLET_API_KEY 설정을 확인해 주세요.",
  );
  if (!response.ok) {
    const error = typeof payload.error === "string" ? payload.error : "패들렛 생성에 실패했습니다.";
    throw new Error(error);
  }
  return payload as unknown as PadletCreateBoardResponse;
}

export async function getPadletBoardStatus(
  idToken: string,
  statusKey: string,
): Promise<{ status: PadletRecipeBoardStatus; board?: PadletBoardSummary }> {
  const response = await fetch(`/api/padlet/boards/status/${encodeURIComponent(statusKey)}`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  const payload = await parseApiJsonResponse(response, "Padlet 상태 조회에 실패했습니다.");
  if (!response.ok) {
    const error = typeof payload.error === "string" ? payload.error : "패들렛 상태 조회에 실패했습니다.";
    throw new Error(error);
  }
  return {
    status: payload.status as PadletRecipeBoardStatus,
    board: payload.board as PadletBoardSummary | undefined,
  };
}

export async function fetchPadletBoard(idToken: string, boardId: string): Promise<PadletBoardSummary> {
  const response = await fetch(`/api/padlet/boards/${encodeURIComponent(boardId)}`, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  const payload = await parseApiJsonResponse(response, "패들렛 게시판 조회에 실패했습니다.");
  if (!response.ok || !payload.board) {
    const error = typeof payload.error === "string" ? payload.error : "패들렛 게시판 조회에 실패했습니다.";
    throw new Error(error);
  }
  return payload.board as PadletBoardSummary;
}

export async function createPadletPost(
  idToken: string,
  boardId: string,
  input: PadletPostInput,
): Promise<PadletPostSummary> {
  const response = await fetch(`/api/padlet/boards/${encodeURIComponent(boardId)}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(input),
  });
  const payload = await parseApiJsonResponse(response, "패들렛 게시글 작성에 실패했습니다.");
  if (!response.ok || !payload.post) {
    const error = typeof payload.error === "string" ? payload.error : "패들렛 게시글 작성에 실패했습니다.";
    throw new Error(error);
  }
  return payload.post as PadletPostSummary;
}

async function memberPadletFetch<T extends Record<string, unknown>>(
  idToken: string,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
      ...(init?.headers ?? {}),
    },
  });
  return parseApiJsonResponse<T>(response, "패들렛 요청에 실패했습니다.");
}

export async function publishToPadlet(
  idToken: string,
  input: PublishRequest,
): Promise<PublishResponse> {
  const payload = await memberPadletFetch<Record<string, unknown>>(
    idToken,
    "/api/padlet/publish",
    { method: "POST", body: JSON.stringify(input) },
  );
  return payload as unknown as PublishResponse;
}

export async function fetchMyPadletBoard(
  idToken: string,
  params: { grade: number; classNo: number; period: number; unitId?: string },
): Promise<{
  board: {
    boardDocId: string;
    boardUrl: string;
    title: string;
    publishOpen: boolean;
    allowRepublish: boolean;
    myPosts: Array<{ period: number; status: string; postUrl: string | null }>;
  } | null;
}> {
  const q = new URLSearchParams({
    grade: String(params.grade),
    classNo: String(params.classNo),
    period: String(params.period),
  });
  if (params.unitId) q.set("unitId", params.unitId);
  return memberPadletFetch(idToken, `/api/padlet/boards/mine?${q.toString()}`);
}
