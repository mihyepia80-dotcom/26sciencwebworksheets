import { ROLE_CODES, type RoleCode } from "./constants";
import type { RosterStudent, StudentRoleAssignment } from "./types";

function rotate<T>(arr: T[], offset: number): T[] {
  const n = arr.length;
  const o = ((offset % n) + n) % n;
  return [...arr.slice(o), ...arr.slice(0, o)];
}

function studentAssignment(
  student: RosterStudent,
  groupNo: number,
  primary: RoleCode,
  secondary: RoleCode | null,
): StudentRoleAssignment {
  return {
    rosterStudentId: student.id,
    studentNo: student.studentNo,
    studentName: student.studentName,
    groupNo,
    primaryRoleCode: primary,
    secondaryRoleCode: secondary,
  };
}

/** 4명 모둠: 역할 1~4 각 1명, 주간 순환 */
function assignRolesForFour(
  members: RosterStudent[],
  groupNo: number,
  weekIndex: number,
): StudentRoleAssignment[] {
  const sorted = [...members].sort((a, b) => a.studentNo.localeCompare(b.studentNo, "ko", { numeric: true }));
  const roles = rotate([...ROLE_CODES], weekIndex - 1);
  return sorted.map((student, i) => studentAssignment(student, groupNo, roles[i] as RoleCode, null));
}

/** 3명 모둠: 3역할 + 1역할 중복(주·보조) */
function assignRolesForThree(
  members: RosterStudent[],
  groupNo: number,
  weekIndex: number,
): StudentRoleAssignment[] {
  const sorted = [...members].sort((a, b) => a.studentNo.localeCompare(b.studentNo, "ko", { numeric: true }));
  const [a, b, c] = sorted;
  const skippedRole = ROLE_CODES[(weekIndex - 1) % 4];
  const activeRoles = ROLE_CODES.filter((r) => r !== skippedRole) as [RoleCode, RoleCode, RoleCode];
  const duplicateRole = activeRoles[weekIndex % 3];
  const others = activeRoles.filter((r) => r !== duplicateRole);
  const rot = weekIndex % 3;

  if (rot === 0) {
    return [
      studentAssignment(a, groupNo, duplicateRole, null),
      studentAssignment(b, groupNo, others[0], duplicateRole),
      studentAssignment(c, groupNo, others[1], null),
    ];
  }
  if (rot === 1) {
    return [
      studentAssignment(a, groupNo, others[0], null),
      studentAssignment(b, groupNo, duplicateRole, null),
      studentAssignment(c, groupNo, others[1], duplicateRole),
    ];
  }
  return [
    studentAssignment(a, groupNo, others[1], null),
    studentAssignment(b, groupNo, others[0], null),
    studentAssignment(c, groupNo, duplicateRole, others[0]),
  ];
}

export function assignRolesForGroup(
  members: RosterStudent[],
  groupNo: number,
  weekIndex: number,
): StudentRoleAssignment[] {
  if (members.length === 4) return assignRolesForFour(members, groupNo, weekIndex);
  if (members.length === 3) return assignRolesForThree(members, groupNo, weekIndex);
  throw new Error(`${groupNo}모둠 인원(${members.length}명)은 3~4명이어야 합니다.`);
}

export function assignRolesForAllGroups(
  groups: { groupNo: number; memberIds: string[] }[],
  studentsById: Map<string, RosterStudent>,
  weekIndex: number,
): StudentRoleAssignment[] {
  const all: StudentRoleAssignment[] = [];
  for (const group of groups) {
    const members = group.memberIds.map((id) => studentsById.get(id)).filter(Boolean) as RosterStudent[];
    all.push(...assignRolesForGroup(members, group.groupNo, weekIndex));
  }
  return all;
}
