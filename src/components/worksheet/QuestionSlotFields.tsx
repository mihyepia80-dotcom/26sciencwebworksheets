"use client";

import { QB_SLOT_LIMITS } from "@/lib/inquiry-question-bot/config";
import { QB_VALUE_KEYS } from "@/lib/inquiry-question-bot/types";
import type { QbSlots } from "@/lib/inquiry-question-bot/types";

export const QB_CHAT_STEPS = [
  {
    key: "observed" as const,
    prompt: "먼저, 실험이나 관찰에서 무엇을 보았는지 알려 줄래?",
    label: "① 관찰",
    limit: QB_SLOT_LIMITS.observed,
    placeholder: "예: 설탕이 물에 녹았다",
  },
  {
    key: "change" as const,
    prompt: "실험에서 무엇을 바꿔 보면 더 알 수 있을까?",
    label: "② 바꿀 것",
    limit: QB_SLOT_LIMITS.change,
    placeholder: "예: 물의 온도",
  },
  {
    key: "measure" as const,
    prompt: "무엇이 어떻게 달라지는지 관찰·측정해 볼 수 있을까?",
    label: "③ 볼 것",
    limit: QB_SLOT_LIMITS.measure,
    placeholder: "예: 녹는 빠르기",
  },
] as const;

export type QbChatStepKey = (typeof QB_CHAT_STEPS)[number]["key"] | "review" | "done";

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

export { QB_VALUE_KEYS };
