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

function hasGoogleProviderData(user: User): boolean {
  return user.providerData.some((provider) => provider.providerId === "google.com");
}

async function isGoogleSignIn(user: User): Promise<boolean> {
  if (hasGoogleProviderData(user)) return true;
  try {
    const { signInProvider } = await user.getIdTokenResult();
    return signInProvider === "google.com";
  } catch {
    return false;
  }
}

export async function resolveAuthRole(user: User | null): Promise<AuthRole> {
  if (!user) return null;
  if (await isGoogleSignIn(user)) {
    return isTeacherPinVerified(user.uid) ? "teacher" : "teacher-pending";
  }
  if (user.email?.endsWith(`@${STUDENT_EMAIL_DOMAIN}`)) return "student";
  return null;
}

export async function signInTeacherWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(getClientAuth(), provider);
  await result.user.reload();
  return result.user;
}

export async function verifyTeacherPassword(user: User, password: string): Promise<boolean> {
  if (!(await isGoogleSignIn(user))) return false;
  if (password !== TEACHER_PASSWORD) return false;
  setTeacherPinVerified(user.uid);
  return true;
}

export async function signOutUser(): Promise<void> {
  clearTeacherPinVerified();
  await signOut(getClientAuth());
}

export async function checkIsTeacher(user: User): Promise<boolean> {
  return (await isGoogleSignIn(user)) && isTeacherPinVerified(user.uid);
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
