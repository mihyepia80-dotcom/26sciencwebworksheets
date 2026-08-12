import { NextResponse } from "next/server";
import type { Answers, WorksheetMeta } from "@/lib/types";
import { GeminiApiError, callGeminiText, parseGeminiJsonObject } from "@/lib/ai/gemini";
import { consumeAiQuota, getAiQuotaStatus } from "@/lib/ai/quota";
import { resolveGeminiApiKeyForStudent } from "@/lib/teacher/api-config";
import { STUDENT_TEACHER_GEMINI_MISSING_MESSAGE } from "@/lib/teacher/api-config-messages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FEEDBACK_CHARS = 200;

type AiRating = "잘함" | "보통" | "노력요함";

interface FeedbackRequest {
  studentUid: string;
  templateName: string;
  meta: WorksheetMeta;
  values: Answers;
}

function truncateFeedback(text: string): string {
  if (text.length <= MAX_FEEDBACK_CHARS) return text;
  return `${text.slice(0, MAX_FEEDBACK_CHARS - 1)}…`;
}

function parseGeminiJson(text: string): { rating: AiRating; feedback: string } {
  const parsed = parseGeminiJsonObject<{ rating?: string; feedback?: string }>(text);
  const rating =
    parsed.rating === "잘함" || parsed.rating === "보통" || parsed.rating === "노력요함"
      ? parsed.rating
      : "보통";

  const feedback = truncateFeedback(String(parsed.feedback ?? "").trim());
  if (!feedback) {
    throw new Error("피드백 내용이 비어 있습니다.");
  }

  return { rating, feedback };
}

export async function POST(request: Request) {
  let body: FeedbackRequest;
  try {
    body = (await request.json()) as FeedbackRequest;
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  if (!body.studentUid?.trim()) {
    return NextResponse.json({ error: "학생 정보가 없습니다." }, { status: 400 });
  }

  const geminiApiKey = await resolveGeminiApiKeyForStudent(body.studentUid.trim());
  if (!geminiApiKey) {
    return NextResponse.json({ error: STUDENT_TEACHER_GEMINI_MISSING_MESSAGE }, { status: 503 });
  }

  const quotaBefore = await getAiQuotaStatus(body.studentUid);
  if (!quotaBefore.available) {
    const message =
      quotaBefore.reason === "student"
        ? "오늘 AI 피드백은 학생 1인당 1회만 이용할 수 있습니다. 제출은 가능하지만 AI 피드백은 제공되지 않습니다."
        : "오늘 AI 무료 사용량(전체 100회)을 모두 사용했습니다. 내일 다시 이용해 주세요.";
    return NextResponse.json({ error: message, quotaExceeded: true }, { status: 429 });
  }

  const entries = Object.entries(body.values ?? {}).filter(([, value]) => value.trim().length > 0);
  if (entries.length === 0) {
    return NextResponse.json({ error: "평가할 내용이 없습니다." }, { status: 400 });
  }

  const contentSummary = entries
    .slice(0, 30)
    .map(([key, value]) => `${key}: ${value.slice(0, 300)}`)
    .join("\n");

  const prompt = `초등학생 사고도구 활동지 "${body.templateName}" 제출 내용을 평가하세요.
주제: ${body.meta?.topic || "없음"}

${contentSummary}

반드시 아래 JSON 형식만 출력하세요:
{
  "rating": "잘함" 또는 "보통" 또는 "노력요함",
  "feedback": "200자 이내 한국어 총평. 잘한 점과 보완할 점을 구체적으로 포함. 마지막에 [평어: 잘함] 형식으로 평어 표시"
}

feedback는 공백 포함 200자 이내로 작성하세요.`;

  try {
    const rawText = await callGeminiText(prompt, {
      temperature: 0.3,
      maxOutputTokens: 300,
      apiKey: geminiApiKey,
    });

    const result = parseGeminiJson(rawText);
    await consumeAiQuota(body.studentUid);
    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof GeminiApiError && error.isQuotaExceeded) {
      return NextResponse.json(
        {
          error:
            error.message ||
            "AI 피드백을 만들지 못했습니다. 활동지는 제출할 수 있습니다. 잠시 후 다시 시도해 주세요.",
          quotaExceeded: true,
          geminiQuotaExceeded: true,
          retryAfterSeconds: error.retryAfterSeconds,
        },
        { status: 429 },
      );
    }
    const message = error instanceof Error ? error.message : "AI 피드백을 생성하지 못했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
