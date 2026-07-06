import { NextResponse } from "next/server";
import { isTeacherAuthResponse, requireTeacherRequest } from "@/lib/auth/verify-teacher-request";
import { PadletApiError } from "@/lib/padlet/errors";
import type { PadletBulletinColumnMode } from "@/lib/padlet/presets";
import { resolveBoardInstructions } from "@/lib/padlet/presets";
import type { PadletCreateBoardRequest } from "@/lib/padlet/types";
import {
  createAiRecipeBoard,
  getAiRecipeBoardStatus,
  isPadletConfigured,
  seedBulletinColumnPosts,
  waitForAiRecipeBoard,
} from "@/lib/padlet/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const teacher = await requireTeacherRequest(request);
  if (isTeacherAuthResponse(teacher)) return teacher;

  if (!isPadletConfigured()) {
    return NextResponse.json(
      { error: "Padlet API 키가 설정되지 않았습니다. Vercel 환경 변수 PADLET_API_KEY를 확인해 주세요." },
      { status: 503 },
    );
  }

  let body: PadletCreateBoardRequest;
  try {
    body = (await request.json()) as PadletCreateBoardRequest;
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const mode = body.mode;
  if (mode !== "sandbox" && mode !== "bulletin" && mode !== "custom") {
    return NextResponse.json({ error: "mode는 sandbox, bulletin, custom 중 하나여야 합니다." }, { status: 400 });
  }

  const columnMode: PadletBulletinColumnMode = body.columnMode === "numbers" ? "numbers" : "groups";
  const seedColumns = body.mode === "bulletin" && body.seedColumns !== false;

  try {
    const instructions = resolveBoardInstructions({
      mode,
      sandboxType: body.sandboxType,
      instructions: body.instructions,
      topic: body.topic,
      columnMode,
    });

    const created = await createAiRecipeBoard({
      instructions,
      role: body.role,
      workspaceId: body.workspaceId,
    });

    if (body.wait !== false) {
      const board = await waitForAiRecipeBoard(created.statusKey);
      let columnsApplied: number | undefined;
      let columnLabels: string[] | undefined;

      if (seedColumns) {
        const seeded = await seedBulletinColumnPosts(board.id, columnMode, body.topic ?? "");
        columnsApplied = seeded.columnsApplied;
        columnLabels = seeded.columnLabels;
      }

      return NextResponse.json({
        statusKey: created.statusKey,
        status: "success" as const,
        board,
        columnsApplied,
        columnLabels,
      });
    }

    const status = await getAiRecipeBoardStatus(created.statusKey);
    return NextResponse.json(
      {
        statusKey: created.statusKey,
        status: status.status,
        board: status.board,
      },
      { status: 202 },
    );
  } catch (error: unknown) {
    if (error instanceof PadletApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "패들렛 생성에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
