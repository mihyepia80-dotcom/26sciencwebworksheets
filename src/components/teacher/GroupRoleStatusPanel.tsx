"use client";

import { GROUP_COUNT, ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/group-activity/constants";
import type { StudentRoleAssignment } from "@/lib/group-activity/types";
import { formatWeekRange } from "@/lib/group-activity/week-utils";

const BTN = "rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60";
const BTN_PRIMARY = `${BTN} bg-violet-600 text-white hover:bg-violet-700`;

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
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">5. 역할 부여</h2>
      <p className="mt-1 text-sm text-slate-600">
        {formatWeekRange(weekStart, weekEnd)} · {weekLabel} · 매주 월요일 갱신 (월~금)
      </p>
      <p className="mt-1 text-xs text-slate-500">
        4번 모둠 편성 명단을 바탕으로 주·보조 역할을 표시합니다. 저장 전에도 미리보기가 보입니다.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className={BTN_PRIMARY}
          disabled={busy === "roles" || !hasGroups}
          onClick={onAssignRoles}
        >
          역할 배정 저장 (이번 주)
        </button>
        {isSaved && (
          <span className="text-sm text-emerald-700">✓ 학생 화면에 반영됨</span>
        )}
        {!isSaved && assignments.length > 0 && (
          <span className="text-sm text-slate-500">미리보기 — 저장하면 학생이 조회합니다</span>
        )}
      </div>

      {!hasGroups && (
        <p className="mt-4 text-sm text-slate-400">먼저 4번 모둠 편성에서 학생을 배정해 주세요.</p>
      )}

      {hasGroups && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: GROUP_COUNT }, (_, i) => {
            const groupNo = i + 1;
            const members = byGroup.get(groupNo) ?? [];
            return (
              <div
                key={groupNo}
                className={`rounded-lg border p-4 ${
                  members.length > 0 ? "border-slate-200 bg-white" : "border-dashed border-slate-200 bg-slate-50/50"
                }`}
              >
                <p className="font-bold text-slate-900">{groupNo}모둠</p>
                {members.length > 0 ? (
                  <ul className="mt-2 space-y-2 text-sm">
                    {members
                      .sort((a, b) => a.studentNo.localeCompare(b.studentNo, "ko", { numeric: true }))
                      .map((a) => (
                        <li key={a.rosterStudentId} className="rounded-md bg-slate-50 px-2 py-2">
                          <span className="font-medium text-slate-900">
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
                  <p className="mt-2 text-sm text-slate-400">역할 없음</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
