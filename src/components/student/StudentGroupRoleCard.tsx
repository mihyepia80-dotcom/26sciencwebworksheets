"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/group-activity/constants";
import { formatWeekRange } from "@/lib/group-activity/week-utils";
import { getFirebaseErrorMessage } from "@/lib/firebase";
import { getRoleScheduleForClass } from "@/lib/firebase/group-activity";
import { getStudentProfile } from "@/lib/firebase/student-auth";

export function StudentGroupRoleCard() {
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [groupNo, setGroupNo] = useState<number | null>(null);
  const [primaryRole, setPrimaryRole] = useState<string>("");
  const [secondaryRole, setSecondaryRole] = useState<string | null>(null);
  const [primaryDesc, setPrimaryDesc] = useState("");
  const [weekRange, setWeekRange] = useState("");

  useEffect(() => {
    if (!user || role !== "student") {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    getStudentProfile(user.uid)
      .then(async (profile) => {
        if (!profile || cancelled) return;
        const schedule = await getRoleScheduleForClass(profile.grade, profile.classNo);
        if (!schedule || cancelled) return;

        const mine = schedule.assignments.find((a) => a.studentNo === profile.studentNo);
        if (!mine) return;

        setGroupNo(mine.groupNo);
        setPrimaryRole(ROLE_LABELS[mine.primaryRoleCode]);
        setPrimaryDesc(ROLE_DESCRIPTIONS[mine.primaryRoleCode]);
        setSecondaryRole(mine.secondaryRoleCode ? ROLE_LABELS[mine.secondaryRoleCode] : null);
        setWeekRange(formatWeekRange(schedule.weekStart, schedule.weekEnd));
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(getFirebaseErrorMessage(e, "모둠 정보를 불러오지 못했습니다."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, role]);

  if (!user || role !== "student") return null;
  if (loading) return null;
  if (error) return null;
  if (groupNo === null) return null;

  return (
    <section className="ui-card mb-8 border-violet-200 bg-gradient-to-br from-violet-50 to-white p-6">
      <h2 className="ui-section-title text-violet-900">내 모둠·역할</h2>
      <div className="mt-4 space-y-2 text-base text-slate-800">
        <p className="text-2xl font-bold text-violet-800">{groupNo}모둠</p>
        <p>
          <span className="font-semibold">주역할:</span> {primaryRole} — {primaryDesc}
        </p>
        {secondaryRole && (
          <p>
            <span className="font-semibold">보조역할:</span> {secondaryRole}
          </p>
        )}
        <p className="text-sm text-slate-600">이번 주: {weekRange}</p>
      </div>
    </section>
  );
}
