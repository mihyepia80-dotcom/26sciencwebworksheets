"use client";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  type CollectionReference,
  type DocumentReference,
  type Timestamp,
} from "firebase/firestore";
import { buildClassScheduleId, buildRosterId, buildRosterStudentId, normalizeClassPart, normalizeStudentNo, ROLE_WEEK_ANCHOR } from "@/lib/group-activity/constants";
import { assignGroups, assignGroupsWithMeta } from "@/lib/group-activity/assign-groups";
import { assignRolesForAllGroups } from "@/lib/group-activity/assign-roles";
import {
  normalizeSeparationRulesForAssign,
  resolveSeparationStudentIds,
} from "@/lib/group-activity/separation-rules";
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
import { ensureTeacherProfile, prepareTeacherFirestoreAccess } from "./teacher-auth";

export { parseAchievementLevel, parseGender };

function teacherCollection(teacherUid: string, name: string): CollectionReference {
  return collection(getClientDb(), "teachers", teacherUid, name);
}

function teacherDocument(teacherUid: string, name: string, id: string): DocumentReference {
  return doc(getClientDb(), "teachers", teacherUid, name, id);
}

function belongsToRoster(
  itemRosterId: string,
  targetRosterId: string,
  itemGrade: string,
  itemClassNo: string,
  normalizedGrade: string,
  normalizedClassNo: string,
): boolean {
  if (itemRosterId === targetRosterId) return true;
  if (!normalizedGrade || !normalizedClassNo || !itemGrade || !itemClassNo) return false;
  return (
    normalizeClassPart(itemGrade) === normalizedGrade
    && normalizeClassPart(itemClassNo) === normalizedClassNo
  );
}

function dedupeRosterStudents(
  students: RosterStudent[],
  rosterId: string,
): RosterStudent[] {
  const byNo = new Map<string, RosterStudent>();
  for (const student of students) {
    const no = normalizeStudentNo(student.studentNo);
    const canonicalId = buildRosterStudentId(rosterId, no);
    const normalized = { ...student, studentNo: no };
    const prev = byNo.get(no);
    if (!prev || student.id === canonicalId) {
      byNo.set(no, normalized.id === canonicalId ? normalized : { ...normalized, id: canonicalId });
    }
  }
  return Array.from(byNo.values());
}

function dedupeImportRows<T extends { studentNo: string }>(rows: T[]): T[] {
  const byNo = new Map<string, T>();
  for (const row of rows) {
    const no = normalizeStudentNo(row.studentNo);
    byNo.set(no, { ...row, studentNo: no });
  }
  return Array.from(byNo.values());
}

async function removeStaleRosterStudentDocs(
  teacherUid: string,
  rosterId: string,
  normalizedGrade: string,
  normalizedClassNo: string,
  studentNos: Set<string>,
): Promise<void> {
  const snap = await getDocs(teacherCollection(teacherUid, "groupRosterStudents"));
  for (const d of snap.docs) {
    const student = mapStudent(d.id, d.data());
    if (!belongsToRoster(student.rosterId, rosterId, student.grade, student.classNo, normalizedGrade, normalizedClassNo)) continue;
    const no = normalizeStudentNo(student.studentNo);
    if (!studentNos.has(no)) continue;
    const canonicalId = buildRosterStudentId(rosterId, no);
    if (d.id !== canonicalId) {
      await deleteDoc(teacherDocument(teacherUid, "groupRosterStudents", d.id));
    }
  }
}

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
  teacherUser?: Parameters<typeof ensureTeacherProfile>[0],
): Promise<ClassRosterMeta> {
  if (teacherUser) {
    await prepareTeacherFirestoreAccess(teacherUser);
  }
  const normalizedGrade = normalizeClassPart(grade);
  const normalizedClassNo = normalizeClassPart(classNo);
  const rosterId = buildRosterId(teacherUid, normalizedGrade, normalizedClassNo);
  await setDoc(
    teacherDocument(teacherUid, "classRosters", rosterId),
    {
      teacherUid,
      grade: normalizedGrade,
      classNo: normalizedClassNo,
      anchorDate: ROLE_WEEK_ANCHOR,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  return { rosterId, teacherUid, grade: normalizedGrade, classNo: normalizedClassNo, anchorDate: ROLE_WEEK_ANCHOR };
}

export async function listTeacherClasses(
  teacherUid: string,
  teacherUser?: Parameters<typeof prepareTeacherFirestoreAccess>[0],
): Promise<ClassRosterMeta[]> {
  if (teacherUser) {
    await prepareTeacherFirestoreAccess(teacherUser);
  }
  const snap = await getDocs(teacherCollection(teacherUid, "classRosters"));
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        rosterId: d.id,
        teacherUid: String(data.teacherUid ?? teacherUid),
        grade: normalizeClassPart(String(data.grade ?? "")),
        classNo: normalizeClassPart(String(data.classNo ?? "")),
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
  teacherUser?: Parameters<typeof ensureTeacherProfile>[0],
): Promise<ClassRosterMeta> {
  return ensureRosterMeta(teacherUid, grade.trim(), classNo.trim(), teacherUser);
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
  teacherUser?: Parameters<typeof prepareTeacherFirestoreAccess>[0],
): Promise<number> {
  const normalizedGrade = normalizeClassPart(grade);
  const normalizedClassNo = normalizeClassPart(classNo);
  const rosterId = buildRosterId(teacherUid, normalizedGrade, normalizedClassNo);
  await ensureRosterMeta(teacherUid, normalizedGrade, normalizedClassNo, teacherUser);

  const uniqueRows = dedupeImportRows(rows);
  const studentNos = new Set<string>();

  for (const row of uniqueRows) {
    const studentNo = normalizeStudentNo(row.studentNo);
    studentNos.add(studentNo);
    const id = buildRosterStudentId(rosterId, studentNo);
    await setDoc(teacherDocument(teacherUid, "groupRosterStudents", id), {
      rosterId,
      teacherUid,
      grade: normalizedGrade,
      classNo: normalizedClassNo,
      studentNo,
      studentName: row.studentName,
      gender: row.gender,
      achievementLevel: row.achievementLevel,
      active: row.active ?? true,
      updatedAt: serverTimestamp(),
    });
  }

  await removeStaleRosterStudentDocs(
    teacherUid,
    rosterId,
    normalizedGrade,
    normalizedClassNo,
    studentNos,
  );
  return uniqueRows.length;
}

export async function listRosterStudents(
  teacherUid: string,
  rosterId: string,
  grade?: string,
  classNo?: string,
  teacherUser?: Parameters<typeof prepareTeacherFirestoreAccess>[0],
): Promise<RosterStudent[]> {
  if (teacherUser) {
    await prepareTeacherFirestoreAccess(teacherUser);
  }
  const normalizedGrade = grade ? normalizeClassPart(grade) : "";
  const normalizedClassNo = classNo ? normalizeClassPart(classNo) : "";
  const snap = await getDocs(teacherCollection(teacherUid, "groupRosterStudents"));
  const filtered = snap.docs
    .map((d) => mapStudent(d.id, d.data()))
    .filter((s) => {
      if (s.rosterId === rosterId) return true;
      if (!normalizedGrade || !normalizedClassNo) return false;
      return belongsToRoster(s.rosterId, rosterId, s.grade, s.classNo, normalizedGrade, normalizedClassNo);
    });

  return dedupeRosterStudents(filtered, rosterId).sort((a, b) =>
    a.studentNo.localeCompare(b.studentNo, "ko", { numeric: true }),
  );
}

export async function upsertRosterStudent(
  teacherUid: string,
  grade: string,
  classNo: string,
  student: Omit<RosterStudent, "id" | "rosterId" | "teacherUid" | "grade" | "classNo"> & { id?: string },
  teacherUser?: Parameters<typeof prepareTeacherFirestoreAccess>[0],
): Promise<string> {
  const normalizedGrade = normalizeClassPart(grade);
  const normalizedClassNo = normalizeClassPart(classNo);
  const rosterId = buildRosterId(teacherUid, normalizedGrade, normalizedClassNo);
  await ensureRosterMeta(teacherUid, normalizedGrade, normalizedClassNo, teacherUser);
  const studentNo = normalizeStudentNo(student.studentNo);
  const id = student.id ?? buildRosterStudentId(rosterId, studentNo);
  await setDoc(teacherDocument(teacherUid, "groupRosterStudents", id), {
    rosterId,
    teacherUid,
    grade: normalizedGrade,
    classNo: normalizedClassNo,
    studentNo,
    studentName: student.studentName,
    gender: student.gender,
    achievementLevel: student.achievementLevel,
    active: student.active,
    updatedAt: serverTimestamp(),
  });
  await removeStaleRosterStudentDocs(
    teacherUid,
    rosterId,
    normalizedGrade,
    normalizedClassNo,
    new Set([studentNo]),
  );
  return id;
}

export async function deleteRosterStudent(teacherUid: string, studentId: string): Promise<void> {
  await deleteDoc(teacherDocument(teacherUid, "groupRosterStudents", studentId));
}

export async function updateAchievementLevel(
  teacherUid: string,
  studentId: string,
  achievementLevel: AchievementLevel,
): Promise<void> {
  await setDoc(
    teacherDocument(teacherUid, "groupRosterStudents", studentId),
    { achievementLevel, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function listSeparationRules(
  teacherUid: string,
  rosterId: string,
  grade?: string,
  classNo?: string,
  teacherUser?: Parameters<typeof prepareTeacherFirestoreAccess>[0],
): Promise<SeparationRule[]> {
  if (teacherUser) {
    await prepareTeacherFirestoreAccess(teacherUser);
  }
  const normalizedGrade = grade ? normalizeClassPart(grade) : "";
  const normalizedClassNo = classNo ? normalizeClassPart(classNo) : "";
  const snap = await getDocs(teacherCollection(teacherUid, "groupSeparations"));
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        rosterId: String(data.rosterId ?? ""),
        teacherUid: String(data.teacherUid ?? teacherUid),
        grade: normalizeClassPart(String(data.grade ?? "")),
        classNo: normalizeClassPart(String(data.classNo ?? "")),
        typeLabel: String(data.typeLabel ?? ""),
        studentIds: Array.isArray(data.studentIds) ? data.studentIds.map(String) : [],
        studentNos: Array.isArray(data.studentNos) ? data.studentNos.map(String) : [],
      };
    })
    .filter((rule) => {
      if (rule.rosterId === rosterId) return true;
      if (!normalizedGrade || !normalizedClassNo) return false;
      return belongsToRoster(rule.rosterId, rosterId, rule.grade, rule.classNo, normalizedGrade, normalizedClassNo);
    });
}

/** 분리 조건에 연결된 현재 명단 학생 ID */
export { resolveSeparationStudentIds, normalizeSeparationRulesForAssign } from "@/lib/group-activity/separation-rules";

export function resolveSeparationStudentEntries(
  rule: SeparationRule,
  students: RosterStudent[],
): RosterStudent[] {
  const byId = new Map(students.map((s) => [s.id, s]));
  return resolveSeparationStudentIds(rule, students)
    .map((id) => byId.get(id))
    .filter((s): s is RosterStudent => Boolean(s));
}

export function buildSeparationStudentStatus(
  students: RosterStudent[],
  separations: SeparationRule[],
): { student: RosterStudent; labels: string[] }[] {
  const labelMap = new Map<string, Set<string>>();
  for (const rule of separations) {
    for (const student of resolveSeparationStudentEntries(rule, students)) {
      if (!labelMap.has(student.id)) labelMap.set(student.id, new Set());
      labelMap.get(student.id)!.add(rule.typeLabel);
    }
  }
  return students
    .filter((s) => labelMap.has(s.id))
    .map((s) => ({ student: s, labels: [...labelMap.get(s.id)!].sort((a, b) => a.localeCompare(b, "ko")) }))
    .sort((a, b) => a.student.studentNo.localeCompare(b.student.studentNo, "ko", { numeric: true }));
}

export async function saveSeparationRule(
  teacherUid: string,
  rosterId: string,
  grade: string,
  classNo: string,
  typeLabel: string,
  studentIds: string[],
  studentNos: string[] = [],
  teacherUser?: Parameters<typeof prepareTeacherFirestoreAccess>[0],
  id?: string,
): Promise<string> {
  const normalizedGrade = normalizeClassPart(grade);
  const normalizedClassNo = normalizeClassPart(classNo);
  if (teacherUser) {
    await prepareTeacherFirestoreAccess(teacherUser);
  }
  await ensureRosterMeta(teacherUid, normalizedGrade, normalizedClassNo, teacherUser);

  const uniqueIds = [...new Set(studentIds)];
  if (uniqueIds.length !== 2) {
    throw new Error("분리 조건은 같은 모둠에 두지 않을 학생 2명(한 쌍)만 등록할 수 있습니다.");
  }

  const docId = id ?? doc(teacherCollection(teacherUid, "groupSeparations")).id;
  await setDoc(teacherDocument(teacherUid, "groupSeparations", docId), {
    rosterId,
    teacherUid,
    grade: normalizedGrade,
    classNo: normalizedClassNo,
    typeLabel,
    studentIds: uniqueIds,
    studentNos: studentNos.map(normalizeStudentNo).slice(0, 2),
    updatedAt: serverTimestamp(),
  });
  return docId;
}

export async function deleteSeparationRule(teacherUid: string, ruleId: string): Promise<void> {
  await deleteDoc(teacherDocument(teacherUid, "groupSeparations", ruleId));
}

function assignmentDocId(rosterId: string, year: number, month: number): string {
  return `${rosterId}__${year}_${month}`;
}

export async function getMonthlyAssignment(
  teacherUid: string,
  rosterId: string,
  year: number,
  month: number,
  teacherUser?: Parameters<typeof prepareTeacherFirestoreAccess>[0],
): Promise<MonthlyAssignment | null> {
  if (teacherUser) {
    await prepareTeacherFirestoreAccess(teacherUser);
  }
  const snap = await getDoc(
    teacherDocument(teacherUid, "groupAssignments", assignmentDocId(rosterId, year, month)),
  );
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    id: snap.id,
    rosterId: String(data.rosterId ?? ""),
    teacherUid: String(data.teacherUid ?? teacherUid),
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
  await setDoc(teacherDocument(teacherUid, "groupAssignments", assignmentDocId(rosterId, year, month)), {
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

export async function deleteMonthlyAssignment(
  teacherUid: string,
  grade: string,
  classNo: string,
  year: number,
  month: number,
): Promise<void> {
  const rosterId = buildRosterId(teacherUid, grade, classNo);
  await deleteDoc(teacherDocument(teacherUid, "groupAssignments", assignmentDocId(rosterId, year, month)));
}

export function computeGroupAssignment(
  students: RosterStudent[],
  rules: SeparationRule[],
  seed?: number,
): GroupSlot[] {
  return assignGroups(students, rules, seed);
}

export function computeGroupAssignmentWithMeta(
  students: RosterStudent[],
  rules: SeparationRule[],
  seed?: number,
) {
  return assignGroupsWithMeta(students, rules, seed);
}

export async function saveRoleScheduleAssignments(
  teacherUid: string,
  grade: string,
  classNo: string,
  groups: GroupSlot[],
  assignments: StudentRoleAssignment[],
  weekIndex?: number,
): Promise<RoleWeekSchedule> {
  const rosterId = buildRosterId(teacherUid, grade, classNo);
  const week = getWeekInfo(new Date(), ROLE_WEEK_ANCHOR);
  const idx = weekIndex ?? week.weekIndex;

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

  const scheduleId = buildClassScheduleId(grade, classNo);
  await setDoc(doc(getClientDb(), "groupRoleSchedules", scheduleId), payload);
  return {
    id: scheduleId,
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

export async function saveRoleSchedule(
  teacherUid: string,
  grade: string,
  classNo: string,
  groups: GroupSlot[],
  students: RosterStudent[],
  weekIndex?: number,
): Promise<RoleWeekSchedule> {
  const studentsById = new Map(students.map((s) => [s.id, s]));
  const week = getWeekInfo(new Date(), ROLE_WEEK_ANCHOR);
  const idx = weekIndex ?? week.weekIndex;
  const assignments = assignRolesForAllGroups(groups, studentsById, idx);
  return saveRoleScheduleAssignments(teacherUid, grade, classNo, groups, assignments, idx);
}

export async function deleteRoleSchedule(grade: string, classNo: string): Promise<void> {
  await deleteDoc(doc(getClientDb(), "groupRoleSchedules", buildClassScheduleId(grade, classNo)));
}

export async function getRoleScheduleForClass(
  grade: string,
  classNo: string,
  teacherUid?: string,
): Promise<RoleWeekSchedule | null> {
  const snap = await getDoc(doc(getClientDb(), "groupRoleSchedules", buildClassScheduleId(grade, classNo)));
  if (!snap.exists()) return null;
  const data = snap.data();
  const ownerUid = String(data.teacherUid ?? "");
  if (teacherUid && ownerUid && ownerUid !== teacherUid) return null;
  return {
    id: snap.id,
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

export async function listGroupActivityPraises(
  teacherUid: string,
  rosterId: string,
  weekIndex: number,
): Promise<GroupActivityPraise[]> {
  const snap = await getDocs(teacherCollection(teacherUid, "groupActivityPraises"));
  return snap.docs
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        rosterId: String(data.rosterId ?? ""),
        teacherUid: String(data.teacherUid ?? teacherUid),
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
    })
    .filter((praise) => praise.rosterId === rosterId && praise.weekIndex === weekIndex);
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
  const id = doc(teacherCollection(teacherUid, "groupActivityPraises")).id;
  await setDoc(teacherDocument(teacherUid, "groupActivityPraises", id), {
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
