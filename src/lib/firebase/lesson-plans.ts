"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import type { LessonPlanForm, LessonProcessRow } from "@/lib/lesson-plan/types";
import { EMPTY_INQUIRY_STAGES, EMPTY_PROCESS_ROW } from "@/lib/lesson-plan/types";
import { getClientDb } from "./client";

export interface LessonPlanDoc extends LessonPlanForm {
  id?: string;
  teacherUid: string;
  updatedAt: Timestamp | null;
  createdAt: Timestamp | null;
}

function mapStages(data: Record<string, unknown>) {
  const raw = data.inquiryStages as Record<string, unknown> | undefined;
  return {
    questioning: Boolean(raw?.questioning),
    inquiring: raw?.inquiring !== false,
    generalizing: Boolean(raw?.generalizing),
    transferring: Boolean(raw?.transferring),
    reflecting: Boolean(raw?.reflecting),
  };
}

function mapProcessRows(data: Record<string, unknown>): LessonProcessRow[] {
  if (!Array.isArray(data.processRows)) return [{ ...EMPTY_PROCESS_ROW }];
  return data.processRows.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      stage: String(r.stage ?? ""),
      time: String(r.time ?? ""),
      content: String(r.content ?? ""),
      activities: String(r.activities ?? ""),
      materials: String(r.materials ?? ""),
    };
  });
}

function mapDoc(id: string, data: Record<string, unknown>): LessonPlanDoc {
  return {
    id,
    teacherUid: String(data.teacherUid ?? ""),
    planTitle: String(data.planTitle ?? ""),
    unit: String(data.unit ?? ""),
    period: String(data.period ?? ""),
    teachingModel: String(data.teachingModel ?? ""),
    coreIdea: String(data.coreIdea ?? ""),
    inquiryStages: mapStages(data),
    learningTopic: String(data.learningTopic ?? ""),
    achievementStandards: String(data.achievementStandards ?? ""),
    learningObjectives: String(data.learningObjectives ?? ""),
    inquiryKnowledge: String(data.inquiryKnowledge ?? ""),
    inquiryProcess: String(data.inquiryProcess ?? ""),
    inquiryValues: String(data.inquiryValues ?? ""),
    inquiryQuestions: String(data.inquiryQuestions ?? ""),
    activities: String(data.activities ?? ""),
    writingTask: String(data.writingTask ?? ""),
    thinkingTechnique: String(data.thinkingTechnique ?? ""),
    thinkingStep1: String(data.thinkingStep1 ?? ""),
    thinkingStep2: String(data.thinkingStep2 ?? ""),
    thinkingStep3: String(data.thinkingStep3 ?? ""),
    reflection: String(data.reflection ?? ""),
    evaluationKnowledge: String(data.evaluationKnowledge ?? ""),
    evaluationProcess: String(data.evaluationProcess ?? ""),
    evaluationValues: String(data.evaluationValues ?? ""),
    thinkingTool: String(data.thinkingTool ?? ""),
    reflectionThinkingTool: String(data.reflectionThinkingTool ?? ""),
    templateSource: String(data.templateSource ?? ""),
    writingContext: String(data.writingContext ?? ""),
    aiWebApp: String(data.aiWebApp ?? ""),
    usageTips: String(data.usageTips ?? ""),
    processRows: mapProcessRows(data),
    createdAt: (data.createdAt as Timestamp | null) ?? null,
    updatedAt: (data.updatedAt as Timestamp | null) ?? null,
  };
}

function toPayload(form: LessonPlanForm, teacherUid: string) {
  return {
    ...form,
    inquiryStages: form.inquiryStages ?? EMPTY_INQUIRY_STAGES,
    processRows: form.processRows.length ? form.processRows : [{ ...EMPTY_PROCESS_ROW }],
    teacherUid,
    updatedAt: serverTimestamp(),
  };
}

export async function createLessonPlan(form: LessonPlanForm, teacherUid: string): Promise<string> {
  const ref = await addDoc(collection(getClientDb(), "lessonPlans"), {
    ...toPayload(form, teacherUid),
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateLessonPlan(planId: string, form: LessonPlanForm, teacherUid: string): Promise<void> {
  await updateDoc(doc(getClientDb(), "lessonPlans", planId), toPayload(form, teacherUid));
}

export async function getLessonPlan(planId: string): Promise<LessonPlanDoc | null> {
  const snap = await getDoc(doc(getClientDb(), "lessonPlans", planId));
  if (!snap.exists()) return null;
  return mapDoc(snap.id, snap.data());
}

export async function listTeacherLessonPlans(teacherUid: string, max = 50): Promise<LessonPlanDoc[]> {
  const snap = await getDocs(
    query(
      collection(getClientDb(), "lessonPlans"),
      where("teacherUid", "==", teacherUid),
      orderBy("updatedAt", "desc"),
      limit(max),
    ),
  );
  return snap.docs.map((d) => mapDoc(d.id, d.data()));
}

export async function deleteLessonPlan(planId: string): Promise<void> {
  await deleteDoc(doc(getClientDb(), "lessonPlans", planId));
}
