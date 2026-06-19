export interface LessonProcessRow {
  stage: string;
  time: string;
  content: string;
  activities: string;
  materials: string;
}

export interface InquiryStages {
  questioning: boolean;
  inquiring: boolean;
  generalizing: boolean;
  transferring: boolean;
  reflecting: boolean;
}

export interface LessonPlanForm {
  planTitle: string;
  unit: string;
  period: string;
  teachingModel: string;
  coreIdea: string;
  inquiryStages: InquiryStages;
  learningTopic: string;
  achievementStandards: string;
  learningObjectives: string;
  inquiryKnowledge: string;
  inquiryProcess: string;
  inquiryValues: string;
  inquiryQuestions: string;
  activities: string;
  writingTask: string;
  thinkingTechnique: string;
  thinkingStep1: string;
  thinkingStep2: string;
  thinkingStep3: string;
  reflection: string;
  evaluationKnowledge: string;
  evaluationProcess: string;
  evaluationValues: string;
  thinkingTool: string;
  /** 성찰 단계에 추가로 사용하는 사고도구 (선택, 최대 1개) */
  reflectionThinkingTool: string;
  templateSource: string;
  writingContext: string;
  aiWebApp: string;
  usageTips: string;
  processRows: LessonProcessRow[];
}

export const EMPTY_INQUIRY_STAGES: InquiryStages = {
  questioning: false,
  inquiring: true,
  generalizing: false,
  transferring: false,
  reflecting: false,
};

export const EMPTY_PROCESS_ROW: LessonProcessRow = {
  stage: "",
  time: "",
  content: "",
  activities: "",
  materials: "",
};

export const EMPTY_LESSON_PLAN: LessonPlanForm = {
  planTitle: "",
  unit: "",
  period: "",
  teachingModel: "개념기반 탐구모형",
  coreIdea: "",
  inquiryStages: { ...EMPTY_INQUIRY_STAGES },
  learningTopic: "",
  achievementStandards: "",
  learningObjectives: "",
  inquiryKnowledge: "",
  inquiryProcess: "",
  inquiryValues: "",
  inquiryQuestions: "",
  activities: "",
  writingTask: "",
  thinkingTechnique: "",
  thinkingStep1: "",
  thinkingStep2: "",
  thinkingStep3: "",
  reflection: "",
  evaluationKnowledge: "",
  evaluationProcess: "",
  evaluationValues: "",
  thinkingTool: "",
  reflectionThinkingTool: "",
  templateSource: "",
  writingContext: "",
  aiWebApp: "",
  usageTips: "",
  processRows: [
    { ...EMPTY_PROCESS_ROW },
    { ...EMPTY_PROCESS_ROW },
    { ...EMPTY_PROCESS_ROW },
  ],
};

export const INQUIRY_STAGE_OPTIONS = [
  { key: "questioning" as const, label: "질문하기" },
  { key: "inquiring" as const, label: "탐구하기" },
  { key: "generalizing" as const, label: "일반화하기" },
  { key: "transferring" as const, label: "전이하기" },
  { key: "reflecting" as const, label: "성찰하기" },
];
