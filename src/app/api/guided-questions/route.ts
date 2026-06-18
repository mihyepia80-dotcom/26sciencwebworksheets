import { NextResponse } from "next/server";
import { GeminiApiError, callGeminiText, parseGeminiJsonObject } from "@/lib/ai/gemini";
import { GUIDED_QUESTION_DEFAULT_COUNT } from "@/lib/guided-questions/types";

interface GenerateRequest {
  templateId: string;
  templateName: string;
  topic: string;
  unit?: string;
  grade?: string;
  inquiryQuestion?: string;
  writingContext?: string;
  count?: number;
}

function buildPrompt(body: GenerateRequest, count: number): string {
  return `당신은 초등학교(3~6학년) 과학 수업을 돕는 교사입니다.
사고도구 활동지 "${body.templateName}"에 맞는 유도 질문을 작성하세요.

활동 주제: ${body.topic.trim()}
단원: ${body.unit?.trim() || "없음"}
학년: ${body.grade?.trim() || "초등"}
글쓰기 상황: ${body.writingContext?.trim() || "없음"}
탐구 질문: ${body.inquiryQuestion?.trim() || "없음"}

요구사항:
- 초등학생이 이해할 수 있는 쉬운 한국어로 작성
- 주제와 직접 관련된 구체적인 질문 (추상적·일반적 질문 금지)
- 관찰, 예측, 비교, 원인, 탐구 계획 등을 이끌어내는 질문
- 각 질문은 한 문장, 40자 이내 권장
- 정확히 ${count}개의 질문

반드시 아래 JSON만 출력:
{"questions":["질문1","질문2","질문3","질문4"]}`;
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

  if (!body.templateId?.trim() || !body.templateName?.trim()) {
    return NextResponse.json({ error: "템플릿 정보가 없습니다." }, { status: 400 });
  }

  if (!body.topic?.trim() || body.topic.trim().length < 2) {
    return NextResponse.json({ error: "활동 주제를 2자 이상 입력하세요." }, { status: 400 });
  }

  const count = Math.min(Math.max(body.count ?? GUIDED_QUESTION_DEFAULT_COUNT, 3), 5);

  try {
    const raw = await callGeminiText(buildPrompt(body, count), {
      temperature: 0.5,
      maxOutputTokens: 400,
    });
    const parsed = parseGeminiJsonObject<{ questions?: string[] }>(raw);
    const questions = (parsed.questions ?? [])
      .map((q) => String(q).trim())
      .filter(Boolean)
      .slice(0, count);

    if (questions.length < 3) {
      return NextResponse.json({ error: "유도 질문을 충분히 생성하지 못했습니다." }, { status: 502 });
    }

    return NextResponse.json({ questions, source: "ai" as const });
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
    const message = error instanceof Error ? error.message : "유도 질문 생성에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
