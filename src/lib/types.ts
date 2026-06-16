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
