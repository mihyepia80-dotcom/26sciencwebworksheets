import type { Answers } from "@/lib/types";

/** 육각형 변 12곳의 한글 연결 기호 */
export const HEX_LINK_LABELS = ["가", "나", "다", "라", "마", "바", "사", "아", "자", "차", "카", "타"] as const;

export type HexLinkLabel = (typeof HEX_LINK_LABELS)[number];

export const HEX_CELL_KEYS = [
  "topLeft",
  "top",
  "topRight",
  "bottomLeft",
  "center",
  "bottomRight",
  "bottom",
] as const;

export type HexCellKey = (typeof HEX_CELL_KEYS)[number];

export interface HexagonEdge {
  label: HexLinkLabel;
  between: string;
  /** 연결 설명 그리드 정렬 순서 */
  gridOrder: number;
  /** 다이어그램 위 배지 위치 (%) */
  badge: { top: string; left: string };
}

export const HEXAGON_EDGES: HexagonEdge[] = [
  { label: "가", between: "가운데 ↔ 왼쪽 위", gridOrder: 0, badge: { top: "38%", left: "30%" } },
  { label: "나", between: "가운데 ↔ 위", gridOrder: 1, badge: { top: "22%", left: "48%" } },
  { label: "다", between: "가운데 ↔ 오른쪽 위", gridOrder: 2, badge: { top: "38%", left: "66%" } },
  { label: "라", between: "가운데 ↔ 오른쪽 아래", gridOrder: 3, badge: { top: "58%", left: "66%" } },
  { label: "마", between: "가운데 ↔ 아래", gridOrder: 4, badge: { top: "74%", left: "48%" } },
  { label: "바", between: "가운데 ↔ 왼쪽 아래", gridOrder: 5, badge: { top: "58%", left: "30%" } },
  { label: "사", between: "왼쪽 위 ↔ 위", gridOrder: 6, badge: { top: "18%", left: "38%" } },
  { label: "아", between: "위 ↔ 오른쪽 위", gridOrder: 7, badge: { top: "18%", left: "58%" } },
  { label: "자", between: "오른쪽 위 ↔ 오른쪽 아래", gridOrder: 8, badge: { top: "48%", left: "78%" } },
  { label: "차", between: "오른쪽 아래 ↔ 아래", gridOrder: 9, badge: { top: "68%", left: "58%" } },
  { label: "카", between: "아래 ↔ 왼쪽 아래", gridOrder: 10, badge: { top: "68%", left: "38%" } },
  { label: "타", between: "왼쪽 아래 ↔ 왼쪽 위", gridOrder: 11, badge: { top: "48%", left: "18%" } },
];

const LEGACY_LETTERS = "ABCDEFGHIJKL".split("");

export function hexagonLinkKey(label: HexLinkLabel): string {
  return `link_${label}`;
}

export function hexagonKeywordFieldKeys(): string[] {
  return [...HEX_CELL_KEYS, ...HEX_LINK_LABELS.map(hexagonLinkKey), "summary"];
}

export function migrateLegacyHexagonLinks(values: Answers, onChange: (key: string, value: string) => void) {
  HEX_LINK_LABELS.forEach((label, i) => {
    const legacyKey = `link_${LEGACY_LETTERS[i]}`;
    const newKey = hexagonLinkKey(label);
    if (!values[newKey]?.trim() && values[legacyKey]?.trim()) {
      onChange(newKey, values[legacyKey]);
    }
  });
}
