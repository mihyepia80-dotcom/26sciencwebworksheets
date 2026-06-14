export interface InquiryReportForm {
  groupNo: string;
  members: string[];
  recorder: string;
  title: string;
  materials: string;
  content: string;
  processSummary: string;
  sceneDescription: string;
  resultSummary: string;
  conclusion: string;
}

export const EMPTY_INQUIRY_REPORT: InquiryReportForm = {
  groupNo: "",
  members: ["", "", "", "", "", ""],
  recorder: "",
  title: "",
  materials: "",
  content: "",
  processSummary: "",
  sceneDescription: "",
  resultSummary: "",
  conclusion: "",
};

export const INQUIRY_SECTIONS = [
  { id: "title", num: 1, label: "제목", field: "title" as const },
  { id: "materials", num: 2, label: "준비물", field: "materials" as const },
  { id: "content", num: 3, label: "내용", sub: "설계 / 과정 / 방법 등", field: "content" as const },
  { id: "process", num: 4, label: "실험 과정 정리", field: "processSummary" as const },
  { id: "scene", num: 5, label: "실험 모습", field: "sceneDescription" as const },
  { id: "result", num: 6, label: "실험 결과", field: "resultSummary" as const },
  { id: "conclusion", num: 7, label: "알게 된 사실 및 결론", field: "conclusion" as const },
] as const;

export function validateInquiryReport(form: InquiryReportForm): string[] {
  const errors: string[] = [];
  if (!form.groupNo.trim()) errors.push("모둠 번호를 입력하세요.");
  if (!form.recorder.trim()) errors.push("기록자 이름을 입력하세요.");
  if (!form.members.some((m) => m.trim())) errors.push("모둠원 이름을 1명 이상 입력하세요.");
  if (!form.title.trim()) errors.push("제목을 입력하세요.");
  if (!form.materials.trim()) errors.push("준비물을 입력하세요.");
  if (!form.content.trim()) errors.push("내용을 입력하세요.");
  if (!form.processSummary.trim()) errors.push("실험 과정 정리를 입력하세요.");
  if (!form.sceneDescription.trim()) errors.push("실험 모습을 입력하세요.");
  if (!form.resultSummary.trim()) errors.push("실험 결과를 입력하세요.");
  if (!form.conclusion.trim()) errors.push("알게 된 사실 및 결론을 입력하세요.");
  return errors;
}
