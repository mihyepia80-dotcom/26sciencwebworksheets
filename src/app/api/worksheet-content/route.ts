import { NextResponse } from "next/server";
import { GeminiApiError, callGeminiText, parseGeminiJsonObject } from "@/lib/ai/gemini";
import { getWorksheetContentSchema } from "@/lib/worksheet-content/registry";

interface ReviseRequest {
  templateId: string;
  templateName: string;
  fields: Record<string, string>;
  instruction?: string;
  topic?: string;
  unit?: string;
}

const MAIN_FIELD_KEYS = new Set(["unit", "topic", "writingGuide", "reminder1", "reminder2"]);

function buildPrompt(body: ReviseRequest): string {
  const schema = getWorksheetContentSchema(body.templateId);
  const editableKeys =
    schema?.fields
      .map((f) => f.key)
      .filter((key) => !key.startsWith("hint_") || body.instruction?.includes("입력")) ?? [];

  const fieldLines = editableKeys
    .map((key) => {
      const label = schema?.fields.find((f) => f.key === key)?.label ?? key;
      const value = body.fields[key] ?? "";
      return `- ${key} (${label}): ${value || "(비어 있음)"}`;
    })
    .join("\n");

  const extraInstruction = body.instruction?.trim()
    ? `\n교사 추가 지시: ${body.instruction.trim()}`
    : "\n교사 추가 지시: 초등 과학 수업에 맞게 문장을 다듬고, 학생이 이해하기 쉬운 한국어로 정리하세요.";

  return `당신은 초등학교(3~6학년) 과학 수업을 돕는 교사입니다.
사고도구 활동지 "${body.templateName}"의 고정 안내 문구를 수정하세요.

단원: ${body.unit?.trim() || "미지정"}
학습 주제: ${body.topic?.trim() || body.fields.topic?.trim() || "미지정"}
${extraInstruction}

현재 문구:
${fieldLines}

요구사항:
- 초등학생이 이해할 수 있는 쉬운 한국어
- 과학 수업·탐구 활동 맥락에 맞는 구체적 표현
- 각 필드의 의미와 역할을 유지
- 빈 필드는 주제·단원 맥락에 맞게 새로 작성 가능
- hint_ 로 시작하는 입력 안내 필드는 placeholder 성격의 짧은 예시 문장

반드시 아래 JSON만 출력 (키는 입력과 동일):
{"fields":{"키":"수정된 문구",...}}`;
}

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: "AI 서비스가 설정되지 않았습니다." }, { status: 503 });
  }

  let body: ReviseRequest;
  try {
    body = (await request.json()) as ReviseRequest;
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  if (!body.templateId?.trim() || !body.templateName?.trim()) {
    return NextResponse.json({ error: "템플릿 정보가 없습니다." }, { status: 400 });
  }

  const schema = getWorksheetContentSchema(body.templateId);
  if (!schema) {
    return NextResponse.json({ error: "지원하지 않는 학습지입니다." }, { status: 400 });
  }

  const fields = body.fields ?? {};
  const hasContent = Object.entries(fields).some(
    ([key, value]) => value.trim() && (MAIN_FIELD_KEYS.has(key) || !key.startsWith("hint_")),
  );
  if (!hasContent && !body.instruction?.trim() && !body.topic?.trim()) {
    return NextResponse.json(
      { error: "수정할 문구, 주제, 또는 AI 지시를 입력하세요." },
      { status: 400 },
    );
  }

  try {
    const raw = await callGeminiText(buildPrompt(body), {
      temperature: 0.45,
      maxOutputTokens: 2048,
    });
    const parsed = parseGeminiJsonObject<{ fields?: Record<string, string> }>(raw);
    const revised = parsed.fields ?? {};
    const allowedKeys = new Set(schema.fields.map((f) => f.key));
    const merged: Record<string, string> = { ...fields };
    for (const [key, value] of Object.entries(revised)) {
      if (allowedKeys.has(key) && String(value).trim()) {
        merged[key] = String(value).trim();
      }
    }

    return NextResponse.json({ fields: merged, source: "ai" as const });
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
    const message = error instanceof Error ? error.message : "AI 문구 수정에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
