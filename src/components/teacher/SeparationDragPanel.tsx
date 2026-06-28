"use client";

import { useMemo, useState } from "react";
import { getStudentDragData, setStudentDragData } from "@/lib/group-activity/drag-data";
import { sortRosterStudents } from "@/lib/group-activity/resolve-groups";
import type { RosterStudent, SeparationRule } from "@/lib/group-activity/types";
import { resolveSeparationStudentEntries } from "@/lib/firebase/group-activity";

const INPUT = "ui-input-compact";
const BTN_PRIMARY = "ui-btn-accent";
const BTN_SECONDARY = "ui-btn-secondary";

interface SeparationDragPanelProps {
  students: RosterStudent[];
  separations: SeparationRule[];
  separationStudentStatus: { student: RosterStudent; labels: string[] }[];
  busy: string;
  onSavePair: (label: string, studentIds: [string, string], ruleId?: string) => Promise<void>;
  onDeleteRule: (ruleId: string) => Promise<void>;
}

function StudentDragChip({
  student,
  disabled,
  selected,
  onClick,
}: {
  student: RosterStudent;
  disabled?: boolean;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <span
      draggable={!disabled}
      onDragStart={(e) => {
        if (disabled) return;
        setStudentDragData(e.dataTransfer, student.id);
      }}
      onClick={onClick}
      className={`inline-flex select-none rounded-full px-3 py-1.5 text-sm font-medium transition ${
        disabled ? "cursor-default opacity-60" : "cursor-grab active:cursor-grabbing"
      } ${
        selected
          ? "bg-violet-600 text-white ring-2 ring-violet-300"
          : "bg-white text-slate-800 ring-1 ring-slate-200 hover:ring-violet-300"
      }`}
    >
      {student.studentNo} {student.studentName}
    </span>
  );
}

function PairSlot({
  label,
  student,
  dragOver,
  disabled,
  onDrop,
  onClear,
  onDragOver,
  onDragLeave,
}: {
  label: string;
  student: RosterStudent | null;
  dragOver: boolean;
  disabled: boolean;
  onDrop: (studentId: string) => void;
  onClear: () => void;
  onDragOver: () => void;
  onDragLeave: () => void;
}) {
  return (
    <div
      className={`flex min-h-[5.5rem] flex-1 flex-col rounded-2xl border-2 border-dashed p-4 transition ${
        dragOver
          ? "border-violet-500 bg-violet-100/70 ring-2 ring-violet-300"
          : student
            ? "border-violet-200 bg-white"
            : "border-slate-200 bg-slate-50/80"
      }`}
      onDragOver={(e) => {
        if (disabled) return;
        e.preventDefault();
        onDragOver();
      }}
      onDragLeave={onDragLeave}
      onDrop={(e) => {
        e.preventDefault();
        onDragLeave();
        if (disabled) return;
        const studentId = getStudentDragData(e.dataTransfer);
        if (studentId) onDrop(studentId);
      }}
    >
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      {student ? (
        <div className="mt-2 flex items-start justify-between gap-2">
          <StudentDragChip student={student} disabled={disabled} selected />
          {!disabled && (
            <button type="button" className="text-xs text-red-600 hover:underline" onClick={onClear}>
              빼기
            </button>
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-400">{dragOver ? "여기에 놓으세요" : "학생을 드래그"}</p>
      )}
    </div>
  );
}

export function SeparationDragPanel({
  students,
  separations,
  separationStudentStatus,
  busy,
  onSavePair,
  onDeleteRule,
}: SeparationDragPanelProps) {
  const saving = busy === "sep";
  const sortedStudents = useMemo(
    () => sortRosterStudents(students.filter((s) => s.active)),
    [students],
  );
  const studentsById = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);

  const [slotIds, setSlotIds] = useState<[string | null, string | null]>([null, null]);
  const [typeLabel, setTypeLabel] = useState("떠듬");
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<0 | 1 | "pool" | null>(null);

  const slotStudents = slotIds.map((id) => (id ? studentsById.get(id) ?? null : null));

  const placeInSlot = (slotIndex: 0 | 1, studentId: string) => {
    setSlotIds((prev) => {
      const next: [string | null, string | null] = [...prev];
      const otherIndex = slotIndex === 0 ? 1 : 0;
      if (next[otherIndex] === studentId) next[otherIndex] = null;
      next[slotIndex] = studentId;
      return next;
    });
  };

  const clearSlots = () => {
    setSlotIds([null, null]);
    setEditingRuleId(null);
  };

  const handleSave = async () => {
    if (!slotIds[0] || !slotIds[1] || slotIds[0] === slotIds[1]) return;
    await onSavePair(typeLabel.trim() || "분리", [slotIds[0], slotIds[1]], editingRuleId ?? undefined);
    clearSlots();
  };

  const loadRuleForEdit = (rule: SeparationRule) => {
    const members = resolveSeparationStudentEntries(rule, students);
    if (members.length < 2) return;
    setSlotIds([members[0].id, members[1].id]);
    setTypeLabel(rule.typeLabel);
    setEditingRuleId(rule.id);
  };

  return (
    <section className="ui-panel">
      <h2 className="ui-section-title">2. 분리 조건</h2>
      <p className="ui-section-desc text-base">
        같은 모둠에 두지 않을 학생 <strong>2명씩(쌍)</strong>을 드래그해 등록합니다. 여러 쌍은 OR 규칙으로 편성에
        반영됩니다.
      </p>

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">등록 조건 {separations.length}건</span>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">
          등록 학생 {separationStudentStatus.length}명
        </span>
      </div>

      {students.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">명단을 먼저 등록해 주세요.</p>
      ) : (
        <>
          <div
            className={`mt-6 rounded-2xl border-2 p-4 transition ${
              dragOverSlot === "pool"
                ? "border-slate-400 bg-slate-100/80"
                : "border-slate-200 bg-slate-50/60"
            }`}
            onDragOver={(e) => {
              if (saving) return;
              e.preventDefault();
              setDragOverSlot("pool");
            }}
            onDragLeave={() => setDragOverSlot(null)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverSlot(null);
              if (saving) return;
              const studentId = getStudentDragData(e.dataTransfer);
              if (!studentId) return;
              setSlotIds((prev) =>
                prev.map((id) => (id === studentId ? null : id)) as [string | null, string | null],
              );
            }}
          >
            <p className="text-sm font-semibold text-slate-700">학생 명단 — 아래 칩을 분리 쌍 슬롯으로 드래그</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {sortedStudents.map((s) => (
                <StudentDragChip
                  key={s.id}
                  student={s}
                  disabled={saving}
                  selected={slotIds.includes(s.id)}
                  onClick={() => {
                    if (saving) return;
                    if (!slotIds[0]) placeInSlot(0, s.id);
                    else if (!slotIds[1] && slotIds[0] !== s.id) placeInSlot(1, s.id);
                    else if (slotIds[0] === s.id) setSlotIds([null, slotIds[1]]);
                    else if (slotIds[1] === s.id) setSlotIds([slotIds[0], null]);
                  }}
                />
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-violet-200 bg-violet-50/40 p-5">
            <h3 className="text-base font-bold text-violet-950">
              {editingRuleId ? "분리 쌍 수정" : "분리 쌍 만들기"}
            </h3>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <PairSlot
                label="학생 1"
                student={slotStudents[0]}
                dragOver={dragOverSlot === 0}
                disabled={saving}
                onDrop={(id) => placeInSlot(0, id)}
                onClear={() => setSlotIds(([_, b]) => [null, b])}
                onDragOver={() => setDragOverSlot(0)}
                onDragLeave={() => setDragOverSlot(null)}
              />
              <PairSlot
                label="학생 2"
                student={slotStudents[1]}
                dragOver={dragOverSlot === 1}
                disabled={saving}
                onDrop={(id) => placeInSlot(1, id)}
                onClear={() => setSlotIds(([a]) => [a, null])}
                onDragOver={() => setDragOverSlot(1)}
                onDragLeave={() => setDragOverSlot(null)}
              />
            </div>
            <div className="mt-4 flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold text-slate-700">분리 유형</span>
                <input
                  className={`${INPUT} w-32`}
                  value={typeLabel}
                  onChange={(e) => setTypeLabel(e.target.value)}
                  placeholder="유형"
                />
              </label>
              <button
                type="button"
                className={BTN_PRIMARY}
                disabled={saving || !slotIds[0] || !slotIds[1] || slotIds[0] === slotIds[1]}
                onClick={() => void handleSave()}
              >
                {editingRuleId ? "쌍 수정 저장" : "쌍 등록"}
              </button>
              {(slotIds[0] || slotIds[1] || editingRuleId) && (
                <button type="button" className={BTN_SECONDARY} disabled={saving} onClick={clearSlots}>
                  초기화
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {separationStudentStatus.length > 0 && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50/60 p-4">
          <h3 className="text-sm font-bold text-amber-950">분리 조건 등록 학생 현황</h3>
          <ul className="mt-3 flex flex-wrap gap-2 text-sm">
            {separationStudentStatus.map(({ student, labels }) => (
              <li
                key={student.id}
                className="rounded-full bg-white px-3 py-1 text-amber-950 ring-1 ring-amber-200"
              >
                {student.studentNo} {student.studentName} · {labels.join(", ")}
              </li>
            ))}
          </ul>
        </div>
      )}

      <ul className="mt-6 space-y-2">
        {separations.length === 0 && (
          <li className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-sm text-slate-400">
            등록된 분리 조건이 없습니다.
          </li>
        )}
        {separations.map((rule) => {
          const members = resolveSeparationStudentEntries(rule, students);
          return (
            <li key={rule.id} className="rounded-lg bg-slate-50 px-3 py-3 text-sm">
              <div className="flex flex-wrap items-start gap-2">
                <span className="font-medium text-slate-800">{rule.typeLabel}</span>
                <span className="text-xs text-slate-500">({members.length}명)</span>
                <div className="ml-auto flex gap-3">
                  <button
                    type="button"
                    className="text-violet-700 hover:underline"
                    disabled={saving || members.length < 2}
                    onClick={() => loadRuleForEdit(rule)}
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    className="text-red-600 hover:underline"
                    disabled={saving}
                    onClick={() => void onDeleteRule(rule.id)}
                  >
                    삭제
                  </button>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-700">
                {members.length >= 2
                  ? `${members[0].studentNo}번 ${members[0].studentName} ↔ ${members[1].studentNo}번 ${members[1].studentName}`
                  : members.length === 0
                    ? "명단과 연결되지 않은 조건입니다."
                    : members.map((s) => `${s.studentNo}번 ${s.studentName}`).join(", ")}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
