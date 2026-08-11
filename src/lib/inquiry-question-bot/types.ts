export type QbMode = "assemble" | "refine";
export type QbSource = "rule" | "cache" | "ai";

export interface QbSlots {
  observed: string;
  change: string;
  measure: string;
}

export interface QbRequest {
  mode: QbMode;
  templateId: string;
  unitId: string;
  period: string;
  slots: QbSlots;
  freeText?: string;
  studentUid: string;
}

export interface QbChecklist {
  hasVariable: boolean;
  isTestable: boolean;
  isMeasurable: boolean;
}

export interface QbResponse {
  status: "ok" | "quota_exceeded" | "blocked" | "error";
  draft: string;
  probe: string | null;
  candidates: string[];
  checklist: QbChecklist;
  quality: 0 | 1 | 2 | 3;
  turnsLeft: number;
  turnsLeftToday: number;
  source: QbSource;
  usage?: { promptTokens: number; outputTokens: number };
  message?: string;
}

export interface QbAiPayload {
  probe: string;
  candidates: [string, string];
}

export const QB_VALUE_KEYS = {
  observed: "qbObserved",
  change: "qbChange",
  measure: "qbMeasure",
  freeText: "qbFreeText",
  confirmed: "inquiryQuestion",
} as const;
