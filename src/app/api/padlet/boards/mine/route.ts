import { NextResponse } from "next/server";
import {
  isClassMemberAuthResponse,
  requireClassMemberRequest,
} from "@/lib/auth/verify-class-member-request";
import { findPadletBoardForClass, listStudentPadletPosts } from "@/lib/padlet/board-registry";
import { DEFAULT_UNIT_ID } from "@/lib/padlet/padlet-fields";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const member = await requireClassMemberRequest(request);
  if (isClassMemberAuthResponse(member)) return member;

  const { searchParams } = new URL(request.url);
  const grade = Number(searchParams.get("grade") ?? member.grade ?? 0);
  const classNo = Number(searchParams.get("classNo") ?? member.classNo ?? 0);
  const unitId = searchParams.get("unitId")?.trim() || DEFAULT_UNIT_ID;
  const period = Number(searchParams.get("period") ?? 1);

  if (!grade || !classNo) {
    return NextResponse.json({ board: null });
  }

  const board = await findPadletBoardForClass({ grade, classNo, unitId, period });
  if (!board) {
    return NextResponse.json({ board: null });
  }

  let myPosts: Array<{ period: number; status: string; postUrl: string | null }> = [];
  if (member.role === "student") {
    const posts = await listStudentPadletPosts(member.uid);
    myPosts = posts
      .filter((p) => p.boardDocId === board.id)
      .map((p) => ({ period: p.period, status: p.status, postUrl: p.postUrl }));
  }

  return NextResponse.json({
    board: {
      boardDocId: board.id,
      boardUrl: board.boardUrl,
      title: board.title,
      publishOpen: board.publish.open,
      allowRepublish: board.publish.allowRepublish,
      myPosts,
    },
  });
}
