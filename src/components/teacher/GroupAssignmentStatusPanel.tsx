"use client";

import { useMemo, useState } from "react";
import { ACHIEVEMENT_LABELS, GROUP_COUNT } from "@/lib/group-activity/constants";
import {
  getGroupMembers,
  getUnassignedStudents,
  moveStudentBetweenGroups,
  sortRosterStudents,
} from "@/lib/group-activity/resolve-groups";
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
  onGroupsChange: (groups: GroupSlot[]) => void;
}

function StudentChip({
  student,
  draggable,
  onDragStart,
}: {
  student: RosterStudent;
  draggable: boolean;
  onDragStart: (studentId: string) => void;
}) {
  return (
    <li
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", student.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart(student.id);
      }}
      className={`rounded-xl bg-white/80 px-3 py-2 ${
        draggable ? "cursor-grab active:cursor-grabbing" : ""
      }`}
    >
      {student.studentNo} {student.studentName} · {genderLabel(student.gender)} ·{" "}
      {ACHIEVEMENT_LABELS[student.achievementLevel]}
    </li>
  );
}

function DropGroupCard({
  groupNo,
  members,
  dragOver,
  saving,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStart,
}: {
  groupNo: number;
  members: RosterStudent[];
  dragOver: boolean;
  saving: boolean;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: (studentId: string) => void;
  onDragStart: (studentId: string) => void;
}) {
  return (
    <div
      className={`rounded-2xl border-2 p-5 transition ${
        dragOver
          ? "border-violet-500 bg-violet-100/80 ring-2 ring-violet-300"
          : members.length > 0
            ? "border-violet-200 bg-gradient-to-br from-violet-50 to-white shadow-sm"
            : "border-dashed border-slate-200 bg-slate-50/70"
      }`}
      onDragOver={(e) => {
        if (saving) return;
        e.preventDefault();
        onDragOver();
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        onDragLeave();
        if (saving) return;
        const studentId = e.dataTransfer.getData("text/plain");
        if (studentId) onDrop(studentId);
      }}
    >
      <p className="text-xl font-bold text-violet-900">
        {groupNo}모둠 ({members.length}명)
      </p>
      {members.length > 0 ? (
        <ul className="mt-3 space-y-2 text-base text-slate-700">
          {members.map((s) => (
            <StudentChip
              key={s.id}
              student={s}
              draggable={!saving}
              onDragStart={onDragStart}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-base text-slate-400">
          {dragOver ? "여기에 놓으세요" : "배정된 학생 없음 · 학생을 드래그해 배치"}
        </p>
      )}
    </div>
  );
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
  onGroupsChange,
}: GroupAssignmentStatusPanelProps) {
  const [dragOverGroup, setDragOverGroup] = useState<number | "unassigned" | null>(null);
  const saving = busy === "assign-save";

  const studentsById = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);
  const sortedStudents = useMemo(
    () => sortRosterStudents(students.filter((s) => s.active)),
    [students],
  );
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

  const handleDrop = (targetGroupNo: number | null, studentId: string) => {
    if (!studentId) return;
    onGroupsChange(moveStudentBetweenGroups(groups, studentId, targetGroupNo));
  };

  return (
    <section className="ui-panel">
      <h2 className="ui-section-title">
        4. 모둠 편성 현황 ({year}년 {month}월 · {grade}학년 {classNo}반)
      </h2>
      <p className="ui-section-desc text-base">
        위 명렬표 학생이 반영됩니다. 학생 이름을 드래그해 모둠을 바꿀 수 있으며, 자동 편성·확정 시 저장되어
        새로고침 후에도 유지됩니다.
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
        {saving && <span className="ui-chip bg-slate-100 text-slate-600">저장 중…</span>}
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
          자동 6모둠 편성에는 <strong>18~24명</strong>(모둠당 3~4명)이 필요합니다. 현재 {activeCount}명 — 아래에
          명단·미배정 현황만 표시됩니다.
        </p>
      )}
      {activeCount > GROUP_COUNT * 4 && (
        <p className="ui-banner mt-5 border-amber-200 bg-amber-50 text-amber-950">
          학생이 {GROUP_COUNT * 4}명을 초과하면 6모둠 자동 편성이 어렵습니다. 현재 {activeCount}명 — 명단을 조정하거나
          드래그로 수동 조정해 주세요.
        </p>
      )}

      {unassigned.length > 0 && (
        <div
          className={`mt-8 rounded-2xl border-2 border-dashed p-5 transition ${
            dragOverGroup === "unassigned"
              ? "border-amber-500 bg-amber-100/80 ring-2 ring-amber-300"
              : "border-amber-200 bg-amber-50/60"
          }`}
          onDragOver={(e) => {
            if (saving) return;
            e.preventDefault();
            setDragOverGroup("unassigned");
          }}
          onDragLeave={() => setDragOverGroup(null)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOverGroup(null);
            if (saving) return;
            const studentId = e.dataTransfer.getData("text/plain");
            if (studentId) handleDrop(null, studentId);
          }}
        >
          <p className="text-lg font-bold text-amber-950">미배정 ({unassigned.length}명)</p>
          <p className="mt-1 text-sm text-amber-900/80">모둠에서 빼려면 여기로 드래그하세요.</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {unassigned.map((s) => (
              <li key={s.id}>
                <span
                  draggable={!saving}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", s.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  className={`inline-block rounded-full bg-white px-3 py-1 text-sm text-amber-950 ring-1 ring-amber-200 ${
                    saving ? "" : "cursor-grab active:cursor-grabbing"
                  }`}
                >
                  {s.studentNo} {s.studentName}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: GROUP_COUNT }, (_, i) => {
          const groupNo = i + 1;
          const slot = groups.find((g) => g.groupNo === groupNo) ?? { groupNo, memberIds: [] };
          const members = getGroupMembers(slot, studentsById);
          return (
            <DropGroupCard
              key={groupNo}
              groupNo={groupNo}
              members={members}
              dragOver={dragOverGroup === groupNo}
              saving={saving}
              onDragOver={() => setDragOverGroup(groupNo)}
              onDragLeave={() => setDragOverGroup(null)}
              onDrop={(studentId) => handleDrop(groupNo, studentId)}
              onDragStart={() => {}}
            />
          );
        })}
      </div>

      {students.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-bold text-slate-900">학생별 모둠 배정표</h3>
          <RosterScrollTable>
            <RosterStickyHead extraHeaders={<th className="ui-table-cell">모둠</th>} />
            <tbody>
              {sortedStudents.map((s) => {
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
    </section>
  );
}
