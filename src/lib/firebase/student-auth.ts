"use client";

import {
  signInWithCustomToken,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, getDocs, collection, limit, query, where } from "firebase/firestore";
import { isValidAccessPin, normalizeAccessPin } from "@/lib/auth/pin";
import { STUDENT_EMAIL_DOMAIN } from "@/lib/constants";
import { parseApiJsonResponse } from "@/lib/api/parse-json-response";
import { getClientAuth, getClientDb } from "./client";

export interface StudentProfile {
  grade: string;
  classNo: string;
  studentNo: string;
  studentName: string;
  teacherUid?: string;
}

export interface StudentRecord extends StudentProfile {
  uid: string;
}

export function buildStudentEmail(grade: string, classNo: string, studentNo: string): string {
  const slug = `${grade}-${classNo}-${studentNo}`.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase();
  return `${slug}@${STUDENT_EMAIL_DOMAIN}`;
}

export async function getStudentProfile(uid: string): Promise<StudentProfile | null> {
  const snap = await getDoc(doc(getClientDb(), "students", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    grade: String(data.grade ?? ""),
    classNo: String(data.classNo ?? ""),
    studentNo: String(data.studentNo ?? ""),
    studentName: String(data.studentName ?? ""),
    teacherUid: data.teacherUid ? String(data.teacherUid) : undefined,
  };
}

export async function listStudentsForTeacher(teacherUid: string, max = 500): Promise<StudentRecord[]> {
  const snap = await getDocs(
    query(collection(getClientDb(), "students"), where("teacherUid", "==", teacherUid), limit(max)),
  );
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        uid: d.id,
        grade: String(data.grade ?? ""),
        classNo: String(data.classNo ?? ""),
        studentNo: String(data.studentNo ?? ""),
        studentName: String(data.studentName ?? ""),
        teacherUid: String(data.teacherUid ?? teacherUid),
      };
    })
    .filter((s) => s.studentName.trim())
    .sort((a, b) => {
      const g = a.grade.localeCompare(b.grade, "ko");
      if (g !== 0) return g;
      const c = a.classNo.localeCompare(b.classNo, "ko", { numeric: true });
      if (c !== 0) return c;
      return a.studentNo.localeCompare(b.studentNo, "ko", { numeric: true });
    });
}

export async function checkIsStudent(user: User): Promise<boolean> {
  if (user.email?.endsWith(`@${STUDENT_EMAIL_DOMAIN}`)) return true;
  const profile = await getStudentProfile(user.uid);
  return profile !== null;
}

export async function signInStudent(profile: StudentProfile, accessPin: string): Promise<User> {
  const normalizedPin = normalizeAccessPin(accessPin);
  if (!isValidAccessPin(normalizedPin)) {
    throw new Error("암호는 6자리 숫자만 입력할 수 있습니다.");
  }

  const auth = getClientAuth();
  const current = auth.currentUser;
  if (current && !current.email?.endsWith(`@${STUDENT_EMAIL_DOMAIN}`)) {
    await signOut(auth);
  }

  const response = await fetch("/api/auth/student-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grade: profile.grade,
      classNo: profile.classNo,
      studentNo: profile.studentNo,
      studentName: profile.studentName,
      accessPin: normalizedPin,
    }),
  });

  const payload = await parseApiJsonResponse<{ customToken?: string; error?: string }>(
    response,
    "서버 연결에 문제가 있습니다. 배포 환경에 FIREBASE_SERVICE_ACCOUNT_JSON이 설정되어 있는지 확인해 주세요.",
  );
  if (!response.ok || !payload.customToken) {
    throw new Error(payload.error || "로그인에 실패했습니다.");
  }

  const result = await signInWithCustomToken(auth, payload.customToken);
  if (profile.studentName) {
    await updateProfile(result.user, { displayName: profile.studentName });
  }
  return result.user;
}
