"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  getTeacherInviteByToken,
  getFirebaseErrorMessage,
  signInStudent,
} from "@/lib/firebase";
import type { TeacherInviteRecord } from "@/lib/teacher-invites/types";
import { buildInviteRedirectPath, TEACHER_INVITE_MODE_LABELS } from "@/lib/teacher-invites/types";

export default function JoinInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const { user, role, loading: authLoading } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [invite, setInvite] = useState<TeacherInviteRecord | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [grade, setGrade] = useState("");
  const [classNo, setClassNo] = useState("");
  const [studentNo, setStudentNo] = useState("");
  const [studentName, setStudentName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    params.then(({ token: t }) => setToken(t));
  }, [params]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    setPageLoading(true);
    setPageError("");

    getTeacherInviteByToken(token)
      .then((record) => {
        if (cancelled) return;
        if (!record) {
          setPageError("공유 링크를 찾을 수 없거나 사용이 중지되었습니다.");
          return;
        }
        setInvite(record);
      })
      .catch(() => {
        if (!cancelled) setPageError("공유 정보를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setPageLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (authLoading || pageLoading || !invite) return;
    if (role === "student" && user) {
      router.replace(buildInviteRedirectPath(invite));
    }
  }, [authLoading, invite, pageLoading, role, router, user]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!invite) return;

    setFormError("");
    setSubmitting(true);

    try {
      await signInStudent({ grade, classNo, studentNo, studentName }, password);
      router.replace(buildInviteRedirectPath(invite));
    } catch (err: unknown) {
      setFormError(getFirebaseErrorMessage(err, "로그인에 실패했습니다."));
    } finally {
      setSubmitting(false);
    }
  };

  if (pageLoading || authLoading) {
    return <p className="py-24 text-center text-base text-slate-500">공유 링크 확인 중…</p>;
  }

  if (pageError || !invite) {
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <p className="text-base text-red-600">{pageError || "링크를 찾을 수 없습니다."}</p>
        <Link href="/" className="ui-link mt-6 inline-block">
          홈으로
        </Link>
      </div>
    );
  }

  if (role === "teacher") {
    return (
      <div className="mx-auto max-w-md px-5 py-20 text-center">
        <p className="text-base text-slate-700">교사 계정으로는 학생 작성 링크를 이용할 수 없습니다.</p>
        <p className="mt-2 text-sm text-slate-500">로그아웃한 뒤 학생 정보로 다시 접속해 주세요.</p>
        <Link href="/teacher" className="ui-link mt-6 inline-block">
          교사 대시보드
        </Link>
      </div>
    );
  }

  if (role === "student" && user) {
    return <p className="py-24 text-center text-base text-slate-500">작성 화면으로 이동 중…</p>;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-16">
      <div className="text-center">
        <p className="text-sm font-medium text-violet-700">선생님 공유 링크</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{invite.label}</h1>
        <p className="mt-2 text-base text-slate-600">
          {TEACHER_INVITE_MODE_LABELS[invite.mode]} 작성을 시작합니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="ui-card mt-8 space-y-4 p-6">
        <h2 className="text-lg font-bold text-slate-800">학생 정보 입력</h2>
        <div className="grid grid-cols-2 gap-3">
          <input
            className="ui-input"
            placeholder="학년"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            required
          />
          <input
            className="ui-input"
            placeholder="반"
            value={classNo}
            onChange={(e) => setClassNo(e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input
            className="ui-input"
            placeholder="번호"
            value={studentNo}
            onChange={(e) => setStudentNo(e.target.value)}
            required
          />
          <input
            className="ui-input"
            placeholder="이름"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            required
          />
        </div>
        <input
          type="password"
          className="ui-input"
          placeholder="암호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={submitting} className="ui-btn-primary w-full">
          {submitting ? "확인 중…" : "작성 시작하기"}
        </button>
        {formError && <p className="text-sm text-red-600">{formError}</p>}
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        <Link href="/login" className="text-blue-600 hover:underline">
          일반 로그인
        </Link>
        으로 이미 계정이 있다면 여기서 로그인할 수 있습니다.
      </p>
    </div>
  );
}
