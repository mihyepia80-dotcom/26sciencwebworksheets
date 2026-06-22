"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { isGuestBrowsablePath, isLoggedInStudent, isTeacherRoute } from "@/lib/auth/access";

const PUBLIC_PATHS = ["/login"];

function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/share/") ||
    pathname.startsWith("/inquiry-report/view/")
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, role, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const firebaseReady = isFirebaseConfigured();

  useEffect(() => {
    if (loading) return;

    if (!firebaseReady) {
      if (pathname !== "/login") router.replace("/login");
      return;
    }

    if (user && role === "teacher-pending" && pathname !== "/teacher" && pathname !== "/login") {
      router.replace("/teacher");
      return;
    }

    if (user && pathname === "/login") {
      if (role === "teacher") router.replace("/teacher");
      else if (role === "student") router.replace("/");
      return;
    }

    if (pathname === "/my" && !isLoggedInStudent(user, role)) {
      router.replace(role === "teacher" ? "/teacher" : "/login");
      return;
    }

    if (pathname === "/workspace" && (role === "teacher" || role === "teacher-pending")) {
      router.replace("/teacher");
      return;
    }

    if (isTeacherRoute(pathname) && role === "student") {
      router.replace("/");
      return;
    }

    if (pathname.startsWith("/teacher/") && role !== "teacher") {
      router.replace(role === "student" ? "/" : "/teacher");
      return;
    }

    if (isTeacherRoute(pathname) && !user) {
      router.replace("/login");
      return;
    }
  }, [user, role, loading, pathname, router, firebaseReady]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        로딩 중...
      </div>
    );
  }

  if (!firebaseReady) {
    return pathname === "/login" ? children : null;
  }

  if (!user && pathname === "/my") {
    return null;
  }

  if (!user && isTeacherRoute(pathname)) {
    return null;
  }

  if (!user && !isPublicPath(pathname) && !isGuestBrowsablePath(pathname)) {
    return null;
  }

  return children;
}
