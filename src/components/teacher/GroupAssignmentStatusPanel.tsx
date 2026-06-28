"use client";

import { useMemo, useState } from "react";
import { ACHIEVEMENT_LABELS, GROUP_COUNT } from "@/lib/group-activity/constants";
import { getStudentDragData, setStudentDragData } from "@/lib/group-activity/drag-data";
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
  onSave: () => void;
  onDelete: () => void;
}

function StudentChip({
  student,
  draggable,
  compact,
}: {
  student: RosterStudent;
  draggable: boolean;
  compact?: boolean;
}) {
  return (
    <span
      draggable={draggable}
      onDragStart={(e) => {
        if (!draggable) return;
        setStudentDragData(e.dataTransfer, student.id);
      }}
      className={`inline-flex select-none rounded-xl bg-white/90 text-slate-700 ring-1 ring-slate-200 ${
        compact ? "px-2.5 py-1 text-sm" : "px-3 py-2 text-base"
      } ${draggable ? "cursor-grab active:cursor-grabbing hover:ring-violet-300" : ""}`}
    >
      {student.studentNo} {student.studentName}
      {!compact && (
        <>
          {" "}
          · {genderLabel(student.gender)} · {ACHIEVEMENT_LABELS[student.achievementLevel]}
        </>
      )}
    </span>
  );
}

function DropGroupCard({
  groupNo,
  members,
  dragOver,
  saving,
  onDrop,
}: {
  groupNo: number;
  members: RosterStudent[];
  dragOver: boolean;
  saving: boolean;
  onDrop: (studentId: string) => void;
}) {
  const [dragDepth, setDragDepth] = useState(0);
  const isDragOver = dragOver || dragDepth > 0;

  return (
    <div
      className={`rounded-2xl border-2 p-5 transition ${
        isDragOver
          ? "border-violet-500 bg-violet-100/80 ring-2 ring-violet-300"
          : members.length > 0
            ? "border-violet-200 bg-gradient-to-br from-violet-50 to-white shadow-sm"
            : "border-dashed border-slate-200 bg-slate-50/70"
      }`}
      onDragEnter={(e) => {
        if (saving) return;
        e.preventDefault();
        setDragDepth((d) => d + 1);
      }}
      onDragOver={(e) => {
        if (saving) return;
        e.preventDefault();
      }}
      onDragLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setDragDepth(0);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragDepth(0);
        if (saving) return;
        const studentId = getStudentDragData(e.dataTransfer);
        if (studentId) onDrop(studentId);
      }}
    >
      <p className="text-xl font-bold text-violet-900">
        {groupNo}모둠 ({members.length}명)
      </p>
      {members.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {members.map((s) => (
            <li key={s.id}>
              <StudentChip student={s} draggable={!saving} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-base text-slate-400">
          {isDragOver ? "여기에 놓으세요" : "학생을 드래그해 배치"}
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
  onSave,
  onDelete,
}: GroupAssignmentStatusPanelProps) {
  const [dragOverUnassigned, setDragOverUnassigned] = useState(false);
  const saving = busy === "assign-save" || busy === "assign-delete";

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
        학생을 드래그해 6모둠에 배치·이동할 수 있습니다. 변경 시 자동 저장되며, 「편성 저장」「편성 삭제」로
        직접 관리할 수도 있습니다.
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
        {busy === "assign-save" && <span className="ui-chip bg-slate-100 text-slate-600">저장 중…</span>}
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
        <button
          type="button"
          className="ui-btn-secondary"
          disabled={saving || assignedCount === 0}
          onClick={onSave}
        >
          편성 저장
        </button>
        <button
          type="button"
          className="ui-btn-secondary text-red-700"
          disabled={saving || (assignedCount === 0 && !assignmentConfirmed)}
          onClick={onDelete}
        >
          편성 삭제
        </button>
      </div>

      {activeCount > 0 && activeCount < minRequired && (
        <p className="ui-banner mt-5 border-amber-200 bg-amber-50 text-amber-950">
          자동 6모둠 편성에는 <strong>18~24명</strong>(모둠당 3~4명)이 필요합니다. 현재 {activeCount}명 — 드래그로
          수동 배치하거나 명단을 조정해 주세요.
        </p>
      )}
      {activeCount > GROUP_COUNT * 4 && (
        <p className="ui-banner mt-5 border-amber-200 bg-amber-50 text-amber-950">
          학생이 {GROUP_COUNT * 4}명을 초과하면 6모둠 자동 편성이 어렵습니다. 현재 {activeCount}명 — 드래그로 수동
          조정해 주세요.
        </p>
      )}

      {sortedStudents.length > 0 && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
          <h3 className="text-lg font-bold text-slate-900">학생 명단 (드래그하여 모둠에 배치)</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {sortedStudents.map((s) => (
              <StudentChip key={s.id} student={s} draggable={!saving} compact />
            ))}
          </div>
        </div>
      )}

      <div
        className={`mt-6 rounded-2xl border-2 border-dashed p-5 transition ${
          dragOverUnassigned
            ? "border-amber-500 bg-amber-100/80 ring-2 ring-amber-300"
            : "border-amber-200 bg-amber-50/60"
        }`}
        onDragEnter={(e) => {
          if (saving) return;
          e.preventDefault();
          setDragOverUnassigned(true);
        }}
        onDragOver={(e) => {
          if (saving) return;
          e.preventDefault();
        }}
        onDragLeave={(e) => {
          if (e.currentTarget.contains(e.relatedTarget as Node)) return;
          setDragOverUnassigned(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragOverUnassigned(false);
          if (saving) return;
          const studentId = getStudentDragData(e.dataTransfer);
          if (studentId) handleDrop(null, studentId);
        }}
      >
        <p className="text-lg font-bold text-amber-950">미배정 ({unassigned.length}명)</p>
        <p className="mt-1 text-sm text-amber-900/80">모둠에서 빼려면 여기로 드래그하세요.</p>
        {unassigned.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {unassigned.map((s) => (
              <li key={s.id}>
                <StudentChip student={s} draggable={!saving} compact />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-amber-800/70">현재 미배정 학생이 없습니다.</p>
        )}
      </div>

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
              dragOver={false}
              saving={saving}
              onDrop={(studentId) => handleDrop(groupNo, studentId)}
            />
          );
        })}
      </div>

      {students.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-bold text-slate-900">학생별 모둠 배정표</h3>
          <RosterScrollTable>
            <RosterStickyHead extraHeaders={<th className="ui-table-cell">모둠 · 드래그</th>} />
            <tbody>
              {sortedStudents.map((s) => {
                const groupNo = groupByStudentId.get(s.id);
                return (
                  <tr key={s.id} className="border-b border-slate-100">
                    <td className="sticky left-0 z-10 bg-white px-3 py-2 font-medium text-slate-800">
                      {s.studentNo}
                    </td>
                    <td className="sticky left-[4.5rem] z-10 bg-white px-3 py-2 text-slate-800">{s.studentName}</td>
                    <td className="ui-table-cell">
                      <div className="flex flex-wrap items-center gap-2">
                        <StudentChip student={s} draggable={!saving} compact />
                        {groupNo ? (
                          <span className="ui-chip bg-violet-100 text-violet-900">{groupNo}모둠</span>
                        ) : (
                          <span className="text-base font-medium text-amber-700">미배정</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </RosterScrollTable>
        </div>
      )}
    </section>
  );
}
