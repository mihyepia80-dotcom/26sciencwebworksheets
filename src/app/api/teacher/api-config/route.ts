import { NextResponse } from "next/server";
import { isTeacherAuthResponse, requireTeacherRequest } from "@/lib/auth/verify-teacher-request";
import {
  getTeacherApiStatus,
  saveTeacherApiSecrets,
} from "@/lib/teacher/api-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const teacher = await requireTeacherRequest(request);
  if (isTeacherAuthResponse(teacher)) return teacher;

  const status = await getTeacherApiStatus(teacher.uid, teacher.email);
  return NextResponse.json(status);
}

interface SaveBody {
  geminiApiKey?: string | null;
  padletApiKey?: string | null;
}

export async function PUT(request: Request) {
  const teacher = await requireTeacherRequest(request);
  if (isTeacherAuthResponse(teacher)) return teacher;

  const status = await getTeacherApiStatus(teacher.uid, teacher.email);
  if (status.isPlatformAdmin) {
    return NextResponse.json(
      {
        error: "플랫폼 관리자 계정은 서버 공용 API 키를 사용합니다. 개인 키를 등록할 필요가 없습니다.",
      },
      { status: 400 },
    );
  }

  let body: SaveBody;
  try {
    body = (await request.json()) as SaveBody;
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  if (body.geminiApiKey === undefined && body.padletApiKey === undefined) {
    return NextResponse.json({ error: "저장할 API 키가 없습니다." }, { status: 400 });
  }

  await saveTeacherApiSecrets(teacher.uid, {
    geminiApiKey: body.geminiApiKey,
    padletApiKey: body.padletApiKey,
  });

  const next = await getTeacherApiStatus(teacher.uid, teacher.email);
  return NextResponse.json({ ok: true, ...next });
}
