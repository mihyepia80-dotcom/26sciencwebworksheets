"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";
import {
  getStudentProfile,
  isFirebaseConfigured,
  resolveAuthRole,
  subscribeAppAuth,
  verifyTeacherAccessPin,
  type AuthRole,
  type StudentProfile,
} from "@/lib/firebase";

interface AuthContextValue {
  user: User | null;
  role: AuthRole;
  loading: boolean;
  studentProfile: StudentProfile | null;
  refreshProfile: () => Promise<void>;
  confirmTeacherPin: (password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  loading: true,
  studentProfile: null,
  refreshProfile: async () => {},
  confirmTeacherPin: async () => false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AuthRole>(null);
  const [loading, setLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!user || role !== "student") {
      setStudentProfile(null);
      return;
    }
    const profile = await getStudentProfile(user.uid);
    setStudentProfile(profile);
  }, [role, user]);

  const confirmTeacherPin = useCallback(async (password: string): Promise<boolean> => {
    if (!user) return false;
    const ok = await verifyTeacherAccessPin(user, password);
    if (!ok) return false;
    const nextRole = await resolveAuthRole(user);
    setRole(nextRole);
    return nextRole === "teacher";
  }, [user]);

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setLoading(false);
      return;
    }

    return subscribeAppAuth((state) => {
      setUser(state.user);
      setRole(state.role);
      setLoading(state.loading);

      if (!state.user || state.role !== "student") {
        setStudentProfile(null);
        return;
      }

      getStudentProfile(state.user.uid)
        .then(setStudentProfile)
        .catch(() => setStudentProfile(null));
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading, studentProfile, refreshProfile, confirmTeacherPin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
