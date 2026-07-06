import { NextResponse } from "next/server";
import { getAdminAuth, isAdminConfigured } from "@/lib/firebase/admin";

export type VerifiedTeacher = {
  uid: string;
  email?: string;
};

export async function requireTeacherRequest(
  request: Request,
): Promise<VerifiedTeacher | NextResponse> {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "서버 인증 설정이 필요합니다. FIREBASE_SERVICE_ACCOUNT_JSON을 확인해 주세요." },
      { status: 503 },
    );
  }

  const header = request.headers.get("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "교사 로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const decoded = await (await getAdminAuth()).verifyIdToken(header.slice(7).trim());
    const provider =
      decoded.firebase && typeof decoded.firebase === "object" && "sign_in_provider" in decoded.firebase
        ? String((decoded.firebase as { sign_in_provider?: string }).sign_in_provider ?? "")
        : "";
    if (provider !== "google.com") {
      return NextResponse.json({ error: "Google 교사 로그인이 필요합니다." }, { status: 403 });
    }
    return { uid: decoded.uid, email: decoded.email };
  } catch {
    return NextResponse.json({ error: "인증 토큰이 유효하지 않습니다." }, { status: 401 });
  }
}

export function isTeacherAuthResponse(value: VerifiedTeacher | NextResponse): value is NextResponse {
  return value instanceof NextResponse;
}
