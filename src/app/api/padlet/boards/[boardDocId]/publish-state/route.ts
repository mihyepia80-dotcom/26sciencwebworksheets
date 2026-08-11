import { NextResponse } from "next/server";
import { isTeacherAuthResponse, requireTeacherRequest } from "@/lib/auth/verify-teacher-request";
import { updateBoardPublishState } from "@/lib/padlet/board-registry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ boardDocId: string }> },
) {
  const teacher = await requireTeacherRequest(request);
  if (isTeacherAuthResponse(teacher)) return teacher;

  const { boardDocId } = await context.params;
  let body: { open?: boolean; allowRepublish?: boolean };
  try {
    body = (await request.json()) as { open?: boolean; allowRepublish?: boolean };
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  await updateBoardPublishState(boardDocId, {
    open: body.open !== false,
    allowRepublish: body.allowRepublish !== false,
  });

  return NextResponse.json({ ok: true });
}
