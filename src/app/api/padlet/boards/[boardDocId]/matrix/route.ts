import { NextResponse } from "next/server";
import { isTeacherAuthResponse, requireTeacherRequest } from "@/lib/auth/verify-teacher-request";
import { getPadletBoardDoc, listPadletPostsForBoard } from "@/lib/padlet/board-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ boardDocId: string }> },
) {
  const teacher = await requireTeacherRequest(request);
  if (isTeacherAuthResponse(teacher)) return teacher;

  const { boardDocId } = await context.params;
  const board = await getPadletBoardDoc(boardDocId);
  if (!board) {
    return NextResponse.json({ error: "보드를 찾을 수 없습니다." }, { status: 404 });
  }

  const posts = await listPadletPostsForBoard(boardDocId);
  return NextResponse.json({ board, posts });
}
