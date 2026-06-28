import { NextResponse } from "next/server";
import { GeminiApiError, callGeminiText, parseGeminiJsonObject } from "@/lib/ai/gemini";
import {
  CURRENT_UNIT_LABEL,
  EXPERIMENT_LESSON_SAMPLE,
  LESSON_PLAN_FRAMEWORK_SUMMARY,
  mergeGeneratedLessonPlan,
} from "@/lib/lesson-plan/template-content";
import type { InquiryStages, LessonPlanForm, LessonProcessRow } from "@/lib/lesson-plan/types";

interface GenerateRequest {
  unit?: string;
  period?: string;
  learningTopic?: string;
  achievementStandards?: string;
  instruction?: string;
  mode?: "experiment" | "framework-only";
}

function buildPrompt(body: GenerateRequest): string {
  const unit = body.unit?.trim() || CURRENT_UNIT_LABEL;
  const period = body.period?.trim() || "1/12";
  const sample = JSON.stringify(EXPERIMENT_LESSON_SAMPLE, null, 0);
  const extra = body.instruction?.trim() ? `\n교사 추가 지시: ${body.instruction.trim()}` : "";

  return `당신은 초등학교(5~6학년) 과학 개념기반 탐구 수업 설계 전문 교사입니다.
아래 지도안 설계 틀과 실험반 지도안 예시를 참고하여, "${unit}" 단원 ${period}차시 실험반 교수학습지도안을 작성하세요.

## 설계 틀
${LESSON_PLAN_FRAMEWORK_SUMMARY}

## 실험반 지도안 예시 (JSON)
${sample}

입력:
- 단원: ${unit}
- 차시: ${period}
- 학습 주제: ${body.learningTopic?.trim() || "(예시와 유사 주제로 작성)"}
- 성취기준: ${body.achievementStandards?.trim() || "[6과03-01] 용해 관련 성취기준 활용"}
${extra}

요구사항:
- planTitle, unit, period, teachingModel, coreIdea 포함
- inquiryStages: 해당 차시 주 탐구 단계 1개만 true (questioning/inquiring/generalizing/transferring/reflecting)
- learningTopic, achievementStandards, learningObjectives, inquiryKnowledge, inquiryProcess, inquiryValues, inquiryQuestions
- thinkingTool: 주 사고도구 1개 (예: See/Think/Wonder, GSCE, CSQ 등)
- thinkingStep1~3, writingTask, writingContext, aiWebApp, usageTips, reflection
- evaluationKnowledge, evaluationProcess, evaluationValues
- processRows: 3행 (생각 만들기 5분 / 생각 모으기 30분 / 표현하기 5분) — activities에 STW·실험·AI 피드백 구체적으로
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
    });
  }

  try {
    const raw = await callGeminiText(buildPrompt(body), {
      temperature: 0.5,
      maxOutputTokens: 4096,
    });
    const parsed = parseGeminiJsonObject<Partial<LessonPlanForm> & { inquiryStages?: InquiryStages; processRows?: LessonProcessRow[] }>(raw);
    const plan = mergeGeneratedLessonPlan(parsed);

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
