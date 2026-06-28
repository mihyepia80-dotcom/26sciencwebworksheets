import { GROUP_COUNT, normalizeStudentNo } from "./constants";
import type { GroupSlot, RosterStudent, SeparationRule, StudentRoleAssignment } from "./types";
import { assignGroups } from "./assign-groups";

export function ensureSixGroupSlots(groups: GroupSlot[]): GroupSlot[] {
  const byNo = new Map(groups.map((g) => [g.groupNo, g]));
  return Array.from({ length: GROUP_COUNT }, (_, i) => {
    const slot = byNo.get(i + 1);
    return slot ?? { groupNo: i + 1, memberIds: [], memberNos: [] };
  });
}

export function enrichGroupSlots(groups: GroupSlot[], students: RosterStudent[]): GroupSlot[] {
  const byId = new Map(students.map((s) => [s.id, s]));
  return ensureSixGroupSlots(groups).map((g) => ({
    groupNo: g.groupNo,
    memberIds: g.memberIds,
    memberNos: g.memberIds
      .map((id) => byId.get(id)?.studentNo)
      .filter((no): no is string => Boolean(no))
      .map(normalizeStudentNo),
  }));
}

export function resolveGroupSlots(groups: GroupSlot[], students: RosterStudent[]): GroupSlot[] {
  const byId = new Map(students.map((s) => [s.id, s]));
  const byNo = new Map(students.map((s) => [normalizeStudentNo(s.studentNo), s]));
  const activeIds = new Set(students.filter((s) => s.active).map((s) => s.id));

  const resolveMemberIds = (slot: GroupSlot): string[] => {
    const fromNos = (slot.memberNos ?? [])
      .map((no) => byNo.get(normalizeStudentNo(no)))
      .filter((s): s is RosterStudent => Boolean(s?.active))
      .map((s) => s.id);

    if (fromNos.length > 0) return [...new Set(fromNos)];

    return [...new Set(slot.memberIds.filter((id) => activeIds.has(id)))];
  };

  const base = groups.length > 0 ? ensureSixGroupSlots(groups) : ensureSixGroupSlots([]);
  return base.map((slot) => {
    const memberIds = resolveMemberIds(slot);
    return {
      groupNo: slot.groupNo,
      memberIds,
      memberNos: memberIds.map((id) => normalizeStudentNo(byId.get(id)!.studentNo)),
    };
  });
}

export function isGroupAssignmentStale(groups: GroupSlot[], students: RosterStudent[]): boolean {
  const active = students.filter((s) => s.active);
  if (active.length === 0) return false;

  const activeIds = new Set(active.map((s) => s.id));
  const resolved = resolveGroupSlots(groups, students);
  const assigned = new Set(resolved.flatMap((g) => g.memberIds));

  if (assigned.size === 0) return active.length >= GROUP_COUNT * 3;

  for (const student of active) {
    if (!assigned.has(student.id)) return true;
  }
  for (const id of assigned) {
    if (!activeIds.has(id)) return true;
  }
  return false;
}

export function syncGroupsFromRoster(
  currentGroups: GroupSlot[],
  students: RosterStudent[],
  _rules: SeparationRule[],
  options?: { autoAssignIfEmpty?: boolean },
): GroupSlot[] {
  const resolved = resolveGroupSlots(currentGroups, students);

  // 저장된 편성이 있으면 학번 기준으로만 복원 (무작위 재편성하지 않음)
  if (resolved.some((g) => g.memberIds.length > 0)) {
    return enrichGroupSlots(resolved, students);
  }

  if (options?.autoAssignIfEmpty) {
    const activeCount = students.filter((s) => s.active).length;
    if (activeCount >= GROUP_COUNT * 3) {
      try {
        return enrichGroupSlots(assignGroups(students, _rules), students);
      } catch {
        return enrichGroupSlots(resolved, students);
      }
    }
  }

  return enrichGroupSlots(resolved, students);
}

export function getGroupMembers(
  slot: GroupSlot,
  studentsById: Map<string, RosterStudent>,
): RosterStudent[] {
  return slot.memberIds
    .map((id) => studentsById.get(id))
    .filter((s): s is RosterStudent => Boolean(s));
}

export function getUnassignedStudents(groups: GroupSlot[], students: RosterStudent[]): RosterStudent[] {
  const assigned = new Set(groups.flatMap((g) => g.memberIds));
  return students
    .filter((s) => s.active && !assigned.has(s.id))
    .sort((a, b) => a.studentNo.localeCompare(b.studentNo, "ko", { numeric: true }));
}

export function resolveRoleAssignments(
  assignments: StudentRoleAssignment[],
  students: RosterStudent[],
): StudentRoleAssignment[] {
  const byNo = new Map(students.map((s) => [normalizeStudentNo(s.studentNo), s]));
  return assignments
    .map((a) => {
      const student = byNo.get(normalizeStudentNo(a.studentNo));
      if (!student) return null;
      return {
        ...a,
        rosterStudentId: student.id,
        studentName: student.studentName,
      };
    })
    .filter((a): a is StudentRoleAssignment => Boolean(a));
}
