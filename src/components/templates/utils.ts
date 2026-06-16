import type { Answers } from "@/lib/types";

/** 템플릿 values 객체에서 필드 값을 안전하게 읽기 */
export function fieldValue(values: Answers, key: string): string {
  return values[key] ?? "";
}
