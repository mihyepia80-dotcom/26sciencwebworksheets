import { formatTemplateTitle, templateBelongsToCategory } from "@/lib/templates/curriculum";
import { getSortedTemplates } from "@/lib/templates/registry";
import type { TemplateDefinition, ToolCategory } from "@/lib/types";
import type { InquiryStages } from "./types";

export type PrimaryInquiryStageKey = "questioning" | "inquiring" | "generalizing" | "transferring";

/** 주 탐구 단계별로 고를 수 있는 사고도구 탐구 범주 (한 차시에 1개) */
export const PRIMARY_STAGE_TOOL_CATEGORIES: Record<PrimaryInquiryStageKey, ToolCategory[]> = {
  questioning: ["concept-exploration", "concept-formation"],
  inquiring: ["concept-exploration", "concept-formation"],
  generalizing: ["concept-synthesis"],
  transferring: ["concept-synthesis", "concept-deepening"],
};

export const REFLECTION_TOOL_CATEGORIES: ToolCategory[] = ["self-reflection"];

export function templateMatchesCategories(def: TemplateDefinition, categories: ToolCategory[]): boolean {
  return categories.some((cat) => templateBelongsToCategory(def, cat));
}

export function getPrimaryToolOptions(stage: PrimaryInquiryStageKey): TemplateDefinition[] {
  const categories = PRIMARY_STAGE_TOOL_CATEGORIES[stage];
  return getSortedTemplates().filter((t) => templateMatchesCategories(t, categories));
}

export function getReflectionToolOptions(): TemplateDefinition[] {
  return getSortedTemplates().filter((t) => templateMatchesCategories(t, REFLECTION_TOOL_CATEGORIES));
}

export function formatToolOption(def: TemplateDefinition): string {
  return formatTemplateTitle(def);
}

export function parseInquiryStages(stages: InquiryStages): {
  primary: PrimaryInquiryStageKey;
  useReflection: boolean;
} {
  const order: PrimaryInquiryStageKey[] = ["questioning", "inquiring", "generalizing", "transferring"];
  const primary = order.find((key) => stages[key]) ?? "inquiring";
  const useReflection = stages.reflecting && primary !== "transferring";
  return { primary, useReflection };
}

export function buildInquiryStages(
  primary: PrimaryInquiryStageKey,
  useReflection: boolean,
): InquiryStages {
  return {
    questioning: primary === "questioning",
    inquiring: primary === "inquiring",
    generalizing: primary === "generalizing",
    transferring: primary === "transferring",
    reflecting: useReflection,
  };
}

export function validateLessonThinkingTools(
  primaryTool: string,
  reflectionTool: string,
  useReflection: boolean,
): string | null {
  if (!primaryTool.trim()) {
    return "이 차시에 사용할 주 사고도구를 1가지 선택하세요.";
  }
  if (useReflection && !reflectionTool.trim()) {
    return "성찰 단계에 추가할 사고도구를 선택하거나, 성찰 추가 옵션을 해제하세요.";
  }
  if (
    useReflection &&
    reflectionTool.trim() &&
    primaryTool.trim() === reflectionTool.trim()
  ) {
    return "주 사고도구와 성찰 사고도구는 서로 다른 도구를 선택하세요.";
  }
  return null;
}
