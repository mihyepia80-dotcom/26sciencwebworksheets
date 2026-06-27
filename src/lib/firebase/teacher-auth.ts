"use client";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import {
  STUDENT_EMAIL_DOMAIN,
  TEACHER_ACCOUNT_EMAIL,
  TEACHER_EMAIL_DOMAIN,
  TEACHER_PASSWORD,
  getFirebaseTeacherPassword,
} from "@/lib/constants";
import { isFirebaseConfigured } from "./config";
import { getClientAuth, getClientDb } from "./client";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

function isStudentAccount(user: User): boolean {
  return Boolean(user.email?.endsWith(`@${STUDENT_EMAIL_DOMAIN}`));
}

function isTeacherAccount(user: User): boolean {
  return Boolean(user.email?.endsWith(`@${TEACHER_EMAIL_DOMAIN}`));
}

async function ensureTeacherSignInReady(): Promise<void> {
  const auth = getClientAuth();
  const current = auth.currentUser;
  if (current && isStudentAccount(current)) {
    await signOut(auth);
  }
}

export async function resolveAuthRole(user: User | null): Promise<AuthRole> {
  if (!user) return null;
  if (isTeacherAccount(user)) return "teacher";
  if (user.email?.endsWith(`@${STUDENT_EMAIL_DOMAIN}`)) return "student";
  return null;
}

async function ensureTeacherProfile(user: User): Promise<void> {
  await setDoc(
    doc(getClientDb(), "teachers", user.uid),
    {
      email: user.email ?? TEACHER_ACCOUNT_EMAIL,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function signInTeacher(password: string): Promise<User> {
  if (password !== TEACHER_PASSWORD) {
    throw new Error("암호가 올바르지 않습니다.");
  }

  await ensureTeacherSignInReady();

  const auth = getClientAuth();
  const firebasePassword = getFirebaseTeacherPassword();

  try {
    const result = await signInWithEmailAndPassword(auth, TEACHER_ACCOUNT_EMAIL, firebasePassword);
    await ensureTeacherProfile(result.user);
    return result.user;
  } catch (error: unknown) {
    const code = typeof error === "object" && error && "code" in error ? String((error as { code: string }).code) : "";
    if (code === "auth/user-not-found" || code === "auth/invalid-credential") {
      const created = await createUserWithEmailAndPassword(auth, TEACHER_ACCOUNT_EMAIL, firebasePassword);
      await ensureTeacherProfile(created.user);
      return created.user;
    }
    throw error;
  }
}

export async function signOutUser(): Promise<void> {
  await signOut(getClientAuth());
}

export async function checkIsTeacher(user: User): Promise<boolean> {
  return isTeacherAccount(user);
}

export type AuthRole = "student" | "teacher" | null;

export interface AppAuthState {
  user: User | null;
  role: AuthRole;
  loading: boolean;
}

export function subscribeAppAuth(onChange: (state: AppAuthState) => void) {
  if (!isFirebaseConfigured()) {
    onChange({ user: null, role: null, loading: false });
    return () => {};
  }

  const auth = getClientAuth();
  let active = true;

  onChange({ user: null, role: null, loading: true });

  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (!user) {
      if (active) onChange({ user: null, role: null, loading: false });
      return;
    }

    void resolveAuthRole(user)
      .then((role) => {
        if (active) onChange({ user, role, loading: false });
      })
      .catch(() => {
        if (active) onChange({ user, role: null, loading: false });
      });
  });

  return () => {
    active = false;
    unsubscribe();
  };
}
