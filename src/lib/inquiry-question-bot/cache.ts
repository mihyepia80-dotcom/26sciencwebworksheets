import { createHash } from "crypto";
import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin";
import { QB_CACHE_TTL_DAYS } from "./config";
import { normalizeSlotText, sanitizeFreeText, sanitizeSlots } from "./sanitize";
import type { QbAiPayload, QbRequest } from "./types";

const CACHE_COLLECTION = "questionBotCache";

export function normalizeSlotsForCache(r: QbRequest): string {
  const slots = sanitizeSlots(r.slots);
  const free = sanitizeFreeText(r.freeText);
  return [
    r.unitId,
    r.period,
    normalizeSlotText(slots.observed),
    normalizeSlotText(slots.change),
    normalizeSlotText(slots.measure),
    normalizeSlotText(free),
  ].join("|");
}

export function hashCacheKey(normalized: string): string {
  return createHash("sha256").update(normalized).digest("hex");
}

export async function getQuestionBotCache(hash: string): Promise<QbAiPayload | null> {
  if (!isAdminConfigured()) return null;
  const db = await getAdminDb();
  const snap = await db.collection(CACHE_COLLECTION).doc(hash).get();
  if (!snap.exists) return null;
  const data = snap.data();
  const expiresAt = data?.expiresAt?.toDate?.() as Date | undefined;
  if (expiresAt && expiresAt.getTime() < Date.now()) return null;
  const payload = data?.payload as QbAiPayload | undefined;
  if (!payload?.probe || !Array.isArray(payload.candidates) || payload.candidates.length !== 2) {
    return null;
  }
  return payload;
}

export async function setQuestionBotCache(hash: string, payload: QbAiPayload): Promise<void> {
  if (!isAdminConfigured()) return;
  const db = await getAdminDb();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + QB_CACHE_TTL_DAYS);
  await db.collection(CACHE_COLLECTION).doc(hash).set({
    payload,
    expiresAt,
    updatedAt: new Date(),
  });
}
