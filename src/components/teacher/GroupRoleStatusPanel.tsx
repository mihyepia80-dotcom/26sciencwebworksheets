"use client";

import {
  GROUP_COUNT,
  ROLE_CODES,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  type RoleCode,
} from "@/lib/group-activity/constants";
import type { StudentRoleAssignment } from "@/lib/group-activity/types";
import { formatWeekRange } from "@/lib/group-activity/week-utils";

const INPUT = "ui-input-compact";

interface GroupRoleStatusPanelProps {
  weekStart: string;
  weekEnd: string;
  weekLabel: string;
  assignments: StudentRoleAssignment[];
  hasGroups: boolean;
  isSaved: boolean;
  busy: string;
  onAssignmentChange: (
    rosterStudentId: string,
    patch: { primaryRoleCode?: RoleCode; secondaryRoleCode?: RoleCode | null },
  ) => void;
  onAutoAssign: () => void;
  onSave: () => void;
  onDelete: () => void;
}

export function GroupRoleStatusPanel({
  weekStart,
  weekEnd,
  weekLabel,
  assignments,
  hasGroups,
  isSaved,
  busy,
  onAssignmentChange,
  onAutoAssign,
  onSave,
  onDelete,
}: GroupRoleStatusPanelProps) {
  const saving = busy === "roles" || busy === "roles-delete";
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
        4번 모둠 편성 명단을 바탕으로 역할을 수정·저장·삭제할 수 있습니다.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="ui-btn-secondary"
          disabled={saving || !hasGroups || assignments.length === 0}
          onClick={onAutoAssign}
        >
          자동 배정
        </button>
        <button
          type="button"
          className="ui-btn-accent"
          disabled={saving || !hasGroups || assignments.length === 0}
          onClick={onSave}
        >
          역할 저장
        </button>
        <button
          type="button"
          className="ui-btn-secondary text-red-700"
          disabled={saving || !isSaved}
          onClick={onDelete}
        >
          역할 삭제
        </button>
        {isSaved && <span className="text-lg font-semibold text-emerald-700">✓ 학생 화면에 반영됨</span>}
        {!isSaved && assignments.length > 0 && (
          <span className="text-base text-slate-600">저장 전 — 아래에서 역할을 수정할 수 있습니다</span>
        )}
      </div>

      {!hasGroups && (
        <p className="mt-6 text-lg text-slate-500">먼저 4번 모둠 편성에서 학생을 배정해 주세요.</p>
      )}

      {hasGroups && (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: GROUP_COUNT }, (_, i) => {
            const groupNo = i + 1;
            const members = [...(byGroup.get(groupNo) ?? [])].sort((a, b) =>
              a.studentNo.localeCompare(b.studentNo, "ko", { numeric: true }),
            );
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
                    {members.map((a) => (
                      <li key={a.rosterStudentId} className="rounded-xl bg-slate-50 px-4 py-3">
                        <span className="text-lg font-semibold text-slate-900">
                          {a.studentNo} {a.studentName}
                        </span>
                        <div className="mt-2 space-y-2">
                          <label className="flex flex-col gap-1 text-sm">
                            <span className="font-medium text-slate-600">주역할</span>
                            <select
                              className={INPUT}
                              disabled={saving}
                              value={a.primaryRoleCode}
                              onChange={(e) =>
                                onAssignmentChange(a.rosterStudentId, {
                                  primaryRoleCode: Number(e.target.value) as RoleCode,
                                })
                              }
                            >
                              {ROLE_CODES.map((code) => (
                                <option key={code} value={code}>
                                  {ROLE_LABELS[code]} — {ROLE_DESCRIPTIONS[code]}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="flex flex-col gap-1 text-sm">
                            <span className="font-medium text-slate-600">보조역할</span>
                            <select
                              className={INPUT}
                              disabled={saving}
                              value={a.secondaryRoleCode ?? ""}
                              onChange={(e) =>
                                onAssignmentChange(a.rosterStudentId, {
                                  secondaryRoleCode: e.target.value
                                    ? (Number(e.target.value) as RoleCode)
                                    : null,
                                })
                              }
                            >
                              <option value="">없음</option>
                              {ROLE_CODES.map((code) => (
                                <option key={code} value={code}>
                                  {ROLE_LABELS[code]}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
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
