import { NextResponse } from "next/server";
import { getAiQuotaStatus } from "@/lib/ai/quota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentUid = searchParams.get("studentUid") ?? undefined;

  try {
    const status = await getAiQuotaStatus(studentUid);
    return NextResponse.json(status);
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
