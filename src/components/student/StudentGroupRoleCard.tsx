"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/group-activity/constants";
import type { StudentGroupActivityView } from "@/lib/group-activity/types";
import { formatWeekRange, getWeekInfo } from "@/lib/group-activity/week-utils";
import { getStudentFirebaseErrorMessage } from "@/lib/firebase";
import { getStudentGroupActivityView } from "@/lib/firebase/group-activity";
import { getStudentProfile } from "@/lib/firebase/student-auth";

export function StudentGroupRoleCard() {
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<StudentGroupActivityView | null>(null);

  useEffect(() => {
    if (!user || role !== "student") {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    const week = getWeekInfo(new Date());

    getStudentProfile(user.uid)
      .then(async (profile) => {
        if (!profile || cancelled) return;
        const activity = await getStudentGroupActivityView(
          profile.grade,
          profile.classNo,
          profile.studentNo,
          week.weekIndex,
        );
        if (!cancelled) setView(activity);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(getStudentFirebaseErrorMessage(e, "모둠 정보를 불러오지 못했습니다."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, role]);

  if (!user || role !== "student") return null;

  if (loading) {
    return (
      <section className="ui-card mb-8 border-violet-200 bg-gradient-to-br from-violet-50 to-white p-6">
        <p className="text-base text-slate-500">모둠 활동 정보를 불러오는 중...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="ui-card mb-8 border-red-200 bg-red-50/60 p-6">
        <p className="text-base text-red-700">{error}</p>
      </section>
    );
  }

  if (!view || (!view.hasGroups && !view.hasRoles && view.myPraises.length === 0)) {
    return (
      <section className="ui-card mb-8 border-slate-200 bg-slate-50/80 p-6">
        <h2 className="ui-section-title text-slate-800">내 모둠 활동</h2>
        <p className="mt-3 text-base text-slate-600">
          아직 공개된 모둠 편성·역할·칭찬이 없습니다. 선생님이 편성을 저장하면 여기에 표시됩니다.
        </p>
      </section>
    );
  }

  const weekLabel =
    view.weekStart && view.weekEnd ? formatWeekRange(view.weekStart, view.weekEnd) : "";

  return (
    <section className="ui-card mb-8 border-violet-200 bg-gradient-to-br from-violet-50 to-white p-6">
      <h2 className="ui-section-title text-violet-900">내 모둠 활동</h2>

      {view.groupNo !== null ? (
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-sm font-semibold text-violet-800">나의 모둠</p>
            <p className="text-2xl font-bold text-violet-900">{view.groupNo}모둠</p>
            {view.year && view.month && (
              <p className="mt-1 text-sm text-slate-600">
                {view.year}년 {view.month}월 편성
              </p>
            )}
          </div>

          {view.groupMembers.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-slate-700">모둠원</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {view.groupMembers.map((member) => (
                  <li
                    key={member.studentNo}
                    className="rounded-full bg-white px-3 py-1 text-sm text-slate-800 ring-1 ring-violet-200"
                  >
                    {member.studentNo} {member.studentName}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-3 text-base text-amber-800">아직 모둠 배정이 확인되지 않았습니다.</p>
      )}

      {view.primaryRoleCode && (
        <div className="mt-5 rounded-xl bg-white/80 p-4 ring-1 ring-violet-100">
          <p className="text-sm font-semibold text-slate-700">이번 주 역할</p>
          {weekLabel && <p className="mt-1 text-xs text-slate-500">{weekLabel}</p>}
          <p className="mt-2 text-base text-slate-800">
            <span className="font-semibold">주역할:</span> {ROLE_LABELS[view.primaryRoleCode]} —{" "}
            {ROLE_DESCRIPTIONS[view.primaryRoleCode]}
          </p>
          {view.secondaryRoleCode && (
            <p className="mt-1 text-base text-slate-700">
              <span className="font-semibold">보조역할:</span> {ROLE_LABELS[view.secondaryRoleCode]}
            </p>
          )}
        </div>
      )}

      {!view.primaryRoleCode && view.hasGroups && (
        <p className="mt-4 text-sm text-slate-600">역할은 선생님이 저장하면 표시됩니다.</p>
      )}

      {view.myPraises.length > 0 && (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
          <p className="text-sm font-semibold text-amber-950">나의 모둠 활동 칭찬</p>
          <ul className="mt-2 space-y-2 text-sm text-amber-950">
            {view.myPraises.map((praise) => (
              <li key={praise.id} className="rounded-lg bg-white/80 px-3 py-2">
                {praise.groupNo}모둠 · {ROLE_LABELS[praise.primaryRoleCode]}
                {praise.note ? ` — ${praise.note}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {view.classPraises.length > 0 && (
        <div className="mt-5">
          <p className="text-sm font-semibold text-slate-700">우리 반 모둠 칭찬 (이번 주)</p>
          <ul className="mt-2 space-y-2 text-sm text-slate-700">
            {view.classPraises.slice(0, 8).map((praise) => (
              <li key={praise.id} className="rounded-lg bg-white/70 px-3 py-2 ring-1 ring-slate-100">
                {praise.groupNo}모둠 · {praise.studentNo} {praise.studentName} ·{" "}
                {ROLE_LABELS[praise.primaryRoleCode]}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
