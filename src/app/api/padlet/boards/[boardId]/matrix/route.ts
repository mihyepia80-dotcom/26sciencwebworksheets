import { NextResponse } from "next/server";
import { isTeacherAuthResponse, requireTeacherRequest } from "@/lib/auth/verify-teacher-request";
import { getPadletBoardDoc, listPadletPostsForBoard } from "@/lib/padlet/board-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ boardId: string }> },
) {
  const teacher = await requireTeacherRequest(request);
  if (isTeacherAuthResponse(teacher)) return teacher;

  const { boardId } = await context.params;
  const board = await getPadletBoardDoc(boardId);
  if (!board) {
    return NextResponse.json({ error: "보드를 찾을 수 없습니다." }, { status: 404 });
  }

  const posts = await listPadletPostsForBoard(boardId);
  return NextResponse.json({ board, posts });
}
