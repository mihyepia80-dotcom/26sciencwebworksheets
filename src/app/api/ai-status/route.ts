import { NextResponse } from "next/server";
import { getAiQuotaStatus } from "@/lib/ai/quota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentUid = searchParams.get("studentUid") ?? undefined;
  const unitId = searchParams.get("unitId") ?? undefined;
  const period = searchParams.get("period") ?? undefined;

  try {
    const status = await getAiQuotaStatus(studentUid);
    const { getQuestionBotQuotaStatus } = await import("@/lib/inquiry-question-bot/quota");
    const qb = await getQuestionBotQuotaStatus(studentUid, unitId ?? undefined, period ?? undefined);
    return NextResponse.json({
      ...status,
      questionBot: {
        enabled: qb.enabled,
        turnsLeftThisPeriod: qb.turnsLeftThisPeriod,
        turnsLeftToday: qb.turnsLeftToday,
      },
    });
  } catch {
    return NextResponse.json({
      available: false,
      studentUsed: 1,
      studentLimit: 1,
      studentRemaining: 0,
      globalUsed: 100,
      globalLimit: 100,
      globalRemaining: 0,
      reason: "global",
    });
  }
}
