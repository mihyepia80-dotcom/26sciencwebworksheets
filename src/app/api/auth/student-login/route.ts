import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { isValidAccessPin, normalizeAccessPin } from "@/lib/auth/pin";
import { normalizeClassPart, normalizeStudentNo } from "@/lib/group-activity/constants";
import { getAdminAuth, getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";

function getStudentAuthPassword(): string {
  const secret = process.env.STUDENT_AUTH_SECRET?.trim() || "sagodogu-student-internal";
  return `${secret}@sagodogu-internal`;
}

function buildStudentEmail(grade: string, classNo: string, studentNo: string): string {
  const slug = `${grade}-${classNo}-${studentNo}`.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();
  return `${slug}@sagodogu-student.app`;
}

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

interface StudentLoginBody {
  grade?: string;
  classNo?: string;
  studentNo?: string;
  studentName?: string;
  accessPin?: string;
}

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json({ error: "서버 인증 설정이 필요합니다." }, { status: 503 });
  }

  let body: StudentLoginBody;
  try {
    body = (await request.json()) as StudentLoginBody;
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const grade = String(body.grade ?? "").trim();
  const classNo = String(body.classNo ?? "").trim();
  const studentNo = String(body.studentNo ?? "").trim();
  const studentName = normalizeName(String(body.studentName ?? ""));
  const accessPin = normalizeAccessPin(String(body.accessPin ?? ""));

  if (!grade || !classNo || !studentNo || !studentName) {
    return NextResponse.json({ error: "학년·반·번호·이름을 모두 입력해 주세요." }, { status: 400 });
  }
  if (!isValidAccessPin(accessPin)) {
    return NextResponse.json({ error: "암호는 6자리 숫자만 입력할 수 있습니다." }, { status: 400 });
  }

  const normalizedGrade = normalizeClassPart(grade);
  const normalizedClassNo = normalizeClassPart(classNo);
  const normalizedNo = normalizeStudentNo(studentNo);

  try {
    const db = getAdminDb();
    const slotId = `${normalizedGrade}__${normalizedClassNo}__${normalizedNo}`.replace(/[^a-zA-Z0-9_-]/g, "_");
    const slotSnap = await db.collection("studentLoginSlots").doc(slotId).get();

    if (!slotSnap.exists) {
      return NextResponse.json(
        { error: "교사 명단에 등록되지 않은 학생입니다. 담임 선생님께 문의해 주세요." },
        { status: 403 },
      );
    }

    const slot = slotSnap.data() ?? {};
    const teacherUid = String(slot.teacherUid ?? "");
    const rosterName = normalizeName(String(slot.studentName ?? ""));

    if (rosterName && rosterName !== studentName) {
      return NextResponse.json({ error: "이름이 교사 명단과 일치하지 않습니다." }, { status: 403 });
    }

    const teacherSnap = await db.collection("teachers").doc(teacherUid).get();
    if (!teacherSnap.exists) {
      return NextResponse.json({ error: "담임 교사 정보를 찾을 수 없습니다." }, { status: 403 });
    }

    const teacherPin = String(teacherSnap.data()?.accessPin ?? "");
    if (!isValidAccessPin(teacherPin) || teacherPin !== accessPin) {
      return NextResponse.json({ error: "암호가 올바르지 않습니다." }, { status: 403 });
    }

    const email = buildStudentEmail(normalizedGrade, normalizedClassNo, normalizedNo);
    const auth = getAdminAuth();
    const firebasePassword = getStudentAuthPassword();

    let uid: string;
    try {
      const existing = await auth.getUserByEmail(email);
      uid = existing.uid;
      await auth.updateUser(uid, {
        password: firebasePassword,
        displayName: studentName,
      });
    } catch (error: unknown) {
      const code = typeof error === "object" && error && "code" in error ? String((error as { code: string }).code) : "";
      if (code !== "auth/user-not-found") {
        throw error;
      }
      const created = await auth.createUser({
        email,
        password: firebasePassword,
        displayName: studentName,
      });
      uid = created.uid;
    }

    await db.collection("students").doc(uid).set(
      {
        grade: normalizedGrade,
        classNo: normalizedClassNo,
        studentNo: normalizedNo,
        studentName,
        teacherUid,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    const customToken = await auth.createCustomToken(uid);
    return NextResponse.json({ customToken });
  } catch (error: unknown) {
    console.error("student-login failed", error);
    return NextResponse.json({ error: "로그인에 실패했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
}
