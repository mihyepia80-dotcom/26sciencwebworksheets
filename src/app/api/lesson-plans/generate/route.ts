import { NextResponse } from "next/server";
import { GeminiApiError, callGeminiText, parseGeminiJsonObject } from "@/lib/ai/gemini";
import {
  CURRENT_UNIT_LABEL,
  EXPERIMENT_LESSON_SAMPLE,
  LESSON_PLAN_FRAMEWORK_SUMMARY,
  mergeGeneratedLessonPlan,
} from "@/lib/lesson-plan/template-content";
import {
  DEFAULT_LESSON_UNIT_ID,
  getLessonUnit,
  getPeriodPreset,
  resolveUnitLabel,
} from "@/lib/lesson-plan/unit-curriculum";
import type { InquiryStages, LessonPlanForm, LessonProcessRow } from "@/lib/lesson-plan/types";

interface GenerateRequest {
  unitId?: string;
  unit?: string;
  period?: string;
  learningTopic?: string;
  achievementStandards?: string;
  instruction?: string;
  mode?: "experiment" | "framework-only";
}

function resolveGenerationContext(body: GenerateRequest) {
  const unitId = body.unitId?.trim() || DEFAULT_LESSON_UNIT_ID;
  const unitDef = getLessonUnit(unitId);
  const unit = body.unit?.trim() || resolveUnitLabel(unitId, body.unit);
  const period = body.period?.trim() || "1/8";
  const preset = getPeriodPreset(unitId, period);

  const learningTopic =
    body.learningTopic?.trim() ||
    preset?.learningTopic ||
    "";

  const achievementStandards =
    body.achievementStandards?.trim() ||
    preset?.achievementStandards ||
    unitDef.defaultAchievementStandards ||
    "해당 단원 교과서 성취기준을 반영하세요.";

  return {
    unitId,
    unit,
    unitDef,
    period,
    preset,
    learningTopic,
    achievementStandards,
  };
}

function buildPrompt(body: GenerateRequest): string {
  const ctx = resolveGenerationContext(body);
  const sample = JSON.stringify(EXPERIMENT_LESSON_SAMPLE, null, 0);
  const extra = body.instruction?.trim() ? `\n교사 추가 지시: ${body.instruction.trim()}` : "";
  const topicLine = ctx.learningTopic
    ? ctx.learningTopic
    : "(아래 단원·차시에 맞는 학습 주제를 교과서 수준으로 구체적으로 작성)";

  const unitContext = [
    ctx.unitDef.coreIdea ? `- 핵심 아이디어: ${ctx.unitDef.coreIdea}` : "",
    ctx.preset?.inquiryQuestions ? `- 탐구 질문 참고: ${ctx.preset.inquiryQuestions}` : "",
    ctx.preset?.thinkingTool ? `- 권장 사고도구: ${ctx.preset.thinkingTool}` : "",
    ctx.preset?.teachingModel ? `- 교수학습모형 참고: ${ctx.preset.teachingModel}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return `당신은 초등학교(5~6학년) 과학 개념기반 탐구 수업 설계 전문 교사입니다.
아래 설계 틀과 JSON 예시의 **구조·분량·작성 방식**을 참고하되, 내용은 반드시 입력된 단원·차시·학습 주제에 맞게 새로 작성하세요.
예시 JSON은 「3. 용해와 용액」 1차시이므로, 다른 단원·주제일 때 예시의 용어·실험·활동을 그대로 복사하지 마세요.

## 설계 틀
${LESSON_PLAN_FRAMEWORK_SUMMARY}

## JSON 구조 예시 (형식 참고용)
${sample}

## 이번에 작성할 수업 (최우선 반영)
- 단원: ${ctx.unit}
- 차시: ${ctx.period}
- 학습 주제: ${topicLine}
- 성취기준: ${ctx.achievementStandards}
${unitContext ? `\n## 단원·차시 맥락\n${unitContext}` : ""}
${extra}

요구사항:
- planTitle, unit, period, teachingModel, coreIdea 포함 — unit 필드는 반드시 「${ctx.unit}」
- inquiryStages: 해당 차시 주 탐구 단계 1개만 true (questioning/inquiring/generalizing/transferring/reflecting)
- learningTopic은 위 학습 주제와 일치하거나 더 구체화
- achievementStandards, learningObjectives, inquiryKnowledge, inquiryProcess, inquiryValues, inquiryQuestions
- thinkingTool: 주 사고도구 1개 (단원·주제에 맞게 선택)
- thinkingStep1~3, writingTask, writingContext, aiWebApp, usageTips, reflection
- evaluationKnowledge, evaluationProcess, evaluationValues
- processRows: 3행 (생각 만들기 5분 / 생각 모으기 30분 / 표현하기 5분) — 선택 단원·주제에 맞는 탐구·글쓰기 활동을 구체적으로
- 초등 과학 수업에 맞는 쉬운 한국어

반드시 아래 JSON 형식만 출력 (LessonPlanForm):
{
  "planTitle":"",
  "unit":"",
  "period":"",
  "teachingModel":"개념기반 탐구학습",
  "coreIdea":"",
  "inquiryStages":{"questioning":false,"inquiring":true,"generalizing":false,"transferring":false,"reflecting":false},
  "learningTopic":"",
  "achievementStandards":"",
  "learningObjectives":"",
  "inquiryKnowledge":"",
  "inquiryProcess":"",
  "inquiryValues":"",
  "inquiryQuestions":"",
  "activities":"",
  "writingTask":"",
  "thinkingTechnique":"탐구보고서 형식으로 쓰기",
  "thinkingStep1":"",
  "thinkingStep2":"",
  "thinkingStep3":"",
  "reflection":"",
  "evaluationKnowledge":"",
  "evaluationProcess":"",
  "evaluationValues":"",
  "thinkingTool":"",
  "reflectionThinkingTool":"",
  "templateSource":"사고도구 톡톡 웹앱",
  "writingContext":"",
  "aiWebApp":"",
  "usageTips":"",
  "processRows":[{"stage":"","time":"","content":"","activities":"","materials":""}]
}`;
}

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "AI 서비스가 설정되지 않았습니다." }, { status: 503 });
  }

  let body: GenerateRequest;
  try {
    body = (await request.json()) as GenerateRequest;
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  if (body.mode === "framework-only") {
    return NextResponse.json({
      framework: LESSON_PLAN_FRAMEWORK_SUMMARY,
      sample: EXPERIMENT_LESSON_SAMPLE,
      defaultUnitLabel: CURRENT_UNIT_LABEL,
    });
  }

  try {
    const raw = await callGeminiText(buildPrompt(body), {
      temperature: 0.5,
      maxOutputTokens: 4096,
    });
    const parsed = parseGeminiJsonObject<Partial<LessonPlanForm> & { inquiryStages?: InquiryStages; processRows?: LessonProcessRow[] }>(raw);
    const plan = mergeGeneratedLessonPlan(parsed);
    const ctx = resolveGenerationContext(body);
    if (!plan.unit?.trim()) plan.unit = ctx.unit;
    if (!plan.learningTopic?.trim() && ctx.learningTopic) plan.learningTopic = ctx.learningTopic;

    return NextResponse.json({ plan, source: "ai" as const });
  } catch (error: unknown) {
    if (error instanceof GeminiApiError && error.isQuotaExceeded) {
      return NextResponse.json(
        {
          error: error.message,
          geminiQuotaExceeded: true,
          retryAfterSeconds: error.retryAfterSeconds,
        },
        { status: 429 },
      );
    }
    const message = error instanceof Error ? error.message : "지도안 생성에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
