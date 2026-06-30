import type { RoleCode } from "./constants";

export type Gender = "male" | "female";
export type AchievementLevel = 1 | 2 | 3;

export interface RosterStudent {
  id: string;
  rosterId: string;
  teacherUid: string;
  grade: string;
  classNo: string;
  studentNo: string;
  studentName: string;
  gender: Gender;
  achievementLevel: AchievementLevel;
  active: boolean;
}

export interface SeparationRule {
  id: string;
  rosterId: string;
  teacherUid: string;
  grade?: string;
  classNo?: string;
  typeLabel: string;
  studentIds: string[];
  /** 명단 ID 변경 시에도 표시·편성에 사용 */
  studentNos?: string[];
}

export interface GroupSlot {
  groupNo: number;
  memberIds: string[];
  /** 명단 ID 변경 시 편성 복원용 */
  memberNos?: string[];
}

export interface MonthlyAssignment {
  id: string;
  rosterId: string;
  teacherUid: string;
  grade: string;
  classNo: string;
  year: number;
  month: number;
  groups: GroupSlot[];
  confirmedAt: import("firebase/firestore").Timestamp | null;
}

export interface StudentRoleAssignment {
  rosterStudentId: string;
  studentNo: string;
  studentName: string;
  groupNo: number;
  primaryRoleCode: RoleCode;
  secondaryRoleCode: RoleCode | null;
}

export interface RoleWeekSchedule {
  id: string;
  rosterId: string;
  teacherUid: string;
  grade: string;
  classNo: string;
  weekIndex: number;
  weekStart: string;
  weekEnd: string;
  groups: GroupSlot[];
  assignments: StudentRoleAssignment[];
  year?: number;
  month?: number;
  updatedAt: import("firebase/firestore").Timestamp | null;
}

export interface StudentGroupMemberView {
  studentNo: string;
  studentName: string;
}

export interface StudentGroupActivityView {
  groupNo: number | null;
  groupMembers: StudentGroupMemberView[];
  primaryRoleCode: RoleCode | null;
  secondaryRoleCode: RoleCode | null;
  weekStart: string;
  weekEnd: string;
  weekIndex: number;
  year: number | null;
  month: number | null;
  myPraises: GroupActivityPraise[];
  classPraises: GroupActivityPraise[];
  hasGroups: boolean;
  hasRoles: boolean;
}

export interface GroupActivityPraise {
  id: string;
  rosterId: string;
  teacherUid: string;
  rosterStudentId: string;
  studentNo: string;
  studentName: string;
  groupNo: number;
  weekIndex: number;
  weekStart: string;
  primaryRoleCode: RoleCode;
  note?: string;
  createdAt: import("firebase/firestore").Timestamp | null;
}

export interface ClassRosterMeta {
  rosterId: string;
  teacherUid: string;
  grade: string;
  classNo: string;
  anchorDate: string;
}
