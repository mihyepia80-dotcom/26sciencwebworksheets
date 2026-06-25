"use client";

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from "firebase/firestore";
import { getTemplateById } from "@/lib/templates/registry";
import {
  TEACHER_INVITE_MODE_LABELS,
  type TeacherInviteMode,
  type TeacherInviteRecord,
} from "@/lib/teacher-invites/types";
import { getClientDb } from "./client";

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

function buildInviteDocId(teacherUid: string, mode: TeacherInviteMode, templateId: string): string {
  const key = mode === "report" ? "report" : templateId || "none";
  return `tinv_${teacherUid}_${mode}_${key}`.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 400);
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
  const docId = buildInviteDocId(teacherUid, mode, templateId ?? "");
  const payload = buildInvitePayload(teacherUid, mode, templateId ?? "", templateName);

  const ref = doc(db, "teacherInvites", docId);
  const existing = await getDoc(ref);

  await setDoc(
    ref,
    {
      ...payload,
      ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  );

  return docId;
}
