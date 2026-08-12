import { NextResponse } from "next/server";
import { isTeacherAuthResponse, requireTeacherRequest } from "@/lib/auth/verify-teacher-request";
import { PadletApiError } from "@/lib/padlet/errors";
import { getAiRecipeBoardStatus } from "@/lib/padlet/server";
import { requireTeacherPadletKey } from "@/lib/teacher/resolve-api-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ statusKey: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const teacher = await requireTeacherRequest(_request);
  if (isTeacherAuthResponse(teacher)) return teacher;

  const padletKey = await requireTeacherPadletKey(teacher.uid, teacher.email);
  if ("error" in padletKey) return padletKey.error;

  const { statusKey } = await context.params;
  if (!statusKey?.trim()) {
    return NextResponse.json({ error: "statusKey가 필요합니다." }, { status: 400 });
  }

  try {
    const result = await getAiRecipeBoardStatus(statusKey.trim(), padletKey.apiKey);
    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof PadletApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "패들렛 상태 조회에 실패했습니다." }, { status: 500 });
  }
}
