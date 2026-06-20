"use client";

import type { ComponentType } from "react";
import type { TemplateProps } from "@/lib/types";
import { WorksheetClosingSection } from "@/components/worksheet/WorksheetClosingSection";
import {
  SeeThinkWonderTemplate,
  ThinkPuzzleExploreTemplate,
  FourCsTemplate,
  FiveWhyTemplate,
  StepInsideTemplate,
  IUsedToThinkTemplate,
  PlusOneTemplate,
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
  StopLightTemplate,
  YChartTemplate,
  TChartTemplate,
  Brainwriting635Template,
  SpectrumTemplate,
  WhatMakesYouSayThatTemplate,
  E3Template,
  FishboneTemplate,
  InquiryClassroomRulesTemplate,
  ScamperTemplate,
  TrafficLightReflectionTemplate,
  ShowOfThumbsReflectionTemplate,
  FourCsReflectionTemplate,
  GiveOneGetOneTemplate,
  ThinkTalkOpenExchangeTemplate,
  LeaderlessDiscussionTemplate,
  MakingMeaningTemplate,
} from "./routines";
import { DoubleBubbleMapTemplate } from "./DoubleBubbleMapTemplate";
import { HexagonKeywordsTemplate } from "./HexagonKeywordsTemplate";
import { MandalartTemplate } from "./MandalartTemplate";
import { CompassPointsTemplate } from "./CompassPointsTemplate";
import { ThreeTwoOneReflectionTemplate } from "./ThreeTwoOneReflectionTemplate";
import { GsceTemplate } from "./GsceTemplate";
import { ClaimSupportQuestionTemplate } from "./ClaimSupportQuestionTemplate";
import { HeadlineTemplate } from "./HeadlineTemplate";
import { ColorSymbolImageTemplate } from "./ColorSymbolImageTemplate";
import {
  CircleTreeMapTemplate,
  MultiFlowMapTemplate,
  BridgeMapTemplate,
  WindowMapTemplate,
  SwotTemplate,
  FrayerModelTemplate,
  HoneycombQuestionsTemplate,
} from "./maps";

export const TEMPLATE_COMPONENTS: Record<string, ComponentType<TemplateProps>> = {
  "see-think-wonder": SeeThinkWonderTemplate,
  "three-two-one-reflection": ThreeTwoOneReflectionTemplate,
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
  "what-makes-you-say-that": WhatMakesYouSayThatTemplate,
  e3: E3Template,
  fishbone: FishboneTemplate,
  "color-symbol-image": ColorSymbolImageTemplate,
  "inquiry-classroom-rules": InquiryClassroomRulesTemplate,
  scamper: ScamperTemplate,
  "traffic-light-reflection": TrafficLightReflectionTemplate,
  "show-of-thumbs-reflection": ShowOfThumbsReflectionTemplate,
  "four-cs-reflection": FourCsReflectionTemplate,
  "give-one-get-one": GiveOneGetOneTemplate,
  "think-talk-open-exchange": ThinkTalkOpenExchangeTemplate,
  "leaderless-discussion": LeaderlessDiscussionTemplate,
  "making-meaning": MakingMeaningTemplate,
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
  return (
    <div className="worksheet-body">
      <Component {...props} />
      <WorksheetClosingSection templateId={templateId} {...props} />
    </div>
  );
}
