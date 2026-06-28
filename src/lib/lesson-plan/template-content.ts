import type { LessonPlanForm } from "./types";
import { EMPTY_LESSON_PLAN, EMPTY_PROCESS_ROW } from "./types";

/** 지도안(틀) — AI·교사 UI 참조용 요약 */
export const LESSON_PLAN_FRAMEWORK_SUMMARY = `
개념기반 탐구수업 사고촉진 전략 글쓰기 수업 설계 틀:
- 단원, 차시, 교수학습모형, 핵심아이디어
- 탐구 단계 5개 중 해당 차시 1개 선택 (질문·탐구·일반화·전이·성찰)
- 학습주제, 성취기준, 학습목표(지식·이해 / 과정·기능 / 가치·태도)
- 탐구 질문, 주 사고도구 1개 (+ 성찰 사고도구 1개 선택)
- 글쓰기 3단계: 생각 만들기(See) / 생각 모으기(Think&Wonder) / 제시하기(Write&Feedback)
- 실험 과정·결과 기록, AI 웹앱, 성찰, 활용팁
- 교수·학습 과정 표: 단계(시간), 학습내용, 교수·학습 활동, 자료·유의점
- 평가계획: 지식·이해 / 과정·기능 / 가치·태도
`.trim();

/** 실험반 지도안 1차시 예시 (용해와 용액) — AI few-shot */
export const EXPERIMENT_LESSON_SAMPLE: LessonPlanForm = {
  ...EMPTY_LESSON_PLAN,
  planTitle: "[실험반] 용해와 용액 1차시 — 물질이 물에 녹는 현상 관찰",
  unit: "3. 용해와 용액",
  period: "1/12",
  teachingModel: "개념기반 탐구학습",
  coreIdea:
    "물질은 여러 가지 상태로 존재하며, 구성 입자의 운동에 따라 물질의 상태와 물리적 성질이 변한다.",
  inquiryStages: {
    questioning: true,
    inquiring: false,
    generalizing: false,
    transferring: false,
    reflecting: false,
  },
  learningTopic: "물질이 물에 녹으면 어떻게 되는지 관찰하기",
  achievementStandards:
    "[6과03-01] 용해 현상의 의미를 알고, 용질의 종류와 물의 온도에 따라 물에 녹는 용질의 양이 달라짐을 비교할 수 있다.",
  learningObjectives:
    "여러 가지 물질이 물에 녹는 과정을 관찰하여 물질이 물에 녹는 현상에 흥미와 호기심을 가진다.",
  inquiryKnowledge: "물질이 물에 녹는 현상(용해)과 용질, 용매, 용액의 개념을 이해한다.",
  inquiryProcess:
    "여러 가지 물질을 물에 넣었을 때의 변화를 예상하고 관찰하며, 그 결과를 용어를 사용하여 설명할 수 있다.",
  inquiryValues:
    "탐구 활동에 적극적으로 참여하고, 과학적 호기심을 가지고 새로운 개념을 탐색하는 태도를 기른다.",
  inquiryQuestions: "물질을 물에 넣으면 어떻게 될까?",
  thinkingTool: "보기·생각하기·궁금해하기 (See, Think, Wonder)",
  activities: "물질 변신 동영상 촬영·관찰, STW 활동지 작성, AI 피드백 글쓰기",
  writingTask:
    "관찰한 물질의 변화를 원인과 결과가 드러나게 과학적 문장으로 설명하고, 생성한 탐구 질문을 반영하여 글을 완성한다.",
  thinkingTechnique: "탐구보고서 형식으로 쓰기",
  thinkingStep1: "물질의 겉모양과 물에 넣었을 때의 시각적 변화 관찰하기",
  thinkingStep2: "변화의 이유를 추론하고, 이를 바탕으로 자신만의 탐구 질문 생성하기",
  thinkingStep3:
    "생성한 탐구 질문과 STW 내용을 바탕으로 최종 글쓰기를 수행하고, AI 피드백을 받아 글 수정하기",
  writingContext: "준비된 물질(알약·발포 비타민 등)을 물에 넣었을 때의 관찰·변화 기록",
  aiWebApp: "사고도구 톡톡 See/Think/Wonder 활동지 + AI 피드백",
  usageTips: "유리 기구 파손·물질 시식 금지. AI는 지식 파트너로 질문을 유도한다.",
  reflection: "[3-2-1 브리지] 수업 전후 나의 생각 변화 확인하기",
  evaluationKnowledge:
    "물질이 물에 녹는 현상(용해)과 용질, 용매, 용액의 개념을 이해한다. — 구술·발표, 자기평가",
  evaluationProcess:
    "관찰 결과를 STW와 글쓰기로 설명한다. — E3(추리-탐구-설명) 활동, AI 피드백 후 수정",
  evaluationValues: "탐구에 적극 참여하고 과학적 호기심을 기른다. — 동료 피드백, 체크리스트 자기평가",
  templateSource: "사고도구 톡톡 웹앱",
  processRows: [
    {
      stage: "생각 만들기",
      time: "5분",
      content: "탐구 맥락 형성",
      activities:
        "◎ 동기 유발: 거품 목욕제·발포 비타민 경험 나누기\n◎ [STW-See] 준비된 물질의 색·모양 관찰 기록\n◎ 학습 목표 확인",
      materials: "○ 알약, 발포 비타민 등\n※ 자유로운 분위기 조성",
    },
    {
      stage: "생각 모으기",
      time: "30분",
      content: "탐구하기",
      activities:
        "◎ [탐구] 물질 변신 동영상 촬영·관찰\n- [STW-See] 녹는 순간 변화 영상 기록\n- [STW-Think] 변화 추론\n- [STW-Wonder] 탐구 질문 생성\n◎ [Write & Feedback] STW 종합 글쓰기 + AI 피드백",
      materials: "○ 비커, 물, 스마트 기기, 활동지\n※ 유리 기구 파손·시식 주의\n※ AI: 질문 유도 역할",
    },
    {
      stage: "표현하기",
      time: "5분",
      content: "공유 및 성찰",
      activities:
        "◎ 편집 영상 학급 게시판 공유\n◎ [3-2-1 브리지] 수업 전후 생각 변화 확인",
      materials: "○ 학급 공유 플랫폼\n※ 관찰과 변화 까닭에 집중",
    },
  ],
};

export const CURRENT_UNIT_ID = "dissolution-solution";

export const CURRENT_UNIT_LABEL = "3. 용해와 용액";

export function getExperimentLessonSeed(period?: string): LessonPlanForm {
  const base = { ...EXPERIMENT_LESSON_SAMPLE };
  if (period?.trim()) {
    base.period = period.trim();
    base.planTitle = `[실험반] ${CURRENT_UNIT_LABEL} ${period.trim()}차시`;
  }
  return base;
}

export function mergeGeneratedLessonPlan(generated: Partial<LessonPlanForm>): LessonPlanForm {
  const rows =
    generated.processRows && generated.processRows.length > 0
      ? generated.processRows
      : [{ ...EMPTY_PROCESS_ROW }, { ...EMPTY_PROCESS_ROW }, { ...EMPTY_PROCESS_ROW }];

  return {
    ...EMPTY_LESSON_PLAN,
    ...generated,
    inquiryStages: generated.inquiryStages ?? EMPTY_LESSON_PLAN.inquiryStages,
    processRows: rows.map((r) => ({ ...EMPTY_PROCESS_ROW, ...r })),
  };
}
