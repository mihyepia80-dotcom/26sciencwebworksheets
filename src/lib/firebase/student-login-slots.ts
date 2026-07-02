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
} from "firebase/firestore";
import { normalizeClassPart, normalizeStudentNo } from "@/lib/group-activity/constants";
import { getClientDb } from "./client";

export interface StudentLoginSlot {
  teacherUid: string;
  grade: string;
  classNo: string;
  studentNo: string;
  studentName: string;
}

export function buildStudentLoginSlotId(grade: string, classNo: string, studentNo: string): string {
  return `${normalizeClassPart(grade)}__${normalizeClassPart(classNo)}__${normalizeStudentNo(studentNo)}`.replace(
    /[^a-zA-Z0-9_-]/g,
    "_",
  );
}

export async function upsertStudentLoginSlot(slot: StudentLoginSlot): Promise<void> {
  const slotId = buildStudentLoginSlotId(slot.grade, slot.classNo, slot.studentNo);
  const slotRef = doc(getClientDb(), "studentLoginSlots", slotId);
  const existing = await getDoc(slotRef);

  if (existing.exists()) {
    const owner = String(existing.data().teacherUid ?? "");
    if (owner && owner !== slot.teacherUid) {
      throw new Error("같은 학년·반·번호가 다른 교사 명단에 이미 등록되어 있습니다.");
    }
  }

  await setDoc(slotRef, {
    teacherUid: slot.teacherUid,
    grade: normalizeClassPart(slot.grade),
    classNo: normalizeClassPart(slot.classNo),
    studentNo: normalizeStudentNo(slot.studentNo),
    studentName: slot.studentName.trim(),
    updatedAt: serverTimestamp(),
  });
}

export async function removeStudentLoginSlot(grade: string, classNo: string, studentNo: string): Promise<void> {
  await deleteDoc(doc(getClientDb(), "studentLoginSlots", buildStudentLoginSlotId(grade, classNo, studentNo)));
}

export async function syncTeacherStudentLoginSlots(
  teacherUid: string,
  students: Array<{ grade: string; classNo: string; studentNo: string; studentName: string }>,
): Promise<void> {
  const snap = await getDocs(
    query(collection(getClientDb(), "studentLoginSlots"), where("teacherUid", "==", teacherUid)),
  );
  const nextIds = new Set(students.map((s) => buildStudentLoginSlotId(s.grade, s.classNo, s.studentNo)));

  for (const docSnap of snap.docs) {
    if (!nextIds.has(docSnap.id)) {
      await deleteDoc(docSnap.ref);
    }
  }

  for (const student of students) {
    await upsertStudentLoginSlot({ teacherUid, ...student });
  }
}
