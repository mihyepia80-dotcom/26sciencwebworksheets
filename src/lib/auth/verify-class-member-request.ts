import { NextResponse } from "next/server";
import { getAdminDb, getAdminAuth, isAdminConfigured } from "@/lib/firebase/admin";

export type ClassMember = {
  uid: string;
  role: "teacher" | "student";
  email?: string;
  studentNo?: number;
  grade?: number;
  classNo?: number;
};

export async function requireClassMemberRequest(
  request: Request,
): Promise<ClassMember | NextResponse> {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "서버 인증 설정이 필요합니다." }, { status: 503 });
  }

  const header = request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const decoded = await (await getAdminAuth()).verifyIdToken(header.slice(7).trim());
    const provider =
      decoded.firebase && typeof decoded.firebase === "object" && "sign_in_provider" in decoded.firebase
        ? String((decoded.firebase as { sign_in_provider?: string }).sign_in_provider ?? "")
        : "";

    if (provider === "google.com") {
      return { uid: decoded.uid, role: "teacher", email: decoded.email };
    }

    const db = await getAdminDb();
    const snap = await db.collection("students").doc(decoded.uid).get();
    if (!snap.exists) {
      return NextResponse.json({ error: "학생 프로필을 찾을 수 없습니다." }, { status: 403 });
    }
    const data = snap.data() ?? {};
    return {
      uid: decoded.uid,
      role: "student",
      studentNo: Number(data.studentNo) || undefined,
      grade: Number(data.grade) || undefined,
      classNo: Number(data.classNo) || undefined,
    };
  } catch {
    return NextResponse.json({ error: "인증 토큰이 유효하지 않습니다." }, { status: 401 });
  }
}

export function isClassMemberAuthResponse(value: ClassMember | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}
