import { NextResponse } from "next/server";
import { isTeacherAuthResponse, requireTeacherRequest } from "@/lib/auth/verify-teacher-request";
import { PadletApiError } from "@/lib/padlet/errors";
import { getBoardById, isPadletConfigured } from "@/lib/padlet/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ boardId: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const teacher = await requireTeacherRequest(request);
  if (isTeacherAuthResponse(teacher)) return teacher;

  if (!isPadletConfigured()) {
    return NextResponse.json(
      { error: "Padlet API 키가 설정되지 않았습니다. Vercel 환경 변수 PADLET_API_KEY를 확인해 주세요." },
      { status: 503 },
    );
  }

  const { boardId } = await context.params;
  if (!boardId?.trim()) {
    return NextResponse.json({ error: "boardId가 필요합니다." }, { status: 400 });
  }

  try {
    const board = await getBoardById(boardId.trim());
    return NextResponse.json({ board });
  } catch (error: unknown) {
    if (error instanceof PadletApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "패들렛 게시판 조회에 실패했습니다." }, { status: 500 });
  }
}
