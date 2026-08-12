"use client";

import { QB_CHAT_STEPS, type QbChatStepKey } from "@/lib/inquiry-question-bot/steps";
import { QB_VALUE_KEYS } from "@/lib/inquiry-question-bot/types";
import type { QbSlots } from "@/lib/inquiry-question-bot/types";

export function slotsFromValues(values: Record<string, string>): QbSlots {
  return {
    observed: values[QB_VALUE_KEYS.observed] ?? "",
    change: values[QB_VALUE_KEYS.change] ?? "",
    measure: values[QB_VALUE_KEYS.measure] ?? "",
  };
}

export function getActiveChatStep(slots: QbSlots, confirmed: boolean): QbChatStepKey {
  if (confirmed) return "done";
  if (!slots.observed.trim()) return "observed";
  if (!slots.change.trim()) return "change";
  if (!slots.measure.trim()) return "measure";
  return "review";
}

export { QB_CHAT_STEPS, type QbChatStepKey } from "@/lib/inquiry-question-bot/steps";
export { QB_VALUE_KEYS };
