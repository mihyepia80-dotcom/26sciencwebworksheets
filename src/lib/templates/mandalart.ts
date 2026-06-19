import type { Answers } from "@/lib/types";

/** 3×3 그리드 셀 키 (행 우선) */
export const MANDALART_GRID_KEYS = [
  "topLeft",
  "top",
  "topRight",
  "left",
  "center",
  "right",
  "bottomLeft",
  "bottom",
  "bottomRight",
] as const;

export type MandalartCellKey = (typeof MANDALART_GRID_KEYS)[number];

export const MANDALART_OUTER_KEYS = MANDALART_GRID_KEYS.filter((k) => k !== "center");

const LEGACY_DETAIL_TO_CELL: Record<string, MandalartCellKey> = {
  detail_0: "topLeft",
  detail_1: "top",
  detail_2: "topRight",
  detail_3: "left",
  detail_4: "right",
  detail_5: "bottomLeft",
  detail_6: "bottom",
  detail_7: "bottomRight",
};

export function mandalartFieldKeys(): string[] {
  return [...MANDALART_GRID_KEYS, "details"];
}

export function migrateLegacyMandalart(values: Answers, onChange: (key: string, value: string) => void) {
  for (const [legacyKey, cellKey] of Object.entries(LEGACY_DETAIL_TO_CELL)) {
    if (!values[cellKey]?.trim() && values[legacyKey]?.trim()) {
      onChange(cellKey, values[legacyKey]);
    }
  }

  if (!values.details?.trim() && values.notes?.trim()) {
    onChange("details", values.notes);
  }
}
