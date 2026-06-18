import { GeminiApiError, toGeminiApiError, withGeminiQuotaRetry } from "@/lib/ai/gemini-errors";

const DEFAULT_MODEL = "gemini-2.5-flash-lite";

export interface GeminiCallOptions {
  temperature?: number;
  maxOutputTokens?: number;
  model?: string;
  /** 분당 한도 등 일시 오류 시 1회 재시도 */
  retryOnQuota?: boolean;
}

async function requestGeminiText(
  prompt: string,
  options?: GeminiCallOptions,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("AI 서비스가 설정되지 않았습니다.");
  }

  const model = options?.model ?? DEFAULT_MODEL;
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: options?.temperature ?? 0.4,
          maxOutputTokens: options?.maxOutputTokens ?? 512,
        },
      }),
    },
  );

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string; code?: number };
  };

  if (!res.ok) {
    throw toGeminiApiError(res.status, data.error?.message ?? "AI 응답을 받지 못했습니다.");
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";
  if (!text) {
    throw new Error("AI가 빈 응답을 반환했습니다.");
  }

  return text;
}

export async function callGeminiText(prompt: string, options?: GeminiCallOptions): Promise<string> {
  if (options?.retryOnQuota === false) {
    return requestGeminiText(prompt, options);
  }

  return withGeminiQuotaRetry(() => requestGeminiText(prompt, options), 1);
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
