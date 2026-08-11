import { QB_CANDIDATE_MAX, QB_PROBE_MAX } from "./config";
import { containsUnsafeInput } from "./unsafe-terms";
import type { QbAiPayload } from "./types";

const EXPLANATION_ENDINGS = ["때문이다", "이다", "합니다", "한다", "입니다", "돼요", "해요", "이에요"];

export function filterAiResponse(raw: unknown): QbAiPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as { probe?: unknown; candidates?: unknown };
  const probe = String(obj.probe ?? "").trim();
  const candidates = Array.isArray(obj.candidates)
    ? obj.candidates.map((c) => String(c ?? "").trim())
    : [];

  if (candidates.length !== 2) return null;
  if (probe.length > QB_PROBE_MAX) return null;
  if (candidates.some((c) => c.length > QB_CANDIDATE_MAX)) return null;
  if (!probe.endsWith("?") && !probe.endsWith("까요") && !probe.endsWith("까")) return null;
  if (candidates.some((c) => !c.endsWith("?"))) return null;

  for (const text of [probe, ...candidates]) {
    if (EXPLANATION_ENDINGS.some((e) => text.includes(e))) return null;
    if (containsUnsafeInput(text)) return null;
  }

  return { probe, candidates: [candidates[0], candidates[1]] };
}
