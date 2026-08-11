import { CLOSING_HEADLINE_KEY } from "@/lib/worksheet-closing/constants";
import type { ComposedPost } from "@/lib/padlet/publish-types";
import type { PadletPostColor } from "@/lib/padlet/types";
import { PADLET_PASTEL_POST_COLORS } from "@/lib/padlet/presets";

const BODY_MAX = 600;
const FIELD_SNIPPET_MAX = 120;

export function periodPastelColor(period: number): PadletPostColor {
  return PADLET_PASTEL_POST_COLORS[(Math.max(1, period) - 1) % PADLET_PASTEL_POST_COLORS.length] as PadletPostColor;
}

/** 브라우저·서버 공용 간단 해시 (bodyHash 판정용) */
export function computeBodyHash(subject: string, body: string): string {
  const input = `${subject}\n${body}`;
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function clip(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function pickSummaryFields(
  values: Record<string, string>,
  padletFields: string[],
): string[] {
  const lines: string[] = [];
  for (const key of padletFields) {
    const val = values[key]?.trim();
    if (!val) continue;
    lines.push(clip(val, FIELD_SNIPPET_MAX));
    if (lines.length >= 3) break;
  }
  return lines;
}

export function composePost(
  submission: {
    templateId: string;
    templateName: string;
    meta: { period?: string };
    values: Record<string, string>;
  },
  period: number,
  studentNo: number,
  shareUrl: string | null,
  padletFields: string[],
): ComposedPost {
  const headline =
    submission.values[CLOSING_HEADLINE_KEY]?.trim() ||
    submission.values.conclusion?.trim() ||
    "";

  const summaryLines = pickSummaryFields(submission.values, padletFields);
  const subject = `${period}차시 · ${studentNo}번 · ${submission.templateName}`;

  const parts: string[] = [];
  if (headline) parts.push(`[한 줄 결론]\n${clip(headline, 200)}`);
  if (summaryLines.length > 0) {
    parts.push(`[주요 내용]\n${summaryLines.join("\n")}`);
  }
  if (shareUrl) {
    parts.push(`[더 보기]\n${shareUrl}`);
  }

  let body = parts.join("\n\n").trim();
  if (body.length > BODY_MAX) {
    body = `${body.slice(0, BODY_MAX - 30).trim()}…\n\n전문은 공유 링크에서 볼 수 있어요.`;
    if (shareUrl && !body.includes(shareUrl)) {
      body += `\n${shareUrl}`;
    }
  }

  const color = periodPastelColor(period);
  return { subject, body, color, bodyHash: computeBodyHash(subject, body) };
}

export function parsePeriodFromMeta(periodStr?: string, fallback = 1): number {
  if (!periodStr?.trim()) return fallback;
  const m = periodStr.trim().match(/^(\d+)/);
  if (!m) return fallback;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
