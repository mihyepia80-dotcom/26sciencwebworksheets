"use client";

import { useEffect, useMemo, useState } from "react";
import type { PadletBoardDoc } from "@/lib/padlet/publish-types";

interface MatrixPost {
  id: string;
  studentNo: number;
  period: number;
  status: string;
  submissionId: string;
}

interface TeacherPadletPublishMatrixProps {
  boardDocId: string;
  idToken: string;
}

export function TeacherPadletPublishMatrix({ boardDocId, idToken }: TeacherPadletPublishMatrixProps) {
  const [board, setBoard] = useState<PadletBoardDoc | null>(null);
  const [posts, setPosts] = useState<MatrixPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/padlet/boards/${encodeURIComponent(boardDocId)}/matrix`, {
      headers: { Authorization: `Bearer ${idToken}` },
    })
      .then((r) => r.json())
      .then((d) => {
        setBoard(d.board ?? null);
        setPosts(
          (d.posts ?? []).map((p: MatrixPost) => ({
            id: p.id,
            studentNo: p.studentNo,
            period: p.period,
            status: p.status,
            submissionId: p.submissionId,
          })),
        );
      })
      .finally(() => setLoading(false));
  }, [boardDocId, idToken]);

  const periods = board?.scope.periods ?? [];
  const rows = useMemo(() => {
    const nums = Array.from({ length: 25 }, (_, i) => i + 1);
    return nums.map((studentNo) => ({
      studentNo,
      cells: periods.map((period) => {
        const hit = posts.find((p) => p.studentNo === studentNo && p.period === period);
        return hit?.status ?? "미게시";
      }),
    }));
  }, [periods, posts]);

  const togglePublish = async (open: boolean) => {
    await fetch(`/api/padlet/boards/${encodeURIComponent(boardDocId)}/publish-state`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ open, allowRepublish: true }),
    });
    setBoard((b) => (b ? { ...b, publish: { ...b.publish, open } } : b));
  };

  if (loading) return <p className="text-sm text-slate-500">게시 현황 불러오는 중…</p>;
  if (!board) return <p className="text-sm text-slate-500">보드 정보가 없습니다.</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-slate-700">
          <span className="font-semibold">{board.title}</span> · {board.scope.grade}학년 {board.scope.classNo}반
        </p>
        <button
          type="button"
          className="ui-btn-secondary ui-btn-sm"
          onClick={() => togglePublish(!board.publish.open)}
        >
          {board.publish.open ? "게시 마감" : "게시 개방"}
        </button>
        <a href={board.boardUrl} target="_blank" rel="noopener noreferrer" className="ui-btn-secondary ui-btn-sm">
          보드 열기
        </a>
      </div>

      <div className="ui-table-wrap overflow-x-auto">
        <table className="ui-table text-xs">
          <thead className="ui-table-head">
            <tr>
              <th className="ui-table-cell">번호</th>
              {periods.map((p) => (
                <th key={p} className="ui-table-cell">{p}차시</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.studentNo}>
                <td className="ui-table-cell font-medium">{row.studentNo}</td>
                {row.cells.map((status, idx) => (
                  <td key={`${row.studentNo}-${periods[idx]}`} className="ui-table-cell">
                    {status === "published" ? "게시" : status === "stale" ? "수정 대기" : status === "failed" ? "실패" : "미게시"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
