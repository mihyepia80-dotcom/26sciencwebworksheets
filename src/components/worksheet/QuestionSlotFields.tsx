"use client";

import { QB_SLOT_LIMITS } from "@/lib/inquiry-question-bot/config";
import { QB_VALUE_KEYS } from "@/lib/inquiry-question-bot/types";
import type { QbSlots } from "@/lib/inquiry-question-bot/types";

interface QuestionSlotFieldsProps {
  slots: QbSlots;
  onChange: (key: keyof QbSlots, value: string) => void;
  readOnly?: boolean;
}

const FIELDS: { key: keyof QbSlots; label: string; limit: number; placeholder: string }[] = [
  {
    key: "observed",
    label: "① 무엇을 보았나요?",
    limit: QB_SLOT_LIMITS.observed,
    placeholder: "관찰한 사실을 적어 보세요",
  },
  {
    key: "change",
    label: "② 무엇을 바꿔 볼까요?",
    limit: QB_SLOT_LIMITS.change,
    placeholder: "바꿔 볼 조건",
  },
  {
    key: "measure",
    label: "③ 무엇이 달라지는지 볼까요?",
    limit: QB_SLOT_LIMITS.measure,
    placeholder: "관찰·측정할 것",
  },
];

export function slotsFromValues(values: Record<string, string>): QbSlots {
  return {
    observed: values[QB_VALUE_KEYS.observed] ?? "",
    change: values[QB_VALUE_KEYS.change] ?? "",
    measure: values[QB_VALUE_KEYS.measure] ?? "",
  };
}

export function QuestionSlotFields({ slots, onChange, readOnly }: QuestionSlotFieldsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {FIELDS.map(({ key, label, limit, placeholder }) => (
        <div key={key} className={key === "observed" ? "md:col-span-2" : ""}>
          <label className="ui-label" htmlFor={`qb-${key}`}>
            {label}
          </label>
          <input
            id={`qb-${key}`}
            type="text"
            className="ui-input-compact w-full"
            value={slots[key]}
            maxLength={limit}
            disabled={readOnly}
            placeholder={placeholder}
            onChange={(e) => onChange(key, e.target.value.slice(0, limit))}
          />
          <p className="mt-1 text-right text-xs text-slate-400">
            {slots[key].length}/{limit}
          </p>
        </div>
      ))}
    </div>
  );
}

export { QB_VALUE_KEYS };
