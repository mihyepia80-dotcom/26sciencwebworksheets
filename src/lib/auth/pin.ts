export const ACCESS_PIN_LENGTH = 6;

export const ACCESS_PIN_PATTERN = /^\d{6}$/;

export function isValidAccessPin(value: string): boolean {
  return ACCESS_PIN_PATTERN.test(value.trim());
}

export function normalizeAccessPin(value: string): string {
  return value.trim();
}

export const ACCESS_PIN_HINT = "6자리 숫자만 입력할 수 있습니다. (예: 260026)";
