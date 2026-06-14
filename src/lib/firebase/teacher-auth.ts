"use client";

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { STUDENT_EMAIL_DOMAIN } from "@/lib/constants";
import { isFirebaseConfigured } from "./config";
import { getClientAuth } from "./client";

function isGoogleUser(user: User): boolean {
  return user.providerData.some((provider) => provider.providerId === "google.com");
}

export async function signInTeacherWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const result = await signInWithPopup(getClientAuth(), provider);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(getClientAuth());
}

export async function checkIsTeacher(user: User): Promise<boolean> {
  return isGoogleUser(user);
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

  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      if (active) onChange({ user: null, role: null, loading: false });
      return;
    }

    try {
      if (isGoogleUser(user)) {
        if (active) onChange({ user, role: "teacher", loading: false });
        return;
      }

      const isStudent = user.email?.endsWith(`@${STUDENT_EMAIL_DOMAIN}`) ?? false;
      if (active) onChange({ user, role: isStudent ? "student" : null, loading: false });
    } catch {
      if (active) onChange({ user, role: null, loading: false });
    }
  });

  return () => {
    active = false;
    unsubscribe();
  };
}
