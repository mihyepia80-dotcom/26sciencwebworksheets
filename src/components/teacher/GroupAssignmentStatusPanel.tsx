"use client";

import { ACHIEVEMENT_LABELS, GROUP_COUNT } from "@/lib/group-activity/constants";
import { getGroupMembers, getUnassignedStudents } from "@/lib/group-activity/resolve-groups";
import type { Gender, GroupSlot, RosterStudent } from "@/lib/group-activity/types";
import { RosterScrollTable, RosterStickyHead, RosterStickyRow } from "@/components/teacher/RosterScrollTable";

const BTN = "rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60";
const BTN_PRIMARY = `${BTN} bg-violet-600 text-white hover:bg-violet-700`;
const BTN_SECONDARY = `${BTN} border border-slate-300 text-slate-700 hover:bg-slate-50`;

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
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-900">
        4. 모둠 편성 현황 ({year}년 {month}월 · {grade}학년 {classNo}반)
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        위 명렬표 학생이 자동 반영됩니다. 6모둠·모둠당 3~4명(최소 {minRequired}명) 기준입니다.
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">명단 {activeCount}명</span>
        <span className="rounded-full bg-violet-100 px-3 py-1 text-violet-900">배정 {assignedCount}명</span>
        {unassigned.length > 0 && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">미배정 {unassigned.length}명</span>
        )}
        {assignmentConfirmed && (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">✓ 편성 확정</span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={BTN_PRIMARY} onClick={() => onAutoAssign()}>
          자동 편성
        </button>
        <button type="button" className={BTN_SECONDARY} onClick={() => onAutoAssign(Date.now())}>
          재구성
        </button>
        <button
          type="button"
          className={BTN_SECONDARY}
          disabled={busy === "confirm" || assignedCount === 0}
          onClick={onConfirm}
        >
          편성 확정
        </button>
      </div>

      {activeCount > 0 && activeCount < minRequired && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
          자동 6모둠 편성에는 최소 {minRequired}명이 필요합니다. 현재 {activeCount}명 — 아래에 명단·미배정 현황만 표시됩니다.
        </p>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: GROUP_COUNT }, (_, i) => {
          const groupNo = i + 1;
          const slot = groups.find((g) => g.groupNo === groupNo) ?? { groupNo, memberIds: [] };
          const members = getGroupMembers(slot, studentsById);
          return (
            <div
              key={groupNo}
              className={`rounded-lg border p-4 ${
                members.length > 0 ? "border-violet-200 bg-violet-50/50" : "border-dashed border-slate-200 bg-slate-50/50"
              }`}
            >
              <p className="font-bold text-violet-900">{groupNo}모둠 ({members.length}명)</p>
              {members.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {members.map((s) => (
                    <li key={s.id}>
                      {s.studentNo} {s.studentName} · {genderLabel(s.gender)} · {ACHIEVEMENT_LABELS[s.achievementLevel]}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-400">배정된 학생 없음</p>
              )}
            </div>
          );
        })}
      </div>

      {students.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-bold text-slate-800">학생별 모둠 배정표</h3>
          <div className="mt-3">
            <RosterScrollTable>
              <RosterStickyHead extraHeaders={<th className="px-3 py-2">모둠</th>} />
              <tbody>
                {students.map((s) => {
                  const groupNo = groupByStudentId.get(s.id);
                  return (
                    <RosterStickyRow
                      key={s.id}
                      studentNo={s.studentNo}
                      studentName={s.studentName}
                      cells={
                        <td className="px-3 py-2">
                          {groupNo ? (
                            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-800">
                              {groupNo}모둠
                            </span>
                          ) : (
                            <span className="text-xs text-amber-700">미배정</span>
                          )}
                        </td>
                      }
                    />
                  );
                })}
              </tbody>
            </RosterScrollTable>
          </div>
        </div>
      )}

      {unassigned.length > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/60 px-4 py-3 text-sm text-amber-900">
          미배정: {unassigned.map((s) => `${s.studentNo} ${s.studentName}`).join(", ")}
        </div>
      )}
    </section>
  );
}
