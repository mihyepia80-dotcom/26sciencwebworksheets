import { PadletApiError, parsePadletErrorMessage } from "@/lib/padlet/errors";
import { buildColumnLabels, PADLET_DEFAULT_ROLE, PADLET_PASTEL_POST_COLORS, type PadletBulletinColumnMode } from "@/lib/padlet/presets";
import type {
  PadletBoardSummary,
  PadletPostColor,
  PadletPostInput,
  PadletPostSummary,
  PadletRecipeBoardStatus,
} from "@/lib/padlet/types";

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

interface GetBoardResponse {
  data?: Record<string, unknown>;
  included?: Array<{
    type: string;
    id: string;
    attributes?: Record<string, unknown>;
  }>;
}

export async function getBoardSections(boardId: string): Promise<Array<{ id: string; title: string }>> {
  const payload = await padletRequest<GetBoardResponse>(
    `/boards/${encodeURIComponent(boardId)}?include=sections`,
  );
  const included = payload.included ?? [];
  return included
    .filter((item) => item.type === "section")
    .map((item) => {
      const attrs = item.attributes ?? {};
      const title = String(attrs.title ?? attrs.name ?? attrs.label ?? "").trim();
      return { id: item.id, title };
    });
}

export async function seedBulletinColumnPosts(
  boardId: string,
  columnMode: PadletBulletinColumnMode,
  topic: string,
): Promise<{ columnsApplied: number; columnLabels: string[] }> {
  const labels = buildColumnLabels(columnMode);
  const sections = await getBoardSections(boardId);
  let applied = 0;

  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    const matched =
      sections.find((section) => section.title.includes(label) || section.title.includes(String(i + 1))) ??
      sections[i];
    const color = PADLET_PASTEL_POST_COLORS[i % PADLET_PASTEL_POST_COLORS.length] as PadletPostColor;

    try {
      await createBoardPost(boardId, {
        subject: label,
        body: `${label} · "${topic.trim() || "자유 주제"}" 활동 공간입니다.\n여기에 모둠(번호) 아이디어를 올려 주세요.`,
        color,
        sectionId: matched?.id,
      });
      applied += 1;
    } catch (error) {
      console.error(`padlet column seed failed (${label})`, error);
    }
  }

  return { columnsApplied: applied, columnLabels: labels };
}

export async function createBoardPost(boardId: string, input: PadletPostInput): Promise<PadletPostSummary> {
  const subject = String(input.subject ?? "").trim();
  const postBody = String(input.body ?? "").trim();
  const attachmentUrl = String(input.attachmentUrl ?? "").trim();
  if (!subject && !postBody && !attachmentUrl) {
    throw new PadletApiError("게시글 subject, body, attachmentUrl 중 하나 이상이 필요합니다.", 400);
  }

  const content: Record<string, unknown> = {};
  if (subject) content.subject = subject;
  if (postBody) content.body = postBody;
  if (attachmentUrl) {
    content.attachment = {
      url: attachmentUrl,
      caption: String(input.attachmentCaption ?? "").trim() || undefined,
    };
  }

  const attributes: Record<string, unknown> = { content };
  if (input.color) attributes.color = input.color;

  const requestBody: Record<string, unknown> = {
    data: {
      type: "post",
      attributes,
    },
  };

  if (input.sectionId?.trim()) {
    (requestBody.data as Record<string, unknown>).relationships = {
      section: {
        data: {
          type: "section",
          id: input.sectionId.trim(),
        },
      },
    };
  }

  const payload = await padletRequest<PostResponse>(`/boards/${encodeURIComponent(boardId)}/posts`, {
    method: "POST",
    body: JSON.stringify(requestBody),
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

export async function getBoardById(boardId: string): Promise<PadletBoardSummary> {
  const payload = await padletRequest<BoardResponse>(`/boards/${encodeURIComponent(boardId)}`);
  if (!payload.data) {
    throw new PadletApiError("패들렛 게시판을 찾을 수 없습니다.", 404);
  }
  return mapBoard(payload.data);
}

export async function updateBoardPost(
  boardId: string,
  postId: string,
  input: PadletPostInput,
): Promise<PadletPostSummary> {
  const subject = String(input.subject ?? "").trim();
  const postBody = String(input.body ?? "").trim();
  const content: Record<string, unknown> = {};
  if (subject) content.subject = subject;
  if (postBody) content.body = postBody;

  const attributes: Record<string, unknown> = { content };
  if (input.color) attributes.color = input.color;

  const payload = await padletRequest<PostResponse>(
    `/boards/${encodeURIComponent(boardId)}/posts/${encodeURIComponent(postId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        data: { type: "post", id: postId, attributes },
      }),
    },
  );

  if (!payload.data) {
    throw new PadletApiError("게시글 수정 응답을 처리할 수 없습니다.", 502);
  }

  const postAttributes = (payload.data.attributes ?? {}) as Record<string, unknown>;
  const postContent = (postAttributes.content ?? {}) as Record<string, unknown>;
  return {
    id: String(payload.data.id ?? postId),
    subject: String(postContent.subject ?? subject),
    body: String(postContent.body ?? postBody),
  };
}

export function buildColumnMapFromSections(
  sections: Array<{ id: string; title: string }>,
  columnMode: "numbers" | "groups",
): Record<string, string> {
  const count = columnMode === "numbers" ? 25 : 6;
  const map: Record<string, string> = {};
  for (let i = 1; i <= count; i++) {
    const label = columnMode === "numbers" ? `${i}번` : `${i}모둠`;
    const matched =
      sections.find(
        (section) =>
          section.title.includes(label) ||
          section.title === String(i) ||
          section.title.startsWith(`${i} `),
      ) ?? sections[i - 1];
    if (matched?.id) map[String(i)] = matched.id;
  }
  return map;
}
