import { GeminiApiError, toGeminiApiError, withGeminiQuotaRetry } from "@/lib/ai/gemini-errors";

const DEFAULT_MODEL = "gemini-2.5-flash-lite";

export interface GeminiCallOptions {
  temperature?: number;
  maxOutputTokens?: number;
  model?: string;
  /** 분당 한도 등 일시 오류 시 1회 재시도 */
  retryOnQuota?: boolean;
  responseMimeType?: string;
  responseSchema?: object;
}

export interface GeminiCallResult {
  text: string;
  usage?: { promptTokens: number; outputTokens: number };
}

async function requestGeminiText(
  prompt: string,
  options?: GeminiCallOptions,
): Promise<GeminiCallResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("AI 서비스가 설정되지 않았습니다.");
  }

  const model = options?.model ?? DEFAULT_MODEL;
  const generationConfig: Record<string, unknown> = {
    temperature: options?.temperature ?? 0.4,
    maxOutputTokens: options?.maxOutputTokens ?? 512,
  };
  if (options?.responseMimeType) {
    generationConfig.responseMimeType = options.responseMimeType;
  }
  if (options?.responseSchema) {
    generationConfig.responseSchema = options.responseSchema;
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig,
      }),
    },
  );

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    error?: { message?: string; code?: number };
  };

  if (!res.ok) {
    throw toGeminiApiError(res.status, data.error?.message ?? "AI 응답을 받지 못했습니다.");
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  if (!text) {
    throw new Error("AI가 빈 응답을 반환했습니다.");
  }

  return {
    text,
    usage: data.usageMetadata
      ? {
          promptTokens: data.usageMetadata.promptTokenCount ?? 0,
          outputTokens: data.usageMetadata.candidatesTokenCount ?? 0,
        }
      : undefined,
  };
}

export async function callGeminiText(prompt: string, options?: GeminiCallOptions): Promise<string> {
  if (options?.retryOnQuota === false) {
    return (await requestGeminiText(prompt, options)).text;
  }

  return (await withGeminiQuotaRetry(() => requestGeminiText(prompt, options), 1)).text;
}

export async function callGeminiJson<T>(
  prompt: string,
  options?: GeminiCallOptions,
): Promise<{ data: T; usage?: { promptTokens: number; outputTokens: number } }> {
  const result = await withGeminiQuotaRetry(() => requestGeminiText(prompt, options), 1);
  return { data: parseGeminiJsonObject<T>(result.text), usage: result.usage };
}

export function parseGeminiJsonObject<T>(text: string): T {
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI 응답 형식을 해석하지 못했습니다.");
    return JSON.parse(match[0]) as T;
  }
}

export { GeminiApiError };
