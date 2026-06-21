"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  type User,
} from "firebase/auth";
import { doc, getDoc, getDocs, collection, limit, query, serverTimestamp, setDoc } from "firebase/firestore";
import { getFirebaseStudentPassword, STUDENT_EMAIL_DOMAIN, STUDENT_PASSWORD } from "@/lib/constants";
import { getClientAuth, getClientDb } from "./client";

export interface StudentProfile {
  grade: string;
  classNo: string;
  studentNo: string;
  studentName: string;
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
  };
}

export async function listStudentsForTeacher(max = 500): Promise<StudentRecord[]> {
  const snap = await getDocs(query(collection(getClientDb(), "students"), limit(max)));
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        uid: d.id,
        grade: String(data.grade ?? ""),
        classNo: String(data.classNo ?? ""),
        studentNo: String(data.studentNo ?? ""),
        studentName: String(data.studentName ?? ""),
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

async function saveStudentProfile(uid: string, profile: StudentProfile): Promise<void> {
  await setDoc(
    doc(getClientDb(), "students", uid),
    { ...profile, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function checkIsStudent(user: User): Promise<boolean> {
  if (user.email?.endsWith(`@${STUDENT_EMAIL_DOMAIN}`)) return true;
  const profile = await getStudentProfile(user.uid);
  return profile !== null;
}

export async function signInStudent(profile: StudentProfile, password: string): Promise<User> {
  if (password !== STUDENT_PASSWORD) {
    throw new Error("암호가 올바르지 않습니다.");
  }

  const email = buildStudentEmail(profile.grade, profile.classNo, profile.studentNo);
  const auth = getClientAuth();
  const firebasePassword = getFirebaseStudentPassword();

  try {
    const result = await signInWithEmailAndPassword(auth, email, firebasePassword);
    await saveStudentProfile(result.user.uid, profile);
    if (profile.studentName) {
      await updateProfile(result.user, { displayName: profile.studentName });
    }
    return result.user;
  } catch (error: unknown) {
    const code = typeof error === "object" && error && "code" in error ? String((error as { code: string }).code) : "";
    if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
      const created = await createUserWithEmailAndPassword(auth, email, firebasePassword);
      await saveStudentProfile(created.user.uid, profile);
      await updateProfile(created.user, { displayName: profile.studentName || profile.studentNo });
      return created.user;
    }
    throw error;
  }
}
