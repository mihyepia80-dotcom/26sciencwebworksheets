export class PadletApiError extends Error {
  readonly status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "PadletApiError";
    this.status = status;
  }
}

export function parsePadletErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const errors = (payload as { errors?: unknown }).errors;
  if (!Array.isArray(errors) || errors.length === 0) return fallback;
  const first = errors[0];
  if (typeof first === "object" && first && "detail" in first) {
    const detail = String((first as { detail?: unknown }).detail ?? "").trim();
    if (detail) return detail;
  }
  if (typeof first === "object" && first && "title" in first) {
    const title = String((first as { title?: unknown }).title ?? "").trim();
    if (title) return title;
  }
  return fallback;
}
