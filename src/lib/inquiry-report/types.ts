export interface InquiryReportForm {
  groupNo: string;
  members: string[];
  recorder: string;
  unitName: string;
  lessonName: string;
  curiousContent: string;
  inquiryProblem: string;
  priorKnowledge: string;
  processStep1: string;
  processStep2: string;
  processStep3: string;
  processStep4: string;
  processStep5: string;
  inquiryResult: string;
  learnedAfter: string;
  wantToKnowMore: string;
  classLearned: string;
  mostCurious: string;
  resultOrganized: string;
  realLifeStory: string;
  visualDescription: string;
}

export const EMPTY_INQUIRY_REPORT: InquiryReportForm = {
  groupNo: "",
  members: ["", "", "", "", "", ""],
  recorder: "",
  unitName: "",
  lessonName: "",
  curiousContent: "",
  inquiryProblem: "",
  priorKnowledge: "",
  processStep1: "",
  processStep2: "",
  processStep3: "",
  processStep4: "",
  processStep5: "",
  inquiryResult: "",
  learnedAfter: "",
  wantToKnowMore: "",
  classLearned: "",
  mostCurious: "",
  resultOrganized: "",
  realLifeStory: "",
  visualDescription: "",
};

export const INQUIRY_SECTIONS = [
  { id: "curious", num: 1, label: "궁금한 내용", field: "curiousContent" as const },
  { id: "problem", num: 2, label: "탐구 문제", field: "inquiryProblem" as const },
  { id: "prior", num: 3, label: "알고 있는 것", field: "priorKnowledge" as const },
  { id: "process", num: 4, label: "탐구 과정", field: "processStep1" as const },
  { id: "result", num: 5, label: "탐구 결과", field: "inquiryResult" as const },
  { id: "learned", num: 6, label: "알게 된 점", field: "learnedAfter" as const },
  { id: "more", num: 7, label: "더 알고 싶은 점", field: "wantToKnowMore" as const },
  { id: "classLearned", num: 8, label: "이번 시간 배운 내용", field: "classLearned" as const },
  { id: "mostCurious", num: 9, label: "가장 궁금했던 내용", field: "mostCurious" as const },
  { id: "organized", num: 10, label: "탐구 결과 정리", field: "resultOrganized" as const },
  { id: "realLife", num: 11, label: "생활 속 이야기", field: "realLifeStory" as const },
  { id: "visual", num: 12, label: "그림으로 설명하기", field: "visualDescription" as const },
] as const;

const REQUIRED_TEXT_FIELDS: (keyof InquiryReportForm)[] = [
  "unitName",
  "lessonName",
  "curiousContent",
  "inquiryProblem",
  "priorKnowledge",
  "processStep1",
  "inquiryResult",
  "learnedAfter",
  "wantToKnowMore",
  "classLearned",
  "mostCurious",
  "resultOrganized",
  "realLifeStory",
  "visualDescription",
];

const FIELD_LABELS: Partial<Record<keyof InquiryReportForm, string>> = {
  unitName: "단원명",
  lessonName: "차시명",
  curiousContent: "궁금한 내용",
  inquiryProblem: "탐구 문제",
  priorKnowledge: "알고 있는 것",
  processStep1: "탐구 과정",
  inquiryResult: "탐구 결과",
  learnedAfter: "알게 된 점",
  wantToKnowMore: "더 알고 싶은 점",
  classLearned: "이번 시간 배운 내용",
  mostCurious: "가장 궁금했던 내용",
  resultOrganized: "탐구 결과 정리",
  realLifeStory: "생활 속 이야기",
  visualDescription: "그림으로 설명하기",
};

export function validateInquiryReport(form: InquiryReportForm): string[] {
  const errors: string[] = [];
  if (!form.groupNo.trim()) errors.push("모둠 번호를 입력하세요.");
  if (!form.recorder.trim()) errors.push("기록자 이름을 입력하세요.");
  if (!form.members.some((m) => m.trim())) errors.push("모둠원 이름을 1명 이상 입력하세요.");

  for (const key of REQUIRED_TEXT_FIELDS) {
    if (!String(form[key]).trim()) {
      errors.push(`${FIELD_LABELS[key] ?? key}을(를) 입력하세요.`);
    }
  }

  const processFilled = [form.processStep1, form.processStep2, form.processStep3, form.processStep4, form.processStep5].filter(
    (s) => s.trim(),
  ).length;
  if (processFilled < 2) errors.push("탐구 과정을 2단계 이상 입력하세요.");

  return errors;
}

export function inquiryReportTitle(form: InquiryReportForm): string {
  return form.inquiryProblem.trim() || form.curiousContent.trim() || form.unitName.trim() || "탐구보고서";
}
