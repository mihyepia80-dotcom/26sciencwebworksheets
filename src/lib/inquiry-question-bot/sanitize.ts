import { QB_SLOT_LIMITS } from "./config";
import type { QbSlots } from "./types";

export function clip(text: string, max: number): string {
  return text.trim().slice(0, max);
}

export function sanitizeSlots(raw: QbSlots): QbSlots {
  return {
    observed: clip(raw.observed ?? "", QB_SLOT_LIMITS.observed),
    change: clip(raw.change ?? "", QB_SLOT_LIMITS.change),
    measure: clip(raw.measure ?? "", QB_SLOT_LIMITS.measure),
  };
}

export function sanitizeFreeText(text?: string): string {
  return clip(text ?? "", QB_SLOT_LIMITS.freeText);
}

export function normalizeSlotText(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}
