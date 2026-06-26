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
  typeLabel: string;
  studentIds: string[];
}

export interface GroupSlot {
  groupNo: number;
  memberIds: string[];
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
  assignments: StudentRoleAssignment[];
  updatedAt: import("firebase/firestore").Timestamp | null;
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
