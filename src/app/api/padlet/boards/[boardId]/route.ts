import { NextResponse } from "next/server";
import { isTeacherAuthResponse, requireTeacherRequest } from "@/lib/auth/verify-teacher-request";
import { PadletApiError } from "@/lib/padlet/errors";
import { getBoardById } from "@/lib/padlet/server";
import { requireTeacherPadletKey } from "@/lib/teacher/resolve-api-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ boardId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const teacher = await requireTeacherRequest(request);
  if (isTeacherAuthResponse(teacher)) return teacher;

  const padletKey = await requireTeacherPadletKey(teacher.uid, teacher.email);
  if ("error" in padletKey) return padletKey.error;

  const { boardId } = await context.params;
  if (!boardId?.trim()) {
    return NextResponse.json({ error: "boardId가 필요합니다." }, { status: 400 });
  }

  try {
    const board = await getBoardById(boardId.trim(), padletKey.apiKey);
    return NextResponse.json({ board });
  } catch (error: unknown) {
    if (error instanceof PadletApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "패들렛 게시판 조회에 실패했습니다." }, { status: 500 });
  }
}
