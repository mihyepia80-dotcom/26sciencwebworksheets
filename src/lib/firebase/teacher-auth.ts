"use client";

import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";
import { STUDENT_EMAIL_DOMAIN, TEACHER_PASSWORD } from "@/lib/constants";
import { isFirebaseConfigured } from "./config";
import { getClientAuth } from "./client";
import { clearTeacherPinVerified, isTeacherPinVerified, setTeacherPinVerified } from "./teacher-pin";

const REDIRECT_IN_PROGRESS = "REDIRECT_IN_PROGRESS";

const POPUP_FALLBACK_CODES = new Set([
  "auth/popup-blocked",
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
  "auth/operation-not-supported-in-this-environment",
]);

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

async function refreshUserProfile(user: User): Promise<void> {
  try {
    await user.reload();
  } catch {
    // 로그인은 성공했으나 reload 실패 시에도 세션은 유지됩니다.
  }
}

function isStudentAccount(user: User): boolean {
  return Boolean(user.email?.endsWith(`@${STUDENT_EMAIL_DOMAIN}`));
}

async function ensureTeacherGoogleSignInReady(): Promise<void> {
  const auth = getClientAuth();
  const current = auth.currentUser;
  if (current && isStudentAccount(current)) {
    await signOut(auth);
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

/** Google 리다이렉트 로그인 복귀 처리 (앱 시작 시 1회) */
export async function completeTeacherGoogleRedirect(): Promise<User | null> {
  const auth = getClientAuth();
  const result = await getRedirectResult(auth);
  if (!result?.user) return null;
  await refreshUserProfile(result.user);
  return result.user;
}

export async function signInTeacherWithGoogle(): Promise<User> {
  await ensureTeacherGoogleSignInReady();

  const auth = getClientAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    const result = await signInWithPopup(auth, provider);
    await refreshUserProfile(result.user);
    return result.user;
  } catch (error: unknown) {
    const code = (error as { code?: string }).code;
    if (code && POPUP_FALLBACK_CODES.has(code)) {
      await signInWithRedirect(auth, provider);
      throw new Error(REDIRECT_IN_PROGRESS);
    }
    throw error;
  }
}

export function isTeacherGoogleRedirectInProgress(error: unknown): boolean {
  return error instanceof Error && error.message === REDIRECT_IN_PROGRESS;
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

  void completeTeacherGoogleRedirect().catch(() => {
    // 리다이렉트 복귀가 아니면 무시
  });

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
