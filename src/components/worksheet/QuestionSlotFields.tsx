"use client";

import { QB_SLOT_LIMITS } from "@/lib/inquiry-question-bot/config";
import { QB_VALUE_KEYS } from "@/lib/inquiry-question-bot/types";
import type { QbSlots } from "@/lib/inquiry-question-bot/types";

export const QB_CHAT_STEPS = [
  {
    key: "observed" as const,
    prompt: "무엇을 보았나요? 관찰한 사실을 적어 주세요.",
    label: "① 관찰",
    limit: QB_SLOT_LIMITS.observed,
    placeholder: "예: 설탕이 물에 녹았다",
  },
  {
    key: "change" as const,
    prompt: "무엇을 바꿔 볼까요? 실험에서 바꿀 조건을 적어 주세요.",
    label: "② 바꿀 것",
    limit: QB_SLOT_LIMITS.change,
    placeholder: "예: 물의 온도",
  },
  {
    key: "measure" as const,
    prompt: "무엇이 달라지는지 볼까요? 관찰·측정할 것을 적어 주세요.",
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
