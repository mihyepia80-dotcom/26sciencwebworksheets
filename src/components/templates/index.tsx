"use client";

import type { ComponentType } from "react";
import type { TemplateProps } from "@/lib/types";
import {
  SeeThinkWonderTemplate,
  ThinkPuzzleExploreTemplate,
  ClaimSupportQuestionTemplate,
  FourCsTemplate,
  FiveWhyTemplate,
  StepInsideTemplate,
  IUsedToThinkTemplate,
  PlusOneTemplate,
  HeadlineTemplate,
  Give3FeedbackTemplate,
  LadderOfFeedbackTemplate,
  ChalkTalkTemplate,
  HotSpotsTemplate,
  ZoomInTemplate,
  BrainstormingTemplate,
  ExaggerationTemplate,
  StarburstingTemplate,
  QuestionTypesTemplate,
  QuestionBankTemplate,
  SixThinkingHatsTemplate,
  PeelTheFruitTemplate,
  CircleOfViewpointsTemplate,
  GsceTemplate,
  StopLightTemplate,
  YChartTemplate,
  TChartTemplate,
  Brainwriting635Template,
  SpectrumTemplate,
} from "./routines";
import {
  CircleTreeMapTemplate,
  DoubleBubbleMapTemplate,
  MultiFlowMapTemplate,
  BridgeMapTemplate,
  WindowMapTemplate,
  SwotTemplate,
  FrayerModelTemplate,
  HexagonKeywordsTemplate,
  HoneycombQuestionsTemplate,
  CompassPointsTemplate,
  MandalartTemplate,
} from "./maps";

export const TEMPLATE_COMPONENTS: Record<string, ComponentType<TemplateProps>> = {
  "see-think-wonder": SeeThinkWonderTemplate,
  "circle-tree-map": CircleTreeMapTemplate,
  "double-bubble-map": DoubleBubbleMapTemplate,
  "multi-flow-map": MultiFlowMapTemplate,
  "bridge-map": BridgeMapTemplate,
  "window-map": WindowMapTemplate,
  swot: SwotTemplate,
  "think-puzzle-explore": ThinkPuzzleExploreTemplate,
  "hexagon-keywords": HexagonKeywordsTemplate,
  "six-thinking-hats": SixThinkingHatsTemplate,
  "claim-support-question": ClaimSupportQuestionTemplate,
  "five-why": FiveWhyTemplate,
  "hot-spots": HotSpotsTemplate,
  headline: HeadlineTemplate,
  "zoom-in": ZoomInTemplate,
  "chalk-talk": ChalkTalkTemplate,
  gsce: GsceTemplate,
  "frayer-model": FrayerModelTemplate,
  "question-types": QuestionTypesTemplate,
  "question-bank": QuestionBankTemplate,
  "circle-of-viewpoints": CircleOfViewpointsTemplate,
  spectrum: SpectrumTemplate,
  "honeycomb-questions": HoneycombQuestionsTemplate,
  "compass-points": CompassPointsTemplate,
  "plus-one": PlusOneTemplate,
  "stop-light": StopLightTemplate,
  "y-chart": YChartTemplate,
  "t-chart": TChartTemplate,
  "four-cs": FourCsTemplate,
  "give-3-feedback": Give3FeedbackTemplate,
  "ladder-of-feedback": LadderOfFeedbackTemplate,
  "step-inside": StepInsideTemplate,
  "peel-the-fruit": PeelTheFruitTemplate,
  "i-used-to-think": IUsedToThinkTemplate,
  mandalart: MandalartTemplate,
  brainstorming: BrainstormingTemplate,
  "brainwriting-635": Brainwriting635Template,
  exaggeration: ExaggerationTemplate,
  starbursting: StarburstingTemplate,
};

export function TemplateRenderer({ templateId, ...props }: TemplateProps & { templateId: string }) {
  const Component = TEMPLATE_COMPONENTS[templateId];
  if (!Component) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-600">
        템플릿을 찾을 수 없습니다: {templateId}
      </div>
    );
  }
  return <Component {...props} />;
}
