"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

interface SessionRow {
  id: string;
  studentUid?: string;
  meta?: { grade?: number; classNo?: number; studentNo?: number; period?: string; templateId?: string };
  initialQuestion?: string;
  finalQuestion?: string;
  qualityInitial?: number;
  qualityFinal?: number;
  updatedAt?: { _seconds?: number };
}

export function TeacherQuestionLogs() {
  const { user, role } = useAuth();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || role !== "teacher") {
      setLoading(false);
      return;
    }
    user
      .getIdToken()
      .then((token) =>
        fetch("/api/inquiry-question-bot/sessions", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      )
      .then((r) => r.json())
      .then((d) => setSessions(d.sessions ?? []))
      .finally(() => setLoading(false));
  }, [user, role]);

  return (
    <div className="page-main-narrow">
      <Link href="/teacher" className="text-sm text-violet-700 hover:underline">
        ← 교사 대시보드
      </Link>
      <h1 className="ui-page-title mt-4">탐구질문 챗봇 로그</h1>
      <p className="ui-page-desc">학생별 초기·최종 탐구 질문과 질 점수를 확인합니다.</p>

      {loading ? (
        <p className="mt-6 text-slate-500">불러오는 중…</p>
      ) : sessions.length === 0 ? (
        <p className="mt-6 text-slate-500">아직 기록된 세션이 없습니다.</p>
      ) : (
        <div className="ui-table-wrap mt-6">
          <table className="ui-table text-sm">
            <thead className="ui-table-head">
              <tr>
                <th className="ui-table-cell text-left">학생</th>
                <th className="ui-table-cell text-left">차시·템플릿</th>
                <th className="ui-table-cell text-left">초기 질문</th>
                <th className="ui-table-cell text-left">최종 질문</th>
                <th className="ui-table-cell text-left">질 점수</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td className="ui-table-cell">
                    {s.meta?.grade}-{s.meta?.classNo} {s.meta?.studentNo}
                  </td>
                  <td className="ui-table-cell">
                    {s.meta?.period} · {s.meta?.templateId}
                  </td>
                  <td className="ui-table-cell max-w-[12rem] truncate">{s.initialQuestion}</td>
                  <td className="ui-table-cell max-w-[12rem] truncate">{s.finalQuestion}</td>
                  <td className="ui-table-cell">
                    {s.qualityInitial ?? 0} → {s.qualityFinal ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
