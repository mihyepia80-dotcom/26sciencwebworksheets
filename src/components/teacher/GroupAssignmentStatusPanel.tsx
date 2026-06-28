"use client";

import { ACHIEVEMENT_LABELS, GROUP_COUNT } from "@/lib/group-activity/constants";
import { getGroupMembers, getUnassignedStudents } from "@/lib/group-activity/resolve-groups";
import type { Gender, GroupSlot, RosterStudent } from "@/lib/group-activity/types";
import { RosterScrollTable, RosterStickyHead, RosterStickyRow } from "@/components/teacher/RosterScrollTable";

function genderLabel(g: Gender): string {
  return g === "male" ? "남" : "여";
}

interface GroupAssignmentStatusPanelProps {
  year: number;
  month: number;
  grade: string;
  classNo: string;
  students: RosterStudent[];
  groups: GroupSlot[];
  assignmentConfirmed: boolean;
  busy: string;
  onAutoAssign: (seed?: number) => void;
  onConfirm: () => void;
}

export function GroupAssignmentStatusPanel({
  year,
  month,
  grade,
  classNo,
  students,
  groups,
  assignmentConfirmed,
  busy,
  onAutoAssign,
  onConfirm,
}: GroupAssignmentStatusPanelProps) {
  const studentsById = new Map(students.map((s) => [s.id, s]));
  const unassigned = getUnassignedStudents(groups, students);
  const assignedCount = groups.reduce((sum, g) => sum + g.memberIds.length, 0);
  const activeCount = students.filter((s) => s.active).length;
  const minRequired = GROUP_COUNT * 3;

  const groupByStudentId = new Map<string, number>();
  for (const g of groups) {
    for (const id of g.memberIds) {
      groupByStudentId.set(id, g.groupNo);
    }
  }

  return (
    <section className="ui-panel">
      <h2 className="ui-section-title">
        4. 모둠 편성 현황 ({year}년 {month}월 · {grade}학년 {classNo}반)
      </h2>
      <p className="ui-section-desc text-base">
        위 명렬표 학생이 반영됩니다. 자동 편성·확정 시 저장되어 새로고침 후에도 유지됩니다.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <span className="ui-chip bg-slate-100 text-slate-800">명단 {activeCount}명</span>
        <span className="ui-chip bg-violet-100 text-violet-900">배정 {assignedCount}명</span>
        {unassigned.length > 0 && (
          <span className="ui-chip bg-amber-100 text-amber-900">미배정 {unassigned.length}명</span>
        )}
        {assignmentConfirmed && (
          <span className="ui-chip bg-emerald-100 text-emerald-800">✓ 편성 확정</span>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" className="ui-btn-accent" disabled={busy === "assign"} onClick={() => void onAutoAssign()}>
          자동 편성
        </button>
        <button type="button" className="ui-btn-secondary" disabled={busy === "assign"} onClick={() => void onAutoAssign(Date.now())}>
          재구성
        </button>
        <button
          type="button"
          className="ui-btn-secondary"
          disabled={busy === "confirm" || assignedCount === 0}
          onClick={onConfirm}
        >
          편성 확정
        </button>
      </div>

      {activeCount > 0 && activeCount < minRequired && (
        <p className="ui-banner mt-5 border-amber-200 bg-amber-50 text-amber-950">
          자동 6모둠 편성에는 <strong>18~24명</strong>(모둠당 3~4명)이 필요합니다. 현재 {activeCount}명 — 아래에 명단·미배정 현황만 표시됩니다.
        </p>
      )}
      {activeCount > GROUP_COUNT * 4 && (
        <p className="ui-banner mt-5 border-amber-200 bg-amber-50 text-amber-950">
          학생이 {GROUP_COUNT * 4}명을 초과하면 6모둠 자동 편성이 어렵습니다. 현재 {activeCount}명 — 명단을 조정하거나 수동으로 조정해 주세요.
        </p>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: GROUP_COUNT }, (_, i) => {
          const groupNo = i + 1;
          const slot = groups.find((g) => g.groupNo === groupNo) ?? { groupNo, memberIds: [] };
          const members = getGroupMembers(slot, studentsById);
          return (
            <div
              key={groupNo}
              className={`rounded-2xl border-2 p-5 ${
                members.length > 0
                  ? "border-violet-200 bg-gradient-to-br from-violet-50 to-white shadow-sm"
                  : "border-dashed border-slate-200 bg-slate-50/70"
              }`}
            >
              <p className="text-xl font-bold text-violet-900">{groupNo}모둠 ({members.length}명)</p>
              {members.length > 0 ? (
                <ul className="mt-3 space-y-2 text-base text-slate-700">
                  {members.map((s) => (
                    <li key={s.id} className="rounded-xl bg-white/80 px-3 py-2">
                      {s.studentNo} {s.studentName} · {genderLabel(s.gender)} · {ACHIEVEMENT_LABELS[s.achievementLevel]}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-base text-slate-400">배정된 학생 없음</p>
              )}
            </div>
          );
        })}
      </div>

      {students.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-bold text-slate-900">학생별 모둠 배정표</h3>
          <RosterScrollTable>
            <RosterStickyHead extraHeaders={<th className="ui-table-cell">모둠</th>} />
            <tbody>
              {students.map((s) => {
                const groupNo = groupByStudentId.get(s.id);
                return (
                  <RosterStickyRow
                    key={s.id}
                    studentNo={s.studentNo}
                    studentName={s.studentName}
                    cells={
                      <td className="ui-table-cell">
                        {groupNo ? (
                          <span className="ui-chip bg-violet-100 text-violet-900">{groupNo}모둠</span>
                        ) : (
                          <span className="text-base font-medium text-amber-700">미배정</span>
                        )}
                      </td>
                    }
                  />
                );
              })}
            </tbody>
          </RosterScrollTable>
        </div>
      )}

      {unassigned.length > 0 && (
        <div className="ui-banner mt-6 border-amber-200 bg-amber-50 text-amber-950">
          미배정: {unassigned.map((s) => `${s.studentNo} ${s.studentName}`).join(", ")}
        </div>
      )}
    </section>
  );
}
