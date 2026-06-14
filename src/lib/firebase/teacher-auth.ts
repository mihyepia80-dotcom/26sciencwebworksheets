"use client";

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { isFirebaseConfigured } from "./config";
import { getClientAuth, getClientDb } from "./client";

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
  const teacherDoc = await getDoc(doc(getClientDb(), "teachers", user.uid));
  return teacherDoc.exists();
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
      const isTeacher = await checkIsTeacher(user);
      if (isTeacher) {
        if (active) onChange({ user, role: "teacher", loading: false });
        return;
      }

      const isStudent = user.email?.endsWith("@sagodogu-student.app") ?? false;
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
