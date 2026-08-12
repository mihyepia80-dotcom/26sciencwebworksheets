/**
 * 2022 개정교육과정 — 과학과 「3. 용해와 용액」(초등 6학년군 공통)
 * 출처: [별책9] 과학과 교육과정 — 성취기준·해설·탐구 활동
 */

export type AchievementLevelCode = "A" | "B" | "C";

export interface AchievementLevelDescriptor {
  code: AchievementLevelCode;
  /** 표시용 (상·중·하) */
  label: "상" | "중" | "하";
  description: string;
}

export interface ScienceAchievementStandard {
  id: string;
  text: string;
  /** (가) 성취기준 해설 */
  notes: string[];
  /** (나) 성취기준 적용 시 고려 사항 — 해당 시 */
  considerations?: string[];
  /** 교육과정 <탐구 활동> */
  inquiryActivities: string[];
  /** 성취기준별 A·B·C 수준 서술 (교육과정 성취기준 기반 역량 단계) */
  levels: AchievementLevelDescriptor[];
}

export interface DissolutionLessonCurriculumLink {
  lessonNumber: number;
  achievementStandardId: string;
  /** 이 차시에서 기대하는 성취수준 (학습지 셀프체크·교사 참고) */
  targetLevel: AchievementLevelCode;
  /** 차시별 성취수준 초점 — 해당 차시 학습 목표에 맞춘 A/B/C 서술 */
  levelFocus: AchievementLevelDescriptor[];
  /** 연계 탐구 활동 (교육과정 또는 수업 설계) */
  inquiryActivity?: string;
  /** 탐구 단계 (개념기반 탐구 / STS 등) */
  inquiryStage: string;
}

export const DISSOLUTION_2022_CORE_IDEA =
  "물질은 여러 가지 상태로 존재하며, 구성 입자의 운동에 따라 물질의 상태와 물리적 성질이 변한다.";

export const DISSOLUTION_2022_UNIT = "3. 용해와 용액";

export const DISSOLUTION_2022_ACHIEVEMENT_STANDARDS: Record<string, ScienceAchievementStandard> = {
  "6과03-01": {
    id: "6과03-01",
    text: "용해 현상의 의미를 알고, 용질의 종류와 물의 온도에 따라 물에 녹는 용질의 양이 달라짐을 비교할 수 있다.",
    notes: [
      "용질, 용매, 용액, 용해의 개념을 다루되, 입자 모형으로 용해 현상을 설명하거나 용해 현상이 일어나는 과학적 이유나 원리를 설명하지 않는다.",
      "용해 전과 후의 무게를 비교하여 용해 과정에서 물질이 사라지지 않음을 이해하도록 한다.",
    ],
    considerations: [
      "초등학교 5~6학년군의 「혼합물의 분리」, 「산과 염기」, 중학교 1~3학년군의 「물질의 특성」과 연계된다.",
    ],
    inquiryActivities: [
      "용해 전과 후의 무게 측정하기",
      "물에 녹는 용질의 양에 영향을 미치는 요인 탐구하기",
    ],
    levels: [
      {
        code: "A",
        label: "상",
        description:
          "용해 현상의 의미를 설명하고, 용질 종류·물 온도에 따른 용해량 차이를 실험 결과로 비교·설명할 수 있다.",
      },
      {
        code: "B",
        label: "중",
        description:
          "용질·용매·용액·용해 개념을 이해하고, 용해 전후 무게 변화와 용해량 요인을 관찰·기록할 수 있다.",
      },
      {
        code: "C",
        label: "하",
        description:
          "용해 현상을 관찰하고, 용해 전후 무게가 같게 나타남을 확인할 수 있다.",
      },
    ],
  },
  "6과03-02": {
    id: "6과03-02",
    text: "용질이나 용매의 양에 따라 용액의 진하기가 달라짐을 관찰하고, 용액의 상대적인 진하기를 비교할 수 있다.",
    notes: [
      "진하기가 다른 두 용액에서 같은 물체의 뜨는 정도가 다름을 이용하여 용액의 상대적인 진하기를 비교하도록 한다.",
    ],
    inquiryActivities: ["진하기가 다른 용액에서 물체의 뜨는 정도 비교하기"],
    levels: [
      {
        code: "A",
        label: "상",
        description:
          "진하기가 다른 용액의 상대적 진하기를 여러 방법(뜨는 정도·색 변화 등)으로 비교·설명할 수 있다.",
      },
      {
        code: "B",
        label: "중",
        description:
          "용질·용매 양에 따른 진하기 변화를 관찰하고, 두 용액의 진하기를 비교할 수 있다.",
      },
      {
        code: "C",
        label: "하",
        description:
          "진하기가 다른 용액에서 물체의 뜨는 정도 차이를 관찰할 수 있다.",
      },
    ],
  },
  "6과03-03": {
    id: "6과03-03",
    text: "일상생활에서 용액이 쓰이는 사례를 조사하여 용액의 필요성을 알리는 자료를 만들고 공유할 수 있다.",
    notes: [],
    considerations: [
      "일상생활에서 용액의 사용 사례를 조사하여 우리 주변에서 용액의 중요성과 필요성을 이해할 수 있도록 한다.",
      "디지털 소양 교육과 연계하여 포스터, 동영상 등 다양한 형태로 디지털 자료를 제작하여 누리망이나 사회 관계망 서비스 등에서 공유하도록 한다.",
    ],
    inquiryActivities: ["일상생활 용액 사례 조사 및 자료 제작·공유"],
    levels: [
      {
        code: "A",
        label: "상",
        description:
          "용액 사례를 조사하고, 필요성을 알리는 디지털 자료를 만들어 공유할 수 있다.",
      },
      {
        code: "B",
        label: "중",
        description:
          "일상생활 용액 사례를 조사하고, 용액의 필요성을 과학 용어로 설명할 수 있다.",
      },
      {
        code: "C",
        label: "하",
        description: "용액이 쓰이는 사례를 찾아 간단히 소개할 수 있다.",
      },
    ],
  },
};

/** 1~8차시 ↔ 2022 교육과정 매핑 */
export const DISSOLUTION_LESSON_CURRICULUM: DissolutionLessonCurriculumLink[] = [
  {
    lessonNumber: 1,
    achievementStandardId: "6과03-01",
    targetLevel: "C",
    levelFocus: [
      {
        code: "C",
        label: "하",
        description: "여러 물질의 용해 현상을 관찰하고, 보이는·보이지 않는 변화를 구분할 수 있다.",
      },
      {
        code: "B",
        label: "중",
        description: "관찰 결과를 바탕으로 용질·용매·용액 개념을 사용해 설명을 시도할 수 있다.",
      },
    ],
    inquiryActivity: "용해 현상 관찰",
    inquiryStage: "개념기반 탐구 — 관찰·질문 생성",
  },
  {
    lessonNumber: 2,
    achievementStandardId: "6과03-01",
    targetLevel: "B",
    levelFocus: [
      {
        code: "B",
        label: "중",
        description: "용해 전후 무게 변화를 측정·비교하고, 오개념을 수정할 수 있다.",
      },
      {
        code: "C",
        label: "하",
        description: "용해 전후 무게가 같게 나타남을 확인할 수 있다.",
      },
    ],
    inquiryActivity: "용해 전과 후의 무게 측정하기",
    inquiryStage: "개념기반 탐구 — 오개념 수정",
  },
  {
    lessonNumber: 3,
    achievementStandardId: "6과03-01",
    targetLevel: "B",
    levelFocus: [
      {
        code: "B",
        label: "중",
        description: "용해 전후 무게 보존을 예측·측정·설명할 수 있다.",
      },
      {
        code: "A",
        label: "상",
        description: "물질이 사라지지 않고 용액 속에 남아 있음을 과학적으로 설명할 수 있다.",
      },
    ],
    inquiryActivity: "용해 전과 후의 무게 측정하기",
    inquiryStage: "개념기반 탐구 — 예측·탐구·설명(E3)",
  },
  {
    lessonNumber: 4,
    achievementStandardId: "6과03-01",
    targetLevel: "A",
    levelFocus: [
      {
        code: "A",
        label: "상",
        description: "용질 종류·물 온도에 따른 용해량 차이를 변인 통제하며 비교·설명할 수 있다.",
      },
      {
        code: "B",
        label: "중",
        description: "용해량에 영향을 미치는 요인을 탐구하고 결과를 기록할 수 있다.",
      },
    ],
    inquiryActivity: "물에 녹는 용질의 양에 영향을 미치는 요인 탐구하기",
    inquiryStage: "개념기반 탐구 — 변인 통제",
  },
  {
    lessonNumber: 5,
    achievementStandardId: "6과03-02",
    targetLevel: "A",
    levelFocus: [
      {
        code: "A",
        label: "상",
        description: "진하기가 다른 용액의 상대적 진하기를 실험 데이터로 비교·주장할 수 있다.",
      },
      {
        code: "B",
        label: "중",
        description: "용질·용매 양에 따른 진하기 변화를 관찰·비교할 수 있다.",
      },
    ],
    inquiryActivity: "진하기가 다른 용액에서 물체의 뜨는 정도 비교하기",
    inquiryStage: "개념기반 탐구 — Claim·Support·Question",
  },
  {
    lessonNumber: 6,
    achievementStandardId: "6과03-03",
    targetLevel: "B",
    levelFocus: [
      {
        code: "B",
        label: "중",
        description: "일상생활 용액 사례를 조사하고 필요성을 헤드라인으로 표현할 수 있다.",
      },
      {
        code: "C",
        label: "하",
        description: "용액이 쓰이는 사례를 찾아 간단히 소개할 수 있다.",
      },
    ],
    inquiryActivity: "일상생활 용액 사례 조사",
    inquiryStage: "STS 융합 — 사례 조사",
  },
  {
    lessonNumber: 7,
    achievementStandardId: "6과03-03",
    targetLevel: "A",
    levelFocus: [
      {
        code: "A",
        label: "상",
        description: "용액의 필요성을 알리는 디지털 자료(CSI)를 기획·제작할 수 있다.",
      },
      {
        code: "B",
        label: "중",
        description: "용액의 가치를 색·기호·이미지로 표현하고 과학적 이유를 설명할 수 있다.",
      },
    ],
    inquiryActivity: "디지털 자료 제작 (포스터·동영상 등)",
    inquiryStage: "STS 융합 — 디지털 소양",
  },
  {
    lessonNumber: 8,
    achievementStandardId: "6과03-03",
    targetLevel: "A",
    levelFocus: [
      {
        code: "A",
        label: "상",
        description: "용액 연구·탐구 분야와 미래 사회 문제를 연결하여 종합·성찰할 수 있다.",
      },
      {
        code: "B",
        label: "중",
        description: "단원 전체 배움을 4C로 연결·정리할 수 있다.",
      },
    ],
    inquiryActivity: "용액 연구·탐구 직업·분야 탐색",
    inquiryStage: "STS 융합 — 단원 종합",
  },
];

export function getDissolutionAchievementStandard(id: string): ScienceAchievementStandard | undefined {
  return DISSOLUTION_2022_ACHIEVEMENT_STANDARDS[id];
}

export function getDissolutionLessonCurriculum(lessonNumber: number): DissolutionLessonCurriculumLink | undefined {
  return DISSOLUTION_LESSON_CURRICULUM.find((l) => l.lessonNumber === lessonNumber);
}

export function formatAchievementStandard(standard: ScienceAchievementStandard): string {
  return `[${standard.id}] ${standard.text}`;
}

export function getDissolutionAchievementTextByLesson(lessonNumber: number): string {
  const link = getDissolutionLessonCurriculum(lessonNumber);
  if (!link) return formatAchievementStandard(DISSOLUTION_2022_ACHIEVEMENT_STANDARDS["6과03-01"]);
  const std = getDissolutionAchievementStandard(link.achievementStandardId);
  return std ? formatAchievementStandard(std) : "";
}
