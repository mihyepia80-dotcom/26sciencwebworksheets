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

export function isGeminiHighDemandMessage(message: string): boolean {
  return /high demand|try again later|overloaded|temporarily unavailable|service unavailable/i.test(
    message,
  );
}

function isGeminiRetryable(status: number, message: string): boolean {
  return status === 429 || status === 503 || isGeminiQuotaMessage(message) || isGeminiHighDemandMessage(message);
}

export function toGeminiApiError(status: number, rawMessage: string): GeminiApiError {
  const retryAfterSeconds = parseRetryAfterSeconds(rawMessage);
  const message = rawMessage || "AI 응답을 받지 못했습니다.";

  if (isGeminiRetryable(status, message)) {
    const waitHint = retryAfterSeconds ? `약 ${retryAfterSeconds}초 후` : "잠시 후";
    const userMessage = isGeminiHighDemandMessage(message) || status === 503
      ? `AI 서버가 일시적으로 사용량이 많습니다. ${waitHint} 다시 시도해 주세요.`
      : `Gemini AI 무료 사용 한도에 도달했습니다. ${waitHint} 다시 시도해 주세요.`;
    return new GeminiApiError(userMessage, { status, retryAfterSeconds, isQuotaExceeded: true });
  }

  return new GeminiApiError(message, { status });
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
