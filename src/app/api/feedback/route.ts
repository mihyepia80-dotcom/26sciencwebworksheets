import { NextResponse } from "next/server";
import type { Answers, WorksheetMeta } from "@/lib/types";

const MODEL = "gemini-2.0-flash-lite";
const MAX_FEEDBACK_CHARS = 200;

type AiRating = "잘함" | "보통" | "노력요함";

interface FeedbackRequest {
  templateName: string;
  meta: WorksheetMeta;
  values: Answers;
}

function truncateFeedback(text: string): string {
  if (text.length <= MAX_FEEDBACK_CHARS) return text;
  return `${text.slice(0, MAX_FEEDBACK_CHARS - 1)}…`;
}

function parseGeminiJson(text: string): { rating: AiRating; feedback: string } {
  const cleaned = text
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .trim();
  const parsed = JSON.parse(cleaned) as { rating?: string; feedback?: string };

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
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI 서비스가 설정되지 않았습니다." }, { status: 503 });
  }

  let body: FeedbackRequest;
  try {
    body = (await request.json()) as FeedbackRequest;
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
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
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 300,
          },
        }),
      },
    );

    if (!geminiRes.ok) {
      return NextResponse.json({ error: "AI 응답을 받지 못했습니다." }, { status: 502 });
    }

    const geminiData = (await geminiRes.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const result = parseGeminiJson(rawText);

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "AI 피드백을 생성하지 못했습니다." }, { status: 500 });
  }
}
