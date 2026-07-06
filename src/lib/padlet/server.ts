import { PadletApiError, parsePadletErrorMessage } from "@/lib/padlet/errors";
import { PADLET_DEFAULT_ROLE } from "@/lib/padlet/presets";
import type { PadletBoardSummary, PadletPostInput, PadletPostSummary, PadletRecipeBoardStatus } from "@/lib/padlet/types";

const PADLET_API_BASE = "https://api.padlet.dev/v1";

function getPadletApiKey(): string | null {
  const key = process.env.PADLET_API_KEY?.trim();
  return key || null;
}

export function isPadletConfigured(): boolean {
  return getPadletApiKey() !== null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function padletRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey = getPadletApiKey();
  if (!apiKey) {
    throw new PadletApiError(
      "Padlet API 키가 설정되지 않았습니다. Vercel 환경 변수 PADLET_API_KEY를 확인해 주세요.",
      503,
    );
  }

  const response = await fetch(`${PADLET_API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      "X-Api-Key": apiKey,
      ...(init?.headers ?? {}),
    },
  });

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const fallback = `Padlet API 오류 (${response.status})`;
    throw new PadletApiError(parsePadletErrorMessage(payload, fallback), response.status);
  }

  return payload as T;
}

function mapBoard(raw: Record<string, unknown>): PadletBoardSummary {
  const attributes = (raw.attributes ?? {}) as Record<string, unknown>;
  const webUrl = (attributes.webUrl ?? {}) as Record<string, unknown>;
  return {
    id: String(raw.id ?? ""),
    title: String(attributes.title ?? "제목 없음"),
    description: String(attributes.description ?? ""),
    webUrl: String(webUrl.live ?? ""),
    qrCodeUrl: String(webUrl.qrCode ?? ""),
    slideshowUrl: String(webUrl.slideshow ?? ""),
    createdAt: attributes.createdAt ? String(attributes.createdAt) : undefined,
    updatedAt: attributes.updatedAt ? String(attributes.updatedAt) : undefined,
  };
}

function extractStatusKey(statusUrl: string): string {
  const trimmed = statusUrl.trim();
  if (!trimmed) return "";
  const parts = trimmed.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? trimmed;
}

interface AiRecipeBoardCreationResponse {
  data?: {
    id?: string;
    attributes?: {
      statusUrl?: string;
    };
  };
}

interface AiRecipeBoardStatusResponse {
  data?: {
    attributes?: {
      status?: PadletRecipeBoardStatus;
      board?: Record<string, unknown>;
    };
  };
}

interface BoardResponse {
  data?: Record<string, unknown>;
}

interface PostResponse {
  data?: Record<string, unknown>;
}

export async function createAiRecipeBoard(input: {
  instructions: string;
  role?: string;
  workspaceId?: string;
}): Promise<{ statusKey: string; statusUrl: string }> {
  const attributes: Record<string, string> = {
    boardCreationInstructions: input.instructions,
    role: input.role?.trim() || process.env.PADLET_DEFAULT_ROLE?.trim() || PADLET_DEFAULT_ROLE,
  };
  const workspaceId = input.workspaceId?.trim() || process.env.PADLET_DEFAULT_WORKSPACE_ID?.trim();
  if (workspaceId) attributes.workspaceId = workspaceId;

  const payload = await padletRequest<AiRecipeBoardCreationResponse>("/ai-recipe-boards", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "ai_recipe_board",
        attributes,
      },
    }),
  });

  const statusUrl = String(payload.data?.attributes?.statusUrl ?? "");
  const statusKey = extractStatusKey(statusUrl) || String(payload.data?.id ?? "");
  if (!statusKey) {
    throw new PadletApiError("Padlet 생성 상태 URL을 받지 못했습니다.", 502);
  }
  return { statusKey, statusUrl };
}

export async function getAiRecipeBoardStatus(statusKey: string): Promise<{
  status: PadletRecipeBoardStatus;
  board?: PadletBoardSummary;
}> {
  const payload = await padletRequest<AiRecipeBoardStatusResponse>(
    `/ai-recipe-boards/status/${encodeURIComponent(statusKey)}`,
  );
  const attributes = payload.data?.attributes;
  const status = attributes?.status ?? "in_progress";
  const boardRaw = attributes?.board;
  return {
    status,
    board: boardRaw ? mapBoard(boardRaw) : undefined,
  };
}

export async function waitForAiRecipeBoard(
  statusKey: string,
  timeoutMs = 120_000,
  intervalMs = 3_000,
): Promise<PadletBoardSummary> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const result = await getAiRecipeBoardStatus(statusKey);
    if (result.status === "success" && result.board) return result.board;
    if (result.status === "failed") {
      throw new PadletApiError("패들렛 AI 생성에 실패했습니다.", 502);
    }
    await sleep(intervalMs);
  }
  throw new PadletApiError("패들렛 생성 시간이 초과되었습니다. 잠시 후 상태 조회를 다시 시도해 주세요.", 504);
}

export async function getBoardById(boardId: string): Promise<PadletBoardSummary> {
  const payload = await padletRequest<BoardResponse>(`/boards/${encodeURIComponent(boardId)}`);
  if (!payload.data) {
    throw new PadletApiError("패들렛 게시판을 찾을 수 없습니다.", 404);
  }
  return mapBoard(payload.data);
}

export async function createBoardPost(boardId: string, input: PadletPostInput): Promise<PadletPostSummary> {
  const subject = String(input.subject ?? "").trim();
  const body = String(input.body ?? "").trim();
  const attachmentUrl = String(input.attachmentUrl ?? "").trim();
  if (!subject && !body && !attachmentUrl) {
    throw new PadletApiError("게시글 subject, body, attachmentUrl 중 하나 이상이 필요합니다.", 400);
  }

  const content: Record<string, unknown> = {};
  if (subject) content.subject = subject;
  if (body) content.body = body;
  if (attachmentUrl) {
    content.attachment = {
      url: attachmentUrl,
      caption: String(input.attachmentCaption ?? "").trim() || undefined,
    };
  }

  const attributes: Record<string, unknown> = { content };
  if (input.color) attributes.color = input.color;

  const payload = await padletRequest<PostResponse>(`/boards/${encodeURIComponent(boardId)}/posts`, {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "post",
        attributes,
      },
    }),
  });

  if (!payload.data) {
    throw new PadletApiError("게시글 생성 응답을 처리할 수 없습니다.", 502);
  }

  const postAttributes = (payload.data.attributes ?? {}) as Record<string, unknown>;
  const postContent = (postAttributes.content ?? {}) as Record<string, unknown>;
  return {
    id: String(payload.data.id ?? ""),
    subject: String(postContent.subject ?? ""),
    body: String(postContent.body ?? ""),
  };
}
