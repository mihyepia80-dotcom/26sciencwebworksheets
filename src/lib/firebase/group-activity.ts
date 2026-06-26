"use client";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { buildRosterId, ROLE_WEEK_ANCHOR } from "@/lib/group-activity/constants";
import { assignGroups } from "@/lib/group-activity/assign-groups";
import { assignRolesForAllGroups } from "@/lib/group-activity/assign-roles";
import type {
  AchievementLevel,
  ClassRosterMeta,
  Gender,
  GroupActivityPraise,
  GroupSlot,
  MonthlyAssignment,
  RoleWeekSchedule,
  RosterStudent,
  SeparationRule,
  StudentRoleAssignment,
} from "@/lib/group-activity/types";
import { getWeekInfo } from "@/lib/group-activity/week-utils";
import { parseAchievementLevel, parseGender } from "@/lib/group-activity/parse-roster";
import { getClientDb } from "./client";

export { parseAchievementLevel, parseGender };

function mapStudent(id: string, data: Record<string, unknown>): RosterStudent {
  const level = Number(data.achievementLevel ?? 2);
  const achievementLevel = (level === 1 || level === 3 ? level : 2) as AchievementLevel;
  const gender = data.gender === "male" || data.gender === "female" ? data.gender : "male";
  return {
    id,
    rosterId: String(data.rosterId ?? ""),
    teacherUid: String(data.teacherUid ?? ""),
    grade: String(data.grade ?? ""),
    classNo: String(data.classNo ?? ""),
    studentNo: String(data.studentNo ?? ""),
    studentName: String(data.studentName ?? ""),
    gender,
    achievementLevel,
    active: data.active !== false,
  };
}

export async function ensureRosterMeta(
  teacherUid: string,
  grade: string,
  classNo: string,
): Promise<ClassRosterMeta> {
  const rosterId = buildRosterId(teacherUid, grade, classNo);
  await setDoc(
    doc(getClientDb(), "classRosters", rosterId),
    {
      teacherUid,
      grade,
      classNo,
      anchorDate: ROLE_WEEK_ANCHOR,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return { rosterId, teacherUid, grade, classNo, anchorDate: ROLE_WEEK_ANCHOR };
}

export async function listTeacherClasses(teacherUid: string): Promise<ClassRosterMeta[]> {
  const snap = await getDocs(
    query(collection(getClientDb(), "classRosters"), where("teacherUid", "==", teacherUid)),
  );
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        rosterId: d.id,
        teacherUid: String(data.teacherUid ?? ""),
        grade: String(data.grade ?? ""),
        classNo: String(data.classNo ?? ""),
        anchorDate: String(data.anchorDate ?? ROLE_WEEK_ANCHOR),
      };
    })
    .sort((a, b) => {
      const g = a.grade.localeCompare(b.grade, "ko");
      if (g !== 0) return g;
      return a.classNo.localeCompare(b.classNo, "ko", { numeric: true });
    });
}

export async function registerTeacherClass(
  teacherUid: string,
  grade: string,
  classNo: string,
): Promise<ClassRosterMeta> {
  return ensureRosterMeta(teacherUid, grade.trim(), classNo.trim());
}

export async function bulkUpsertRosterStudents(
  teacherUid: string,
  grade: string,
  classNo: string,
  rows: {
    studentNo: string;
    studentName: string;
    gender: Gender;
    achievementLevel: AchievementLevel;
    active?: boolean;
  }[],
): Promise<number> {
  const rosterId = buildRosterId(teacherUid, grade, classNo);
  await ensureRosterMeta(teacherUid, grade, classNo);

  const existing = await listRosterStudents(rosterId);
  const byNo = new Map(existing.map((s) => [s.studentNo, s]));

  for (const row of rows) {
    const prev = byNo.get(row.studentNo);
    await upsertRosterStudent(teacherUid, grade, classNo, {
      id: prev?.id,
      studentNo: row.studentNo,
      studentName: row.studentName,
      gender: row.gender,
      achievementLevel: row.achievementLevel,
      active: row.active ?? true,
    });
  }
  return rows.length;
}

export async function listRosterStudents(rosterId: string): Promise<RosterStudent[]> {
  const snap = await getDocs(
    query(collection(getClientDb(), "groupRosterStudents"), where("rosterId", "==", rosterId)),
  );
  return snap.docs
    .map((d) => mapStudent(d.id, d.data()))
    .sort((a, b) => a.studentNo.localeCompare(b.studentNo, "ko", { numeric: true }));
}

export async function upsertRosterStudent(
  teacherUid: string,
  grade: string,
  classNo: string,
  student: Omit<RosterStudent, "id" | "rosterId" | "teacherUid" | "grade" | "classNo"> & { id?: string },
): Promise<string> {
  const rosterId = buildRosterId(teacherUid, grade, classNo);
  await ensureRosterMeta(teacherUid, grade, classNo);
  const id = student.id ?? doc(collection(getClientDb(), "groupRosterStudents")).id;
  await setDoc(doc(getClientDb(), "groupRosterStudents", id), {
    rosterId,
    teacherUid,
    grade,
    classNo,
    studentNo: student.studentNo,
    studentName: student.studentName,
    gender: student.gender,
    achievementLevel: student.achievementLevel,
    active: student.active,
    updatedAt: serverTimestamp(),
  });
  return id;
}

export async function deleteRosterStudent(studentId: string): Promise<void> {
  await deleteDoc(doc(getClientDb(), "groupRosterStudents", studentId));
}

export async function updateAchievementLevel(studentId: string, achievementLevel: AchievementLevel): Promise<void> {
  await setDoc(
    doc(getClientDb(), "groupRosterStudents", studentId),
    { achievementLevel, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function listSeparationRules(rosterId: string): Promise<SeparationRule[]> {
  const snap = await getDocs(
    query(collection(getClientDb(), "groupSeparations"), where("rosterId", "==", rosterId)),
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      rosterId: String(data.rosterId ?? ""),
      teacherUid: String(data.teacherUid ?? ""),
      typeLabel: String(data.typeLabel ?? ""),
      studentIds: Array.isArray(data.studentIds) ? data.studentIds.map(String) : [],
    };
  });
}

export async function saveSeparationRule(
  teacherUid: string,
  rosterId: string,
  typeLabel: string,
  studentIds: string[],
  id?: string,
): Promise<string> {
  const docId = id ?? doc(collection(getClientDb(), "groupSeparations")).id;
  await setDoc(doc(getClientDb(), "groupSeparations", docId), {
    rosterId,
    teacherUid,
    typeLabel,
    studentIds,
    updatedAt: serverTimestamp(),
  });
  return docId;
}

export async function deleteSeparationRule(ruleId: string): Promise<void> {
  await deleteDoc(doc(getClientDb(), "groupSeparations", ruleId));
}

function assignmentDocId(rosterId: string, year: number, month: number): string {
  return `${rosterId}__${year}_${month}`;
}

export async function getMonthlyAssignment(
  rosterId: string,
  year: number,
  month: number,
): Promise<MonthlyAssignment | null> {
  const snap = await getDoc(doc(getClientDb(), "groupAssignments", assignmentDocId(rosterId, year, month)));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    rosterId: String(data.rosterId ?? ""),
    teacherUid: String(data.teacherUid ?? ""),
    grade: String(data.grade ?? ""),
    classNo: String(data.classNo ?? ""),
    year: Number(data.year),
    month: Number(data.month),
    groups: (data.groups as GroupSlot[]) ?? [],
    confirmedAt: (data.confirmedAt as Timestamp | null) ?? null,
  };
}

export async function saveMonthlyAssignment(
  teacherUid: string,
  grade: string,
  classNo: string,
  year: number,
  month: number,
  groups: GroupSlot[],
  confirmed: boolean,
): Promise<void> {
  const rosterId = buildRosterId(teacherUid, grade, classNo);
  await setDoc(doc(getClientDb(), "groupAssignments", assignmentDocId(rosterId, year, month)), {
    rosterId,
    teacherUid,
    grade,
    classNo,
    year,
    month,
    groups,
    confirmedAt: confirmed ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  });
}

export function computeGroupAssignment(
  students: RosterStudent[],
  rules: SeparationRule[],
  seed?: number,
): GroupSlot[] {
  return assignGroups(students, rules, seed);
}

export async function saveRoleSchedule(
  teacherUid: string,
  grade: string,
  classNo: string,
  groups: GroupSlot[],
  students: RosterStudent[],
  weekIndex?: number,
): Promise<RoleWeekSchedule> {
  const rosterId = buildRosterId(teacherUid, grade, classNo);
  const week = getWeekInfo(new Date(), ROLE_WEEK_ANCHOR);
  const idx = weekIndex ?? week.weekIndex;
  const studentsById = new Map(students.map((s) => [s.id, s]));
  const assignments = assignRolesForAllGroups(groups, studentsById, idx);

  const payload = {
    rosterId,
    teacherUid,
    grade,
    classNo,
    weekIndex: idx,
    weekStart: week.weekStart,
    weekEnd: week.weekEnd,
    groups,
    assignments,
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(getClientDb(), "groupRoleSchedules", rosterId), payload);
  return {
    id: rosterId,
    rosterId,
    teacherUid,
    grade,
    classNo,
    weekIndex: idx,
    weekStart: week.weekStart,
    weekEnd: week.weekEnd,
    assignments,
    updatedAt: null,
  };
}

export async function getRoleScheduleForClass(grade: string, classNo: string): Promise<RoleWeekSchedule | null> {
  const snap = await getDocs(
    query(
      collection(getClientDb(), "groupRoleSchedules"),
      where("grade", "==", grade),
      where("classNo", "==", classNo),
    ),
  );
  if (snap.empty) return null;
  const d = snap.docs[0];
  const data = d.data();
  return {
    id: d.id,
    rosterId: String(data.rosterId ?? ""),
    teacherUid: String(data.teacherUid ?? ""),
    grade: String(data.grade ?? ""),
    classNo: String(data.classNo ?? ""),
    weekIndex: Number(data.weekIndex ?? 1),
    weekStart: String(data.weekStart ?? ""),
    weekEnd: String(data.weekEnd ?? ""),
    assignments: (data.assignments as StudentRoleAssignment[]) ?? [],
    updatedAt: (data.updatedAt as Timestamp | null) ?? null,
  };
}

export async function listGroupActivityPraises(rosterId: string, weekIndex: number): Promise<GroupActivityPraise[]> {
  const snap = await getDocs(
    query(
      collection(getClientDb(), "groupActivityPraises"),
      where("rosterId", "==", rosterId),
      where("weekIndex", "==", weekIndex),
    ),
  );
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      rosterId: String(data.rosterId ?? ""),
      teacherUid: String(data.teacherUid ?? ""),
      rosterStudentId: String(data.rosterStudentId ?? ""),
      studentNo: String(data.studentNo ?? ""),
      studentName: String(data.studentName ?? ""),
      groupNo: Number(data.groupNo),
      weekIndex: Number(data.weekIndex),
      weekStart: String(data.weekStart ?? ""),
      primaryRoleCode: Number(data.primaryRoleCode) as 1 | 2 | 3 | 4,
      note: data.note ? String(data.note) : undefined,
      createdAt: (data.createdAt as Timestamp | null) ?? null,
    };
  });
}

export async function addGroupActivityPraise(
  teacherUid: string,
  rosterId: string,
  grade: string,
  classNo: string,
  student: RosterStudent,
  groupNo: number,
  weekIndex: number,
  weekStart: string,
  primaryRoleCode: 1 | 2 | 3 | 4,
  note?: string,
): Promise<void> {
  const id = doc(collection(getClientDb(), "groupActivityPraises")).id;
  await setDoc(doc(getClientDb(), "groupActivityPraises", id), {
    rosterId,
    teacherUid,
    grade,
    classNo,
    rosterStudentId: student.id,
    studentNo: student.studentNo,
    studentName: student.studentName,
    groupNo,
    weekIndex,
    weekStart,
    primaryRoleCode,
    note: note ?? "",
    createdAt: serverTimestamp(),
  });
}

