"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";
import {
  getStudentProfile,
  isFirebaseConfigured,
  subscribeAppAuth,
  type AuthRole,
  type StudentProfile,
} from "@/lib/firebase";

interface AuthContextValue {
  user: User | null;
  role: AuthRole;
  loading: boolean;
  studentProfile: StudentProfile | null;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  loading: true,
  studentProfile: null,
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AuthRole>(null);
  const [loading, setLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);

  const refreshProfile = async () => {
    if (!user || role !== "student") {
      setStudentProfile(null);
      return;
    }
    const profile = await getStudentProfile(user.uid);
    setStudentProfile(profile);
  };

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
    <AuthContext.Provider value={{ user, role, loading, studentProfile, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
