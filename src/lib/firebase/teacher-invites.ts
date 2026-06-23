"use client";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { getTemplateById } from "@/lib/templates/registry";
import {
  TEACHER_INVITE_MODE_LABELS,
  type TeacherInviteMode,
  type TeacherInviteRecord,
} from "@/lib/teacher-invites/types";
import { getClientDb } from "./client";

function generateInviteToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function mapInviteDoc(id: string, data: Record<string, unknown>): TeacherInviteRecord {
  const mode = data.mode;
  const validMode: TeacherInviteMode =
    mode === "worksheet" || mode === "report" || mode === "workspace" ? mode : "worksheet";

  return {
    token: id,
    teacherUid: String(data.teacherUid ?? ""),
    mode: validMode,
    templateId: String(data.templateId ?? ""),
    templateName: String(data.templateName ?? ""),
    label: String(data.label ?? TEACHER_INVITE_MODE_LABELS[validMode]),
    active: data.active !== false,
    createdAt: (data.createdAt as Timestamp | null) ?? null,
    updatedAt: (data.updatedAt as Timestamp | null) ?? null,
  };
}

function buildInvitePayload(
  teacherUid: string,
  mode: TeacherInviteMode,
  templateId: string,
  templateName: string,
) {
  const label =
    mode === "report"
      ? TEACHER_INVITE_MODE_LABELS.report
      : templateName
        ? `${TEACHER_INVITE_MODE_LABELS[mode]} · ${templateName}`
        : TEACHER_INVITE_MODE_LABELS[mode];

  return {
    teacherUid,
    mode,
    templateId: mode === "report" ? "" : templateId,
    templateName: mode === "report" ? "" : templateName,
    label,
    active: true,
    updatedAt: serverTimestamp(),
  };
}

export async function getTeacherInviteByToken(token: string): Promise<TeacherInviteRecord | null> {
  const snap = await getDoc(doc(getClientDb(), "teacherInvites", token));
  if (!snap.exists()) return null;
  const record = mapInviteDoc(snap.id, snap.data());
  if (!record.active) return null;
  return record;
}

export async function createTeacherInviteLink(
  teacherUid: string,
  mode: TeacherInviteMode,
  templateId?: string,
): Promise<string> {
  if ((mode === "worksheet" || mode === "workspace") && !templateId) {
    throw new Error("활동지 유형을 선택해 주세요.");
  }

  const tpl = templateId ? getTemplateById(templateId) : null;
  const templateName = tpl?.name ?? "";
  const db = getClientDb();

  const constraints = [
    where("teacherUid", "==", teacherUid),
    where("mode", "==", mode),
    where("active", "==", true),
  ];
  if (mode === "report") {
    constraints.push(where("templateId", "==", ""));
  } else {
    constraints.push(where("templateId", "==", templateId!));
  }

  const existing = await getDocs(query(collection(db, "teacherInvites"), ...constraints, limit(1)));
  const payload = buildInvitePayload(teacherUid, mode, templateId ?? "", templateName);

  if (!existing.empty) {
    const token = existing.docs[0].id;
    await setDoc(doc(db, "teacherInvites", token), payload, { merge: true });
    return token;
  }

  const token = generateInviteToken();
  await setDoc(doc(db, "teacherInvites", token), {
    ...payload,
    createdAt: serverTimestamp(),
  });
  return token;
}
