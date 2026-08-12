import { NextResponse } from "next/server";
import { isTeacherAuthResponse, requireTeacherRequest } from "@/lib/auth/verify-teacher-request";
import { getTeacherApiStatus } from "@/lib/teacher/api-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const teacher = await requireTeacherRequest(request);
  if (isTeacherAuthResponse(teacher)) return teacher;

  const status = await getTeacherApiStatus(teacher.uid, teacher.email);
  return NextResponse.json({
    configured: status.padlet.configured,
    source: status.padlet.source,
    isPlatformAdmin: status.isPlatformAdmin,
  });
}
