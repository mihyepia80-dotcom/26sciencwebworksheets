import {
  EMPTY_INQUIRY_REPORT,
  type InquiryReportForm,
} from "@/lib/inquiry-report/types";

/** 통합 UI용 탐구보고서 폼 (중복 문항 병합) */
export interface ConsolidatedInquiryForm {
  groupNo: string;
  members: string[];
  recorder: string;
  unitName: string;
  lessonName: string;
  /** 궁금한 내용 + 가장 궁금했던 내용 */
  curiousCombined: string;
  inquiryProblem: string;
  priorKnowledge: string;
  processStep1: string;
  processStep2: string;
  processStep3: string;
  processStep4: string;
  processStep5: string;
  /** 탐구 결과 + 탐구 결과 정리 */
  resultCombined: string;
  /** 알게 된 점 + 이번 시간 배운 내용 */
  learnedCombined: string;
  wantToKnowMore: string;
  realLifeStory: string;
  visualDrawing: string;
  visualDescription: string;
}

export const EMPTY_CONSOLIDATED_INQUIRY: ConsolidatedInquiryForm = {
  groupNo: "",
  members: ["", "", "", "", "", ""],
  recorder: "",
  unitName: "",
  lessonName: "",
  curiousCombined: "",
  inquiryProblem: "",
  priorKnowledge: "",
  processStep1: "",
  processStep2: "",
  processStep3: "",
  processStep4: "",
  processStep5: "",
  resultCombined: "",
  learnedCombined: "",
  wantToKnowMore: "",
  realLifeStory: "",
  visualDrawing: "",
  visualDescription: "",
};

export const CONSOLIDATED_INQUIRY_SECTIONS = [
  { id: "curious", num: 1, label: "궁금한 점", group: "탐구 활동" },
  { id: "problem", num: 2, label: "탐구 문제", group: "탐구 활동" },
  { id: "prior", num: 3, label: "알고 있던 것", group: "탐구 활동" },
  { id: "process", num: 4, label: "탐구 과정", group: "탐구 활동" },
  { id: "result", num: 5, label: "탐구 결과·정리", group: "탐구 활동" },
  { id: "learned", num: 6, label: "배우고 알게 된 점", group: "성찰" },
  { id: "more", num: 7, label: "더 알고 싶은 점", group: "성찰" },
  { id: "realLife", num: 8, label: "생활 속 연결", group: "성찰" },
  { id: "visual", num: 9, label: "그림으로 표현", group: "성찰" },
] as const;

function joinParts(...parts: (string | undefined)[]): string {
  return parts.map((p) => p?.trim()).filter(Boolean).join("\n\n");
}

export function toConsolidatedForm(form: InquiryReportForm): ConsolidatedInquiryForm {
  return {
    groupNo: form.groupNo,
    members: [...form.members],
    recorder: form.recorder,
    unitName: form.unitName,
    lessonName: form.lessonName,
    curiousCombined: joinParts(form.curiousContent, form.mostCurious),
    inquiryProblem: form.inquiryProblem,
    priorKnowledge: form.priorKnowledge,
    processStep1: form.processStep1,
    processStep2: form.processStep2,
    processStep3: form.processStep3,
    processStep4: form.processStep4,
    processStep5: form.processStep5,
    resultCombined: joinParts(form.inquiryResult, form.resultOrganized),
    learnedCombined: joinParts(form.learnedAfter, form.classLearned),
    wantToKnowMore: form.wantToKnowMore,
    realLifeStory: form.realLifeStory,
    visualDrawing: form.visualDrawing,
    visualDescription: form.visualDescription,
  };
}

export function fromConsolidatedForm(form: ConsolidatedInquiryForm): InquiryReportForm {
  return {
    ...EMPTY_INQUIRY_REPORT,
    groupNo: form.groupNo,
    members: form.members.slice(0, 6),
    recorder: form.recorder,
    unitName: form.unitName,
    lessonName: form.lessonName,
    curiousContent: form.curiousCombined.trim(),
    mostCurious: "",
    inquiryProblem: form.inquiryProblem,
    priorKnowledge: form.priorKnowledge,
    processStep1: form.processStep1,
    processStep2: form.processStep2,
    processStep3: form.processStep3,
    processStep4: form.processStep4,
    processStep5: form.processStep5,
    inquiryResult: form.resultCombined.trim(),
    resultOrganized: "",
    learnedAfter: form.learnedCombined.trim(),
    classLearned: "",
    wantToKnowMore: form.wantToKnowMore,
    realLifeStory: form.realLifeStory,
    visualDrawing: form.visualDrawing,
    visualDescription: form.visualDescription,
  };
}

export function validateConsolidatedInquiry(form: ConsolidatedInquiryForm): string[] {
  const storage = fromConsolidatedForm(form);
  const errors: string[] = [];
  if (!form.groupNo.trim()) errors.push("모둠 번호를 입력하세요.");
  if (!form.recorder.trim()) errors.push("기록자 이름을 입력하세요.");
  if (!form.members.some((m) => m.trim())) errors.push("모둠원 이름을 1명 이상 입력하세요.");
  if (!form.unitName.trim()) errors.push("단원명을 입력하세요.");
  if (!form.lessonName.trim()) errors.push("차시명을 입력하세요.");
  if (!form.curiousCombined.trim()) errors.push("궁금한 점을 입력하세요.");
  if (!form.inquiryProblem.trim()) errors.push("탐구 문제를 입력하세요.");
  if (!form.priorKnowledge.trim()) errors.push("알고 있던 것을 입력하세요.");
  const processFilled = [
    form.processStep1,
    form.processStep2,
    form.processStep3,
    form.processStep4,
    form.processStep5,
  ].filter((s) => s.trim()).length;
  if (processFilled < 2) errors.push("탐구 과정을 2단계 이상 입력하세요.");
  if (!form.resultCombined.trim()) errors.push("탐구 결과·정리를 입력하세요.");
  if (!form.learnedCombined.trim()) errors.push("배우고 알게 된 점을 입력하세요.");
  if (!form.wantToKnowMore.trim()) errors.push("더 알고 싶은 점을 입력하세요.");
  if (!form.realLifeStory.trim()) errors.push("생활 속 연결을 입력하세요.");
  if (!form.visualDrawing.trim()) errors.push("그림으로 나타내기 칸에 그림을 그려주세요.");
  if (storage.visualDescription && !storage.visualDescription.trim()) {
    // optional
  }
  return errors;
}

/** 학습지 메타·본문에서 탐구보고서 초안 prefill */
export function prefillConsolidatedFromWorksheet(
  form: ConsolidatedInquiryForm,
  meta: {
    unit?: string;
    period?: string;
    topic?: string;
    inquiryQuestion?: string;
    writingContext?: string;
  },
  values: Record<string, string>,
): ConsolidatedInquiryForm {
  const next = { ...form };
  if (!next.unitName.trim() && meta.unit?.trim()) next.unitName = meta.unit.trim();
  if (!next.lessonName.trim() && meta.period?.trim()) next.lessonName = meta.period.trim();
  if (!next.curiousCombined.trim()) {
    next.curiousCombined = joinParts(meta.topic, meta.inquiryQuestion);
  }
  if (!next.inquiryProblem.trim() && meta.inquiryQuestion?.trim()) {
    next.inquiryProblem = meta.inquiryQuestion.trim();
  }
  if (!next.priorKnowledge.trim() && meta.writingContext?.trim()) {
    next.priorKnowledge = meta.writingContext.trim();
  }
  const bodyText = Object.entries(values)
    .filter(([k, v]) => v.trim() && !k.startsWith("guided_q_") && !k.startsWith("closing"))
    .map(([, v]) => v.trim())
    .slice(0, 6)
    .join("\n\n");
  if (!next.resultCombined.trim() && bodyText) next.resultCombined = bodyText;
  if (!next.learnedCombined.trim() && values.closingHeadline?.trim()) {
    next.learnedCombined = values.closingHeadline.trim();
  }
  return next;
}
