"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { awardStudentBadge, listBadgeDefinitions } from "@/lib/firebase/badges";
import { getFirebaseErrorMessage } from "@/lib/firebase";
import type { WorksheetSubmission } from "@/lib/firebase/submissions";
import type { BadgeDefinition } from "@/lib/badges/types";

interface TeacherAwardBadgeQuickProps {
  submission: WorksheetSubmission;
}

export function TeacherAwardBadgeQuick({ submission }: TeacherAwardBadgeQuickProps) {
  const { user } = useAuth();
  const [definitions, setDefinitions] = useState<BadgeDefinition[]>([]);
  const [badgeId, setBadgeId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    listBadgeDefinitions()
      .then((defs) => {
        setDefinitions(defs);
        if (defs[0]?.id) setBadgeId(defs[0].id);
      })
      .catch(() => setDefinitions([]));
  }, []);

  const handleAward = async () => {
    if (!user || !badgeId) return;
    const badge = definitions.find((d) => d.id === badgeId);
    if (!badge) return;

    setLoading(true);
    setError("");
    setMessage("");
    try {
      await awardStudentBadge({
        studentUid: submission.studentUid,
        studentName: submission.meta.studentName,
        grade: submission.meta.grade,
        classNo: submission.meta.classNo,
        studentNo: submission.meta.studentNo,
        badgeId: badge.id ?? badgeId,
        badgeLabel: badge.label,
        iconKey: badge.iconKey,
        awardedBy: user.uid,
        note: `${submission.templateName} 활동지`,
      });
      setMessage(`「${badge.label}」 배지를 부여했습니다.`);
    } catch (e: unknown) {
      setError(getFirebaseErrorMessage(e, "배지 부여 실패"));
    } finally {
      setLoading(false);
    }
  };

  if (definitions.length === 0) return null;

  return (
    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
      <p className="mb-2 text-xs font-semibold text-amber-900">칭찬 배지 부여</p>
      <div className="flex flex-wrap items-center gap-2">
        <select
          className="rounded border border-amber-200 bg-white px-2 py-1.5 text-xs"
          value={badgeId}
          onChange={(e) => setBadgeId(e.target.value)}
        >
          {definitions.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={loading}
          onClick={() => void handleAward()}
          className="rounded bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {loading ? "부여 중…" : "배지 부여"}
        </button>
      </div>
      {message && <p className="mt-2 text-xs text-emerald-700">{message}</p>}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
