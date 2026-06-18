export class GeminiApiError extends Error {
  readonly status?: number;
  readonly retryAfterSeconds?: number;
  readonly isQuotaExceeded: boolean;

  constructor(message: string, options?: { status?: number; retryAfterSeconds?: number; isQuotaExceeded?: boolean }) {
    super(message);
    this.name = "GeminiApiError";
    this.status = options?.status;
    this.retryAfterSeconds = options?.retryAfterSeconds;
    this.isQuotaExceeded = options?.isQuotaExceeded ?? false;
  }
}

export function parseRetryAfterSeconds(message: string): number | undefined {
  const match = message.match(/retry in ([\d.]+)s/i);
  if (!match) return undefined;
  const seconds = Math.ceil(Number(match[1]));
  return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;
}

export function isGeminiQuotaMessage(message: string): boolean {
  return /quota exceeded|rate.?limit|resource.?exhausted|free_tier/i.test(message);
}

export function toGeminiApiError(status: number, rawMessage: string): GeminiApiError {
  const retryAfterSeconds = parseRetryAfterSeconds(rawMessage);
  const isQuotaExceeded = status === 429 || isGeminiQuotaMessage(rawMessage);

  if (isQuotaExceeded) {
    const waitHint = retryAfterSeconds ? `약 ${retryAfterSeconds}초 후` : "잠시 후";
    return new GeminiApiError(
      `Gemini AI 무료 사용 한도에 도달했습니다. ${waitHint} 다시 시도해 주세요.`,
      { status, retryAfterSeconds, isQuotaExceeded: true },
    );
  }

  return new GeminiApiError(rawMessage || "AI 응답을 받지 못했습니다.", { status });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withGeminiQuotaRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 1,
): Promise<T> {
  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (error) {
      const isLast = attempt >= maxRetries;
      if (!(error instanceof GeminiApiError) || !error.isQuotaExceeded || isLast) {
        throw error;
      }
      const waitMs = (error.retryAfterSeconds ?? 30) * 1000;
      await sleep(waitMs);
      attempt += 1;
    }
  }
}
