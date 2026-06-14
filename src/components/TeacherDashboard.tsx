"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { isFirebaseConfigured, listSubmissions, signInTeacherWithGoogle, signOutUser, getFirebaseErrorMessage } from "@/lib/firebase";
import type { WorksheetSubmission } from "@/lib/firebase/submissions";

function formatSubmittedAt(submission: WorksheetSubmission): string {
  if (!submission.submittedAt) return "-";
  return submission.submittedAt.toDate().toLocaleString("ko-KR");
}

function studentLabel(meta: WorksheetSubmission["meta"]): string {
  const parts = [meta.grade, meta.studentNo, meta.studentName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "익명";
}

const META_LABELS: Record<string, string> = {
  grade: "학년/반",
  classNo: "반",
  studentNo: "번호",
  studentName: "이름",
  topic: "주제",
  unit: "단원",
  period: "차시",
  inquiryQuestion: "탐구질문",
  writingContext: "글쓰기 상황",
  description: "설명",
};

export function TeacherDashboard() {
  const { user, role, loading: authLoading } = useAuth();
  const [authError, setAuthError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [submissions, setSubmissions] = useState<WorksheetSubmission[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || role !== "teacher") {
      setSubmissions([]);
      return;
    }

    let cancelled = false;
    setListLoading(true);
    setListError("");

    listSubmissions()
      .then((items) => {
        if (!cancelled) setSubmissions(items);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setListError(getFirebaseErrorMessage(error, "제출 목록을 불러오지 못했습니다."));
        }
      })
      .finally(() => {
        if (!cancelled) setListLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, role]);

  const handleGoogleLogin = async () => {
    setAuthError("");
    setGoogleLoading(true);
    try {
      await signInTeacherWithGoogle();
    } catch (error: unknown) {
      setAuthError(getFirebaseErrorMessage(error, "Google 로그인에 실패했습니다."));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOutUser();
    window.location.href = "/login";
  };

  if (!isFirebaseConfigured()) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-slate-900">Firebase 설정 필요</h1>
        <p className="mt-3 text-sm text-slate-600">`.env` 파일에 Firebase 환경 변수를 입력하세요.</p>
      </div>
    );
  }

  if (authLoading) {
    return <div className="px-4 py-16 text-center text-sm text-slate-500">로딩 중...</div>;
  }

  if (!user || role !== "teacher") {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <Link href="/login" className="text-sm text-blue-600 hover:underline">
          ← 로그인
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">교사 로그인</h1>
        <p className="mt-2 text-sm text-slate-600">Google 계정으로 로그인하면 제출된 활동지를 조회할 수 있습니다.</p>

        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <button
            type="button"
            disabled={googleLoading}
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {googleLoading ? "연결 중..." : "Google로 로그인"}
          </button>
          {authError && <p className="mt-3 text-sm text-red-600">{authError}</p>}
          {user && role !== "teacher" && (
            <p className="mt-3 text-sm text-amber-700">
              로그인되었지만 교사 권한이 없습니다. Firebase `teachers` 컬렉션에 UID를 등록하세요.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            ← 홈으로
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">제출 활동지 (교사)</h1>
          <p className="mt-1 text-sm text-slate-600">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          로그아웃
        </button>
      </div>

      {listLoading && <p className="mt-8 text-sm text-slate-500">불러오는 중...</p>}
      {listError && <p className="mt-8 text-sm text-red-600">{listError}</p>}

      {!listLoading && !listError && submissions.length === 0 && (
        <p className="mt-8 rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          아직 제출된 활동지가 없습니다.
        </p>
      )}

      <div className="mt-6 space-y-3">
        {submissions.map((submission) => {
          const open = expandedId === submission.id;
          const valueEntries = Object.entries(submission.values).filter(([, value]) => value.trim().length > 0);

          return (
            <article key={submission.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left hover:bg-slate-50"
                onClick={() => setExpandedId(open ? null : submission.id ?? null)}
              >
                <div>
                  <p className="font-semibold text-slate-800">{submission.templateName}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {studentLabel(submission.meta)} · {submission.meta.topic || "주제 없음"}
                  </p>
                </div>
                <div className="shrink-0 text-right text-xs text-slate-500">
                  <p>{formatSubmittedAt(submission)}</p>
                  <p className="mt-1">{open ? "접기" : "펼치기"}</p>
                </div>
              </button>

              {open && (
                <div className="border-t border-slate-100 px-4 py-4 text-sm">
                  <dl className="grid gap-2 sm:grid-cols-2">
                    {Object.entries(submission.meta)
                      .filter(([, value]) => value && String(value).trim().length > 0)
                      .map(([key, value]) => (
                        <div key={key}>
                          <dt className="text-xs font-semibold text-slate-500">{META_LABELS[key] ?? key}</dt>
                          <dd className="mt-0.5 whitespace-pre-wrap text-slate-800">{value}</dd>
                        </div>
                      ))}
                  </dl>

                  {valueEntries.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">활동지 내용</h3>
                      {valueEntries.map(([key, value]) => (
                        <div key={key} className="rounded-lg bg-slate-50 p-3">
                          <p className="text-xs font-semibold text-slate-500">{key}</p>
                          <p className="mt-1 whitespace-pre-wrap text-slate-800">{value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
