"use client";

import { GROUP_COUNT, ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/group-activity/constants";
import type { StudentRoleAssignment } from "@/lib/group-activity/types";
import { formatWeekRange } from "@/lib/group-activity/week-utils";

interface GroupRoleStatusPanelProps {
  weekStart: string;
  weekEnd: string;
  weekLabel: string;
  assignments: StudentRoleAssignment[];
  hasGroups: boolean;
  isSaved: boolean;
  busy: string;
  onAssignRoles: () => void;
}

export function GroupRoleStatusPanel({
  weekStart,
  weekEnd,
  weekLabel,
  assignments,
  hasGroups,
  isSaved,
  busy,
  onAssignRoles,
}: GroupRoleStatusPanelProps) {
  const byGroup = new Map<number, StudentRoleAssignment[]>();
  for (const a of assignments) {
    if (!byGroup.has(a.groupNo)) byGroup.set(a.groupNo, []);
    byGroup.get(a.groupNo)!.push(a);
  }

  return (
    <section className="ui-panel">
      <h2 className="ui-section-title">5. 역할 부여</h2>
      <p className="ui-section-desc">
        {formatWeekRange(weekStart, weekEnd)} · {weekLabel} · 매주 월요일 갱신 (월~금)
      </p>
      <p className="mt-2 text-base text-slate-600">
        4번 모둠 편성 명단을 바탕으로 주·보조 역할을 표시합니다. 저장 전에도 미리보기가 보입니다.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          className="ui-btn-accent"
          disabled={busy === "roles" || !hasGroups}
          onClick={onAssignRoles}
        >
          역할 배정 저장 (이번 주)
        </button>
        {isSaved && <span className="text-lg font-semibold text-emerald-700">✓ 학생 화면에 반영됨</span>}
        {!isSaved && assignments.length > 0 && (
          <span className="text-base text-slate-600">미리보기 — 저장하면 학생이 조회합니다</span>
        )}
      </div>

      {!hasGroups && (
        <p className="mt-6 text-lg text-slate-500">먼저 4번 모둠 편성에서 학생을 배정해 주세요.</p>
      )}

      {hasGroups && (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: GROUP_COUNT }, (_, i) => {
            const groupNo = i + 1;
            const members = byGroup.get(groupNo) ?? [];
            return (
              <div
                key={groupNo}
                className={`rounded-2xl border-2 p-5 ${
                  members.length > 0
                    ? "border-slate-200 bg-white shadow-sm"
                    : "border-dashed border-slate-200 bg-slate-50/70"
                }`}
              >
                <p className="text-xl font-bold text-slate-900">{groupNo}모둠</p>
                {members.length > 0 ? (
                  <ul className="mt-3 space-y-3 text-base">
                    {members
                      .sort((a, b) => a.studentNo.localeCompare(b.studentNo, "ko", { numeric: true }))
                      .map((a) => (
                        <li key={a.rosterStudentId} className="rounded-xl bg-slate-50 px-4 py-3">
                          <span className="text-lg font-semibold text-slate-900">
                            {a.studentNo} {a.studentName}
                          </span>
                          <p className="mt-1 text-slate-700">
                            주: {ROLE_LABELS[a.primaryRoleCode]} — {ROLE_DESCRIPTIONS[a.primaryRoleCode]}
                          </p>
                          {a.secondaryRoleCode && (
                            <p className="text-slate-600">보조: {ROLE_LABELS[a.secondaryRoleCode]}</p>
                          )}
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="mt-3 text-base text-slate-400">역할 없음</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
