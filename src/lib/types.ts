export type ToolCategory =
  | "concept-exploration"
  | "concept-formation"
  | "concept-synthesis"
  | "concept-deepening"
  | "feedback-support"
  | "self-reflection"
  | "student-exchange";

export type ThinkingTrait = "유창성" | "융통성" | "독창성" | "정교성";

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
  /** 사고 특성 — 유창성·융통성·독창성·정교성 */
  thinkingTraits?: ThinkingTrait[];
  /** 차시별 반영 여부 */
  perLesson?: boolean;
  /** 다른 탐구 단계에도 표시 */
  secondaryCategories?: ToolCategory[];
  /** 보조 탐구 단계에서의 순번 */
  secondaryOrders?: Partial<Record<ToolCategory, number>>;
  description: string;
  aiFeatureLabel?: string;
  aiFeature?: string;
  /** 제출 검증용 value 필드 키 — 미지정 시 field-keys.ts에서 조회 */
  fields?: string[];
  /** 홈 목록에서 숨김(기존 제출 호환) */
  legacy?: boolean;
  headerFields?: ("unit" | "period" | "inquiryQuestion" | "writingContext" | "description")[];
  /** F-24 탐구질문 챗봇 노출 */
  questionBot?: boolean;
  /** F-25 패들렛 게시 요약 필드 */
  padletFields?: string[];
  /** F-25 기본 차시 번호 */
  defaultPeriod?: number;
}

export type Answers = Record<string, string>;

export interface TemplateProps {
  values: Answers;
  onChange: (key: string, value: string) => void;
  readOnly?: boolean;
  /** 용해와 용액 등 단원 차시 (예: 1/8) — 차시별 학습지 형태 반영 */
  period?: string;
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
