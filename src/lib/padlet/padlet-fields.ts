import { getFieldKeysForTemplate } from "@/lib/templates/field-keys";
import { CLOSING_HEADLINE_KEY } from "@/lib/worksheet-closing/constants";

const SKIP_PREFIXES = ["guided_q_", "closing", "lessonCheck", "qb"];

export function resolvePadletFields(templateId: string, padletFields?: string[]): string[] {
  if (padletFields?.length) return padletFields;
  const keys = getFieldKeysForTemplate(templateId);
  return keys
    .filter((key) => !SKIP_PREFIXES.some((p) => key.startsWith(p)))
    .filter((key) => key !== CLOSING_HEADLINE_KEY && key !== "conclusion")
    .slice(0, 3);
}

export const DEFAULT_UNIT_ID = "dissolution-solution";
