/**
 * 용해와 용액 1~8차시 — HTML 학습지와 동일한 본문·보조란·셀프체크 구조 (단일 소스)
 */

import { getDissolutionLesson, type DissolutionLessonDefinition } from "./dissolution-lessons";

export interface ExperimentSection {
  key: string;
  title: string;
  guide: string;
  placeholder: string;
  rows?: number;
}

export interface Bridge321Section {
  learnedKey: string;
  curiousKey: string;
  bridgeKey: string;
}

export interface InvestigationSection {
  key: string;
  title: string;
  guide: string;
  placeholder: string;
  rows?: number;
}

export interface LessonClosingCheckItem {
  key: string;
  label: string;
}

export interface FourCsFieldMeta {
  title: string;
  guide?: string;
  placeholder?: string;
}

export interface DissolutionLessonFormConfig {
  period: string;
  lessonNumber: number;
  periodLabel: string;
  templateId: string;
  subtitle?: string;
  extraFieldKeys: string[];
  experiment?: ExperimentSection;
  bridge321?: Bridge321Section;
  investigation?: InvestigationSection;
  fourCsFields?: Partial<Record<"connections" | "challenge" | "concepts" | "changes", FourCsFieldMeta>>;
  closingChecklist: LessonClosingCheckItem[];
}

const LESSON_CLOSING: Record<number, LessonClosingCheckItem[]> = {
  1: [
    { key: "lessonCheck1", label: "See에는 관찰 사실만, Think에는 나의 생각을 구분하여 적었나요?" },
    { key: "lessonCheck2", label: "Wonder 질문이 오늘 관찰과 연결되어 있나요?" },
    { key: "lessonCheck3", label: "3-2-1 Bridge에서 수업 전·후 생각의 연결을 적었나요?" },
  ],
  2: [
    { key: "lessonCheck1", label: "예전 생각과 지금 생각을 명확히 구분하여 적었나요?" },
    { key: "lessonCheck2", label: "「왜냐하면」 뒤에 실험·관찰 근거를 제시했나요?" },
    { key: "lessonCheck3", label: "무게가 같게 나타나는 이유를 물질 보존과 연결해 보았나요?" },
  ],
  3: [
    { key: "lessonCheck1", label: "예측 → 탐구(측정) → 설명 순서로 작성했나요?" },
    { key: "lessonCheck2", label: "예측과 실제 결과의 차이를 비교했나요?" },
    { key: "lessonCheck3", label: "물질 보존 원리를 설명에 포함했나요?" },
  ],
  4: [
    { key: "lessonCheck1", label: "Connection · Challenge · Concept · Change 네 관점에서 탐구를 정리했나요?" },
    { key: "lessonCheck2", label: "통제한 변인과 바꾼 변인을 구분하여 기록했나요?" },
    { key: "lessonCheck3", label: "용질, 용매, 용해량, 변인 통제 등 핵심 개념을 Concept에 포함했나요?" },
  ],
  5: [
    { key: "lessonCheck1", label: "주장 → 근거(실험 데이터) → 후속 질문 순으로 작성했나요?" },
    { key: "lessonCheck2", label: "Support에 구체적인 실험 관찰 사실을 적었나요?" },
    { key: "lessonCheck3", label: "용질, 용매, 진하기 등 과학 용어를 사용했나요?" },
  ],
  6: [
    { key: "lessonCheck1", label: "헤드라인이 한 줄로 짧고 선명하게 작성되었나요?" },
    { key: "lessonCheck2", label: "용질·용매·용액·균일성 등 과학 용어를 이유에 포함했나요?" },
    { key: "lessonCheck3", label: "구체적인 일상 용액 사례를 조사했나요?" },
  ],
  7: [
    { key: "lessonCheck1", label: "Color · Symbol · Image를 모두 선택하고 이유를 서술했나요?" },
    { key: "lessonCheck2", label: "용액의 균일성·안전성·효과 등 과학적 특징을 비유에 녹였나요?" },
    { key: "lessonCheck3", label: "디지털 자료 제작에 활용할 메시지가 담겨 있나요?" },
  ],
  8: [
    { key: "lessonCheck1", label: "Connection · Challenge · Concept · Change로 단원 전체 배움을 종합했나요?" },
    { key: "lessonCheck2", label: "의약·환경·식품·화학 등 진로 분야와 용액을 연결했나요?" },
    { key: "lessonCheck3", label: "1~7차시에서 배운 내용을 Connection·Change에 반영했나요?" },
  ],
};

function buildFormConfig(lesson: DissolutionLessonDefinition): DissolutionLessonFormConfig {
  const n = lesson.lessonNumber;
  const base: DissolutionLessonFormConfig = {
    period: lesson.period,
    lessonNumber: n,
    periodLabel: lesson.periodLabel,
    templateId: lesson.templateId,
    extraFieldKeys: [],
    closingChecklist: LESSON_CLOSING[n] ?? [],
  };

  switch (n) {
    case 1:
      return {
        ...base,
        subtitle: "STW + 3-2-1 Bridge",
        extraFieldKeys: ["experiment", "learned321", "curious321", "bridge321"],
        experiment: {
          key: "experiment",
          title: "실험 과정·결과 기록",
          guide: "실험 과정·결과는 이 란에 함께 적으세요.",
          placeholder: "관찰한 물질, 실험 방법, 눈에 보이는 변화 등을 기록하세요.",
          rows: 3,
        },
        bridge321: {
          learnedKey: "learned321",
          curiousKey: "curious321",
          bridgeKey: "bridge321",
        },
      };
    case 2:
      return {
        ...base,
        extraFieldKeys: ["experiment"],
        experiment: {
          key: "experiment",
          title: "실험 기록 (용해 전후 무게 측정)",
          guide: "용해 전후 무게 측정 결과를 실험 기록란에 적어 두세요.",
          placeholder: "용해 전 무게: ___ g / 용해 후 무게: ___ g / 관찰한 변화",
          rows: 4,
        },
      };
    case 3:
      return { ...base, extraFieldKeys: [] };
    case 4:
      return {
        ...base,
        extraFieldKeys: ["experiment"],
        experiment: {
          key: "experiment",
          title: "탐구 기록 (변인 통제)",
          guide: "공정한 실험을 위해 통제한 변인과 바꾼 변인을 구분하세요.",
          placeholder: "통제한 변인: / 바꾼 변인: / 탐구 결과",
          rows: 3,
        },
        fourCsFields: {
          connections: { title: "Connections (연결)", placeholder: lesson.fields.hint_connections },
          challenge: { title: "Challenges (도전)", placeholder: lesson.fields.hint_challenge },
          concepts: {
            title: "Concepts (핵심 개념)",
            guide: "용질, 용매, 용해량, 변인 통제 등 핵심 개념을 포함하세요.",
            placeholder: lesson.fields.hint_concepts,
          },
          changes: { title: "Changes (변화된 생각)", placeholder: lesson.fields.hint_changes },
        },
      };
    case 5:
      return { ...base, extraFieldKeys: [] };
    case 6:
      return {
        ...base,
        extraFieldKeys: ["investigation"],
        investigation: {
          key: "investigation",
          title: "조사한 용액 사례",
          guide: "일상생활에서 조사한 용액의 이름과 활용 방법을 적어 보세요.",
          placeholder: "예: 구강 청결제 — 입속 세균을 줄이기 위해 균일한 용액으로 사용",
          rows: 4,
        },
      };
    case 7:
      return { ...base, extraFieldKeys: [] };
    case 8:
      return {
        ...base,
        subtitle: "단원 종합",
        extraFieldKeys: [],
        fourCsFields: {
          connections: {
            title: "Connections (연결)",
            guide: "의약·환경·식품·화학 등 진로 분야와 용액 개념을 연결하세요.",
            placeholder: lesson.fields.hint_connections,
          },
          challenge: {
            title: "Challenges (도전 · 문제 해결)",
            placeholder: lesson.fields.hint_challenge,
          },
          concepts: { title: "Concepts (핵심 개념)", placeholder: lesson.fields.hint_concepts },
          changes: { title: "Changes (변화된 생각)", placeholder: lesson.fields.hint_changes },
        },
      };
    default:
      return base;
  }
}

export const DISSOLUTION_LESSON_FORM_CONFIGS: DissolutionLessonFormConfig[] =
  [1, 2, 3, 4, 5, 6, 7, 8]
    .map((n) => getDissolutionLesson(`${n}/8`))
    .filter((l): l is DissolutionLessonDefinition => Boolean(l))
    .map(buildFormConfig);

export function getDissolutionLessonForm(period?: string): DissolutionLessonFormConfig | undefined {
  if (!period?.trim()) return undefined;
  const lesson = getDissolutionLesson(period.trim());
  return lesson ? buildFormConfig(lesson) : undefined;
}

export function getDissolutionLessonFormByTemplate(
  templateId: string,
  period?: string,
): DissolutionLessonFormConfig | undefined {
  if (period?.trim()) {
    const byPeriod = getDissolutionLessonForm(period);
    if (byPeriod?.templateId === templateId) return byPeriod;
  }
  return DISSOLUTION_LESSON_FORM_CONFIGS.find((c) => c.templateId === templateId);
}

export function getLessonClosingChecklist(period?: string, templateId?: string): LessonClosingCheckItem[] {
  const form = period
    ? getDissolutionLessonForm(period)
    : templateId
      ? getDissolutionLessonFormByTemplate(templateId)
      : undefined;
  return form?.closingChecklist ?? [];
}

export function getDissolutionExtraFieldKeys(period?: string, templateId?: string): string[] {
  const form = period
    ? getDissolutionLessonForm(period)
    : templateId
      ? getDissolutionLessonFormByTemplate(templateId)
      : undefined;
  if (!form) return [];
  const closing = form.closingChecklist.map((c) => c.key);
  return [...form.extraFieldKeys, ...closing];
}
