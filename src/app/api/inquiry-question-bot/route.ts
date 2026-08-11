import { NextResponse } from "next/server";
import { callGeminiJson } from "@/lib/ai/gemini";
import {
  getQuestionBotCache,
  hashCacheKey,
  normalizeSlotsForCache,
  setQuestionBotCache,
} from "@/lib/inquiry-question-bot/cache";
import { QB_GEN_CONFIG, QB_MODEL } from "@/lib/inquiry-question-bot/config";
import { filterAiResponse } from "@/lib/inquiry-question-bot/post-filter";
import { buildQbPrompt } from "@/lib/inquiry-question-bot/prompt";
import { consumeQuestionBotQuota, getQuestionBotQuotaStatus } from "@/lib/inquiry-question-bot/quota";
import { QB_RESPONSE_SCHEMA } from "@/lib/inquiry-question-bot/schema";
import { sanitizeFreeText, sanitizeSlots } from "@/lib/inquiry-question-bot/sanitize";
import { appendQuestionBotTurn, confirmQuestionBotSession } from "@/lib/inquiry-question-bot/session";
import {
  assembleQuestion,
  buildRuleProbe,
  computeQuality,
  evaluateChecklist,
} from "@/lib/inquiry-question-bot/slot-rules";
import type { QbAiPayload, QbRequest, QbResponse } from "@/lib/inquiry-question-bot/types";
import { getQuestionBotTeacherConfig, getStudentTeacherUid, resolveUnitHint } from "@/lib/inquiry-question-bot/teacher-config";
import { containsUnsafeInput, getBlockedMessage } from "@/lib/inquiry-question-bot/unsafe-terms";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_UNIT_ID = "dissolution-solution";

function buildOkResponse(
  partial: Omit<QbResponse, "status"> & { status?: QbResponse["status"] },
): QbResponse {
  return { status: "ok", ...partial } as QbResponse;
}

export async function POST(request: Request) {
  let body: QbRequest;
  try {
    body = (await request.json()) as QbRequest;
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  if (!body.studentUid?.trim()) {
    return NextResponse.json({ error: "로그인이 필요합니다.", status: "error" }, { status: 401 });
  }

  const req = body as QbRequest & { action?: string; finalQuestion?: string };
  if (req.action === "confirm" && req.finalQuestion) {
    const unitId = req.unitId?.trim() || DEFAULT_UNIT_ID;
    const period = String(req.period ?? "1/8");
    const templateId = req.templateId?.trim() || "see-think-wonder";
    const slots = sanitizeSlots(req.slots ?? { observed: "", change: "", measure: "" });
    const checklist = evaluateChecklist(slots);
    const quality = computeQuality(checklist);
    await confirmQuestionBotSession(
      req.studentUid,
      unitId,
      period,
      templateId,
      req.finalQuestion.trim(),
      quality,
    );
    return NextResponse.json({ status: "ok", draft: req.finalQuestion, probe: null, candidates: [], checklist, quality, turnsLeft: 0, turnsLeftToday: 0, source: "rule" });
  }

  const slots = sanitizeSlots(body.slots ?? { observed: "", change: "", measure: "" });
  const freeText = sanitizeFreeText(body.freeText);
  const unitId = body.unitId?.trim() || DEFAULT_UNIT_ID;
  const period = String(body.period ?? "1/8");
  const templateId = body.templateId?.trim() || "see-think-wonder";

  const combinedInput = [slots.observed, slots.change, slots.measure, freeText].join(" ");
  if (containsUnsafeInput(combinedInput)) {
    return NextResponse.json({
      status: "blocked",
      draft: "",
      probe: null,
      candidates: [],
      checklist: evaluateChecklist(slots),
      quality: 0,
      turnsLeft: 0,
      turnsLeftToday: 0,
      source: "rule",
      message: getBlockedMessage(),
    } satisfies QbResponse);
  }

  const checklist = evaluateChecklist(slots);
  const quality = computeQuality(checklist);
  const draft = assembleQuestion(slots);
  const quotaStatus = await getQuestionBotQuotaStatus(body.studentUid, unitId, period);
  const teacherUid = await getStudentTeacherUid(body.studentUid);
  const teacherConfig = await getQuestionBotTeacherConfig(teacherUid);
  const unitHint = resolveUnitHint(teacherConfig, unitId);

  if (body.mode === "assemble") {
    return NextResponse.json(
      buildOkResponse({
        draft,
        probe: null,
        candidates: [],
        checklist,
        quality,
        turnsLeft: quotaStatus.turnsLeftThisPeriod,
        turnsLeftToday: quotaStatus.turnsLeftToday,
        source: "rule",
      }),
    );
  }

  // refine mode
  if (!teacherConfig.enabled) {
    return NextResponse.json({
      status: "quota_exceeded",
      draft,
      probe: buildRuleProbe(slots, checklist),
      candidates: [],
      checklist,
      quality,
      turnsLeft: 0,
      turnsLeftToday: quotaStatus.turnsLeftToday,
      source: "rule",
      message: "교사가 AI 도움받기를 꺼 두었어요. 슬롯을 채워 질문을 직접 만들어 보세요.",
    } satisfies QbResponse);
  }

  // cache first
  const cacheKey = hashCacheKey(normalizeSlotsForCache({ ...body, slots, freeText, unitId, period }));
  const cached = await getQuestionBotCache(cacheKey);
  if (cached) {
    return NextResponse.json(
      buildOkResponse({
        draft,
        probe: cached.probe,
        candidates: cached.candidates,
        checklist,
        quality,
        turnsLeft: quotaStatus.turnsLeftThisPeriod,
        turnsLeftToday: quotaStatus.turnsLeftToday,
        source: "cache",
      }),
    );
  }

  if (!quotaStatus.enabled) {
    const probe = buildRuleProbe(slots, checklist);
    return NextResponse.json({
      status: "quota_exceeded",
      draft,
      probe,
      candidates: [],
      checklist,
      quality,
      turnsLeft: quotaStatus.turnsLeftThisPeriod,
      turnsLeftToday: quotaStatus.turnsLeftToday,
      source: "rule",
      message: "오늘 도움받기 횟수를 모두 사용했어요. 슬롯을 채워 질문을 직접 만들어 보세요.",
    } satisfies QbResponse);
  }

  let aiPayload: QbAiPayload | null = null;
  let usage: { promptTokens: number; outputTokens: number } | undefined;

  if (process.env.GEMINI_API_KEY) {
    try {
      const prompt = buildQbPrompt({ ...body, slots, freeText, unitId, period }, unitHint);
      const { data, usage: u } = await callGeminiJson<unknown>(prompt, {
        model: QB_MODEL,
        temperature: QB_GEN_CONFIG.temperature,
        maxOutputTokens: QB_GEN_CONFIG.maxOutputTokens,
        responseMimeType: QB_GEN_CONFIG.responseMimeType,
        responseSchema: QB_RESPONSE_SCHEMA,
      });
      aiPayload = filterAiResponse(data);
      usage = u;
    } catch {
      aiPayload = null;
    }
  }

  const probe = aiPayload?.probe ?? buildRuleProbe(slots, checklist);
  const candidates = aiPayload?.candidates ?? [];
  const source = aiPayload ? "ai" : "rule";

  if (aiPayload) {
    await setQuestionBotCache(cacheKey, aiPayload);
    await consumeQuestionBotQuota(body.studentUid, unitId, period);
  }

  const afterQuota = aiPayload
    ? await getQuestionBotQuotaStatus(body.studentUid, unitId, period)
    : quotaStatus;

  await appendQuestionBotTurn(
    body.studentUid,
    {
      grade: "",
      classNo: "",
      studentNo: "",
      unitId,
      period,
      templateId,
    },
    {
      at: new Date(),
      slots,
      source,
      probe,
      candidates,
      picked: null,
      usage,
    },
    draft,
  );

  return NextResponse.json(
    buildOkResponse({
      draft,
      probe,
      candidates,
      checklist,
      quality,
      turnsLeft: afterQuota.turnsLeftThisPeriod,
      turnsLeftToday: afterQuota.turnsLeftToday,
      source,
      usage,
    }),
  );
}
