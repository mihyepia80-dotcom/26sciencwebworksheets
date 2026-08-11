export const QB_MODEL = process.env.GEMINI_QUESTION_BOT_MODEL ?? "gemini-2.5-flash-lite";

export const QB_GEN_CONFIG = {
  temperature: 0.4,
  topP: 0.9,
  maxOutputTokens: 200,
  responseMimeType: "application/json",
} as const;

export const QB_SLOT_LIMITS = {
  observed: 60,
  change: 20,
  measure: 20,
  freeText: 120,
} as const;

export const QB_TURN_LIMIT_PER_PERIOD = Number(process.env.QUESTION_BOT_TURN_LIMIT ?? 3);
export const QB_DAILY_LIMIT_PER_STUDENT = Number(process.env.QUESTION_BOT_DAILY_LIMIT ?? 5);
export const QB_CACHE_TTL_DAYS = Number(process.env.QUESTION_BOT_CACHE_TTL_DAYS ?? 7);

export const QB_PROBE_MAX = 30;
export const QB_CANDIDATE_MAX = 40;
