import { NextResponse } from "next/server";
import { isTeacherAuthResponse, requireTeacherRequest } from "@/lib/auth/verify-teacher-request";
import { PadletApiError } from "@/lib/padlet/errors";
import type { PadletPostInput } from "@/lib/padlet/types";
import { createBoardPost } from "@/lib/padlet/server";
import { requireTeacherPadletKey } from "@/lib/teacher/resolve-api-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ boardId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  const teacher = await requireTeacherRequest(request);
  if (isTeacherAuthResponse(teacher)) return teacher;

  const padletKey = await requireTeacherPadletKey(teacher.uid, teacher.email);
  if ("error" in padletKey) return padletKey.error;

  const { boardId } = await context.params;
  if (!boardId?.trim()) {
    return NextResponse.json({ error: "boardId가 필요합니다." }, { status: 400 });
  }

  let body: PadletPostInput;
  try {
    body = (await request.json()) as PadletPostInput;
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  try {
    const post = await createBoardPost(boardId.trim(), body, padletKey.apiKey);
    return NextResponse.json({ post }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof PadletApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "게시글 작성에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
