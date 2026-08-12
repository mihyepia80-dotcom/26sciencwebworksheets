import { NextResponse } from "next/server";
import {
  TEACHER_GEMINI_SETUP_MESSAGE,
  TEACHER_PADLET_SETUP_MESSAGE,
} from "@/lib/teacher/api-config-messages";
import {
  resolveGeminiApiKeyForTeacher,
  resolvePadletApiKeyForTeacher,
} from "@/lib/teacher/api-config";

export function geminiKeyMissingResponse(message = TEACHER_GEMINI_SETUP_MESSAGE): NextResponse {
  return NextResponse.json({ error: message, code: "teacher_gemini_key_required" }, { status: 503 });
}

export function padletKeyMissingResponse(message = TEACHER_PADLET_SETUP_MESSAGE): NextResponse {
  return NextResponse.json({ error: message, code: "teacher_padlet_key_required" }, { status: 503 });
}

export async function requireTeacherGeminiKey(teacherUid: string, email?: string | null) {
  const resolved = await resolveGeminiApiKeyForTeacher(teacherUid, email);
  if (!resolved) return { error: geminiKeyMissingResponse() as NextResponse };
  return { apiKey: resolved.key, source: resolved.source };
}

export async function requireTeacherPadletKey(teacherUid: string, email?: string | null) {
  const resolved = await resolvePadletApiKeyForTeacher(teacherUid, email);
  if (!resolved) return { error: padletKeyMissingResponse() as NextResponse };
  return { apiKey: resolved.key, source: resolved.source };
}
