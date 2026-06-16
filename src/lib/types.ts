export type ToolCategory =
  | "questioning"
  | "inquiring"
  | "generalizing"
  | "transfer"
  | "reflection-exchange";

export interface WorksheetMeta {
  grade: string;
  classNo: string;
  studentNo: string;
  studentName: string;
  topic: string;
  unit?: string;
  period?: string;
  inquiryQuestion?: string;
  writingContext?: string;
  description?: string;
}

export interface TemplateField {
  key: string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}

export interface TemplateDefinition {
  id: string;
  order: number;
  name: string;
  nameEn?: string;
  category: ToolCategory;
  description: string;
  aiFeatureLabel?: string;
  aiFeature?: string;
  /** 제출 검증용 value 필드 키 — 미지정 시 field-keys.ts에서 조회 */
  fields?: string[];
  /** 홈 목록에서 숨김(기존 제출 호환) */
  legacy?: boolean;
  headerFields?: ("unit" | "period" | "inquiryQuestion" | "writingContext" | "description")[];
}

export type Answers = Record<string, string>;

export interface TemplateProps {
  values: Answers;
  onChange: (key: string, value: string) => void;
  readOnly?: boolean;
}

export const DEFAULT_META: WorksheetMeta = {
  grade: "",
  classNo: "",
  studentNo: "",
  studentName: "",
  topic: "",
  unit: "",
  period: "",
  inquiryQuestion: "",
  writingContext: "",
  description: "",
};
