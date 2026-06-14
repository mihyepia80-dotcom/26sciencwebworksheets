"use client";

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { STUDENT_EMAIL_DOMAIN, TEACHER_PASSWORD } from "@/lib/constants";
import { isFirebaseConfigured } from "./config";
import { getClientAuth } from "./client";
import { clearTeacherPinVerified, isTeacherPinVerified, setTeacherPinVerified } from "./teacher-pin";

function isGoogleUser(user: User): boolean {
  return user.providerData.some((provider) => provider.providerId === "google.com");
}

export function resolveAuthRole(user: User | null): AuthRole {
  if (!user) return null;
  if (isGoogleUser(user)) {
    return isTeacherPinVerified(user.uid) ? "teacher" : "teacher-pending";
  }
  if (user.email?.endsWith(`@${STUDENT_EMAIL_DOMAIN}`)) return "student";
  return null;
}

export async function signInTeacherWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(getClientAuth(), provider);
  return result.user;
}

export function verifyTeacherPassword(user: User, password: string): boolean {
  if (!isGoogleUser(user)) return false;
  if (password !== TEACHER_PASSWORD) return false;
  setTeacherPinVerified(user.uid);
  return true;
}

export async function signOutUser(): Promise<void> {
  clearTeacherPinVerified();
  await signOut(getClientAuth());
}

export async function checkIsTeacher(user: User): Promise<boolean> {
  return isGoogleUser(user) && isTeacherPinVerified(user.uid);
}

export type AuthRole = "student" | "teacher" | "teacher-pending" | null;

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

  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      if (active) onChange({ user: null, role: null, loading: false });
      return;
    }

    try {
      if (active) onChange({ user, role: resolveAuthRole(user), loading: false });
    } catch {
      if (active) onChange({ user, role: null, loading: false });
    }
  });

  return () => {
    active = false;
    unsubscribe();
  };
}
