export const GUIDED_QUESTION_SLOTS = 5;
export const GUIDED_QUESTION_DEFAULT_COUNT = 4;

export function guidedQuestionValueKey(index: number): string {
  return `guided_q_${index}`;
}

export function readGuidedQuestionsFromValues(values: Record<string, string>): string[] {
  return Array.from({ length: GUIDED_QUESTION_SLOTS }, (_, i) =>
    (values[guidedQuestionValueKey(i)] ?? "").trim(),
  ).filter(Boolean);
}

export function writeGuidedQuestionsToValues(
  questions: string[],
  onChange: (key: string, value: string) => void,
) {
  for (let i = 0; i < GUIDED_QUESTION_SLOTS; i++) {
    onChange(guidedQuestionValueKey(i), questions[i] ?? "");
  }
}

export type GuidedQuestionSource = "pinned" | "ai" | "saved" | "manual";

export interface GuidedQuestionSet {
  id?: string;
  teacherUid: string;
  templateId: string;
  templateName: string;
  topic: string;
  topicKey: string;
  unit?: string;
  grade?: string;
  writingContext?: string;
  questions: string[];
  pinned: boolean;
  updatedAt?: Date | null;
}
