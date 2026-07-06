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
import { doc, getDoc, serverTimestamp, setDoc, deleteDoc } from "firebase/firestore";
import { isValidAccessPin, normalizeAccessPin } from "@/lib/auth/pin";
import { STUDENT_EMAIL_DOMAIN } from "@/lib/constants";
import { isFirebaseConfigured } from "./config";
import { getClientAuth, getClientDb } from "./client";
import { clearTeacherPinVerified, isTeacherPinVerified, setTeacherPinVerified } from "./teacher-pin";

const REDIRECT_IN_PROGRESS = "REDIRECT_IN_PROGRESS";

let redirectResultPromise: Promise<User | null> | null = null;

const POPUP_FALLBACK_CODES = new Set([
  "auth/popup-blocked",
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
  "auth/operation-not-supported-in-this-environment",
  "auth/web-storage-unsupported",
]);

function shouldPreferGoogleRedirect(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") return false;
  return true;
}

async function syncTeacherProfileSafely(user: User): Promise<void> {
  try {
    await ensureTeacherProfile(user);
  } catch (error) {
    console.error("teacher profile sync failed", error);
  }
}

export interface TeacherProfile {
  email: string;
  displayName: string;
  accessPin: string | null;
}

function hasGoogleProviderData(user: User): boolean {
  return user.providerData.some((provider) => provider.providerId === "google.com");
}

async function isGoogleSignIn(user: User): Promise<boolean> {
  if (hasGoogleProviderData(user)) return true;
  try {
    const token = await user.getIdTokenResult();
    if (token.signInProvider === "google.com") return true;
    const firebase = token.claims.firebase as { sign_in_provider?: string } | undefined;
    return firebase?.sign_in_provider === "google.com";
  } catch {
    return false;
  }
}

async function refreshUserProfile(user: User): Promise<void> {
  try {
    await user.reload();
  } catch {
    /* ignore */
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

export async function getTeacherProfile(uid: string): Promise<TeacherProfile | null> {
  const snap = await getDoc(doc(getClientDb(), "teachers", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  const accessPin = data.accessPin != null ? String(data.accessPin) : null;
  return {
    email: String(data.email ?? ""),
    displayName: String(data.displayName ?? ""),
    accessPin: accessPin && accessPin.length > 0 ? accessPin : null,
  };
}

export async function teacherHasAccessPin(uid: string): Promise<boolean> {
  const profile = await getTeacherProfile(uid);
  return Boolean(profile?.accessPin && isValidAccessPin(profile.accessPin));
}

export async function saveTeacherAccessPin(user: User, pin: string): Promise<void> {
  if (!(await isGoogleSignIn(user))) {
    throw new Error("Google 로그인이 필요합니다.");
  }
  const normalized = normalizeAccessPin(pin);
  if (!isValidAccessPin(normalized)) {
    throw new Error("암호는 6자리 숫자만 입력할 수 있습니다.");
  }

  const profile = await getTeacherProfile(user.uid);
  const oldPin = profile?.accessPin;

  const pinRef = doc(getClientDb(), "studentAccessPins", normalized);
  const existingPin = await getDoc(pinRef);
  if (existingPin.exists() && String(existingPin.data().teacherUid ?? "") !== user.uid) {
    throw new Error("다른 교사가 이미 사용 중인 암호입니다. 다른 숫자를 선택해 주세요.");
  }

  if (oldPin && oldPin !== normalized && isValidAccessPin(oldPin)) {
    const oldPinRef = doc(getClientDb(), "studentAccessPins", oldPin);
    const oldPinSnap = await getDoc(oldPinRef);
    if (oldPinSnap.exists() && String(oldPinSnap.data().teacherUid ?? "") === user.uid) {
      await deleteDoc(oldPinRef);
    }
  }

  await setDoc(pinRef, {
    teacherUid: user.uid,
    updatedAt: serverTimestamp(),
  });

  await setDoc(
    doc(getClientDb(), "teachers", user.uid),
    {
      email: user.email ?? "",
      displayName: user.displayName ?? "",
      accessPin: normalized,
      accessPinSetAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function ensureTeacherProfile(user: User): Promise<void> {
  if (!(await isGoogleSignIn(user))) return;
  await setDoc(
    doc(getClientDb(), "teachers", user.uid),
    {
      email: user.email ?? "",
      displayName: user.displayName ?? "",
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function prepareTeacherFirestoreAccess(user: User): Promise<void> {
  await user.getIdToken(true);
  await ensureTeacherProfile(user);
}

export async function resolveAuthRole(user: User | null): Promise<AuthRole> {
  if (!user) return null;
  if (await isGoogleSignIn(user)) {
    return isTeacherPinVerified(user.uid) ? "teacher" : "teacher-pending";
  }
  if (user.email?.endsWith(`@${STUDENT_EMAIL_DOMAIN}`)) return "student";
  return null;
}

export async function completeTeacherGoogleRedirect(): Promise<User | null> {
  if (!redirectResultPromise) {
    redirectResultPromise = (async () => {
      const auth = getClientAuth();
      const result = await getRedirectResult(auth);
      if (!result?.user) return null;
      await refreshUserProfile(result.user);
      await syncTeacherProfileSafely(result.user);
      return result.user;
    })();
  }
  return redirectResultPromise;
}

export async function signInTeacherWithGoogle(): Promise<User> {
  await ensureTeacherGoogleSignInReady();

  const auth = getClientAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  if (shouldPreferGoogleRedirect()) {
    await signInWithRedirect(auth, provider);
    throw new Error(REDIRECT_IN_PROGRESS);
  }

  try {
    const result = await signInWithPopup(auth, provider);
    await refreshUserProfile(result.user);
    await syncTeacherProfileSafely(result.user);
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

export async function verifyTeacherAccessPin(user: User, pin: string): Promise<boolean> {
  if (!(await isGoogleSignIn(user))) return false;
  const normalized = normalizeAccessPin(pin);
  if (!isValidAccessPin(normalized)) return false;

  const profile = await getTeacherProfile(user.uid);
  if (!profile?.accessPin) return false;
  if (profile.accessPin !== normalized) return false;

  setTeacherPinVerified(user.uid);
  return true;
}

export async function setupTeacherAccessPin(user: User, pin: string, confirmPin: string): Promise<void> {
  const normalized = normalizeAccessPin(pin);
  const normalizedConfirm = normalizeAccessPin(confirmPin);
  if (!isValidAccessPin(normalized)) {
    throw new Error("암호는 6자리 숫자만 입력할 수 있습니다.");
  }
  if (normalized !== normalizedConfirm) {
    throw new Error("암호 확인이 일치하지 않습니다.");
  }

  await saveTeacherAccessPin(user, normalized);
  setTeacherPinVerified(user.uid);
}

export async function resetTeacherAccessPin(user: User, pin: string, confirmPin: string): Promise<void> {
  await setupTeacherAccessPin(user, pin, confirmPin);
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
  let unsubscribe: (() => void) | null = null;

  onChange({ user: null, role: null, loading: true });

  void (async () => {
    try {
      await completeTeacherGoogleRedirect();
    } catch (error) {
      console.error("Google redirect login failed", error);
    }

    if (!active) return;

    unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        if (active) onChange({ user: null, role: null, loading: false });
        return;
      }

      void resolveAuthRole(user)
        .then(async (role) => {
          if (role === "teacher" || role === "teacher-pending") {
            try {
              await prepareTeacherFirestoreAccess(user);
            } catch (error) {
              console.error("teacher firestore access failed", error);
            }
          }
          if (active) onChange({ user, role, loading: false });
        })
        .catch(() => {
          if (active) onChange({ user, role: null, loading: false });
        });
    });
  })();

  return () => {
    active = false;
    unsubscribe?.();
  };
}
