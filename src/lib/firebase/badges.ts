"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { getClientDb } from "./client";
import {
  DEFAULT_BADGE_DEFINITIONS,
  type BadgeDefinition,
  type BadgeIconKey,
  type StudentBadgeAward,
} from "@/lib/badges/types";

function mapBadgeDefinition(id: string, data: Record<string, unknown>): BadgeDefinition {
  const iconKey = data.iconKey as BadgeIconKey;
  const validKeys: BadgeIconKey[] = [
    "shirt-green",
    "shirt-blue",
    "shirt-purple",
    "shirt-amber",
    "shirt-rose",
  ];
  return {
    id,
    label: String(data.label ?? ""),
    iconKey: validKeys.includes(iconKey) ? iconKey : "shirt-green",
    active: data.active !== false,
    order: Number(data.order ?? 99),
    teacherUid: data.teacherUid ? String(data.teacherUid) : undefined,
    isDefault: data.isDefault === true,
  };
}

function mapStudentBadge(id: string, data: Record<string, unknown>): StudentBadgeAward {
  const iconKey = data.iconKey as BadgeIconKey;
  return {
    id,
    studentUid: String(data.studentUid ?? ""),
    studentName: String(data.studentName ?? ""),
    grade: String(data.grade ?? ""),
    classNo: String(data.classNo ?? ""),
    studentNo: String(data.studentNo ?? ""),
    badgeId: String(data.badgeId ?? ""),
    badgeLabel: String(data.badgeLabel ?? ""),
    iconKey:
      iconKey === "shirt-blue" ||
      iconKey === "shirt-purple" ||
      iconKey === "shirt-amber" ||
      iconKey === "shirt-rose"
        ? iconKey
        : "shirt-green",
    awardedBy: String(data.awardedBy ?? ""),
    awardedAt: (data.awardedAt as Timestamp | null)?.toDate?.() ?? null,
    note: data.note ? String(data.note) : undefined,
  };
}

export async function listBadgeDefinitions(): Promise<BadgeDefinition[]> {
  const snap = await getDocs(
    query(collection(getClientDb(), "badgeDefinitions"), orderBy("order", "asc")),
  );
  const fromDb = snap.docs.map((d) => mapBadgeDefinition(d.id, d.data()));

  if (fromDb.length === 0) {
    return [...DEFAULT_BADGE_DEFINITIONS];
  }

  const merged = new Map<string, BadgeDefinition>();
  for (const def of DEFAULT_BADGE_DEFINITIONS) {
    if (def.id) merged.set(def.id, def);
  }
  for (const def of fromDb) {
    merged.set(def.id ?? def.label, def);
  }
  return [...merged.values()]
    .filter((d) => d.active)
    .sort((a, b) => a.order - b.order);
}

export async function listAllBadgeDefinitionsForTeacher(): Promise<BadgeDefinition[]> {
  const snap = await getDocs(
    query(collection(getClientDb(), "badgeDefinitions"), orderBy("order", "asc")),
  );
  if (snap.empty) return [...DEFAULT_BADGE_DEFINITIONS];
  return snap.docs.map((d) => mapBadgeDefinition(d.id, d.data())).sort((a, b) => a.order - b.order);
}

export async function seedDefaultBadgeDefinitions(teacherUid: string): Promise<void> {
  for (const def of DEFAULT_BADGE_DEFINITIONS) {
    if (!def.id) continue;
    await setDoc(
      doc(getClientDb(), "badgeDefinitions", def.id),
      {
        label: def.label,
        iconKey: def.iconKey,
        active: true,
        order: def.order,
        isDefault: true,
        teacherUid,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }
}

export async function saveBadgeDefinition(
  input: Omit<BadgeDefinition, "id"> & { id?: string },
  teacherUid: string,
): Promise<string> {
  const payload = {
    label: input.label.trim(),
    iconKey: input.iconKey,
    active: input.active,
    order: input.order,
    teacherUid,
    isDefault: input.isDefault ?? false,
    updatedAt: serverTimestamp(),
  };

  if (input.id) {
    await setDoc(doc(getClientDb(), "badgeDefinitions", input.id), payload, { merge: true });
    return input.id;
  }

  const ref = await addDoc(collection(getClientDb(), "badgeDefinitions"), payload);
  return ref.id;
}

export async function deleteBadgeDefinition(badgeId: string): Promise<void> {
  await deleteDoc(doc(getClientDb(), "badgeDefinitions", badgeId));
}

export interface AwardBadgeInput {
  studentUid: string;
  studentName: string;
  grade: string;
  classNo: string;
  studentNo: string;
  badgeId: string;
  badgeLabel: string;
  iconKey: BadgeIconKey;
  awardedBy: string;
  note?: string;
}

export async function awardStudentBadge(input: AwardBadgeInput): Promise<string> {
  const ref = await addDoc(collection(getClientDb(), "studentBadges"), {
    ...input,
    awardedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function listStudentBadges(studentUid: string): Promise<StudentBadgeAward[]> {
  const snap = await getDocs(
    query(
      collection(getClientDb(), "studentBadges"),
      where("studentUid", "==", studentUid),
      orderBy("awardedAt", "desc"),
    ),
  );
  return snap.docs.map((d) => mapStudentBadge(d.id, d.data()));
}

export async function listAllStudentBadges(max = 200): Promise<StudentBadgeAward[]> {
  const snap = await getDocs(
    query(collection(getClientDb(), "studentBadges"), orderBy("awardedAt", "desc")),
  );
  return snap.docs.slice(0, max).map((d) => mapStudentBadge(d.id, d.data()));
}

export async function revokeStudentBadge(awardId: string): Promise<void> {
  await deleteDoc(doc(getClientDb(), "studentBadges", awardId));
}
