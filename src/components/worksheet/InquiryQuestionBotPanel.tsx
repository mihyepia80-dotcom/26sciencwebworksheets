"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { WorksheetMeta } from "@/lib/types";
import { WorksheetCallout } from "@/components/common/WorksheetUi";
import { QuestionSlotFields, slotsFromValues } from "@/components/worksheet/QuestionSlotFields";
import { fetchQuestionBotStatus, requestQuestionBot } from "@/lib/inquiry-question-bot/client";
import {
  assembleQuestion,
  computeQuality,
  evaluateChecklist,
  isStuckEligible,
  parseQuestionToSlots,
  slotsAreComplete,
} from "@/lib/inquiry-question-bot/slot-rules";
import { QB_VALUE_KEYS } from "@/lib/inquiry-question-bot/types";
import type { QbChecklist } from "@/lib/inquiry-question-bot/types";

const DEFAULT_UNIT_ID = "dissolution-solution";

interface InquiryQuestionBotPanelProps {
  templateId: string;
  meta: WorksheetMeta;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onMetaChange: (key: keyof WorksheetMeta, value: string) => void;
  readOnly?: boolean;
  studentUid?: string;
  period?: string;
  isGuest?: boolean;
}

export function InquiryQuestionBotPanel({
  templateId,
  meta,
  values,
  onChange,
  onMetaChange,
  readOnly = false,
  studentUid,
  period,
  isGuest = false,
}: InquiryQuestionBotPanelProps) {
  const slots = useMemo(() => slotsFromValues(values), [values]);
  const [draft, setDraft] = useState("");
  const [checklist, setChecklist] = useState<QbChecklist>(() => evaluateChecklist(slots));
  const [quality, setQuality] = useState<0 | 1 | 2 | 3>(() => computeQuality(evaluateChecklist(slots)));
  const [probe, setProbe] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [turnsLeft, setTurnsLeft] = useState(3);
  const [turnsLeftToday, setTurnsLeftToday] = useState(5);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(() => Boolean(meta.inquiryQuestion?.trim()));

  const activePeriod = period || meta.period || "1/8";
  const unitId = DEFAULT_UNIT_ID;

  useEffect(() => {
    const cl = evaluateChecklist(slots);
    setChecklist(cl);
    setQuality(computeQuality(cl));
    if (slotsAreComplete(slots)) {
      setDraft(assembleQuestion(slots));
    } else {
      setDraft("");
    }
  }, [slots]);

  useEffect(() => {
    if (!studentUid || isGuest) return;
    fetchQuestionBotStatus(studentUid, unitId, activePeriod).then((s) => {
      if (s?.questionBot) {
        setTurnsLeft(s.questionBot.turnsLeftThisPeriod);
        setTurnsLeftToday(s.questionBot.turnsLeftToday);
      }
    });
  }, [studentUid, isGuest, unitId, activePeriod]);

  const handleSlotChange = useCallback(
    (key: keyof typeof slots, value: string) => {
      const map = { observed: QB_VALUE_KEYS.observed, change: QB_VALUE_KEYS.change, measure: QB_VALUE_KEYS.measure };
      onChange(map[key], value);
    },
    [onChange],
  );

  const handleConfirm = useCallback(async () => {
    const question = (meta.inquiryQuestion?.trim() || draft).trim();
    if (!question) return;
    onMetaChange("inquiryQuestion", question);
    onChange(QB_VALUE_KEYS.confirmed, question);
    setConfirmed(true);
    if (studentUid && !isGuest) {
      await requestQuestionBot({
        mode: "assemble",
        action: "confirm",
        finalQuestion: question,
        templateId,
        unitId,
        period: activePeriod,
        slots,
        studentUid,
      });
    }
  }, [meta.inquiryQuestion, draft, onMetaChange, onChange, studentUid, isGuest, unitId, activePeriod, templateId, quality]);

  const handleStuck = useCallback(async () => {
    if (readOnly || isGuest || !studentUid) return;
    setLoading(true);
    setProbe(null);
    setCandidates([]);
    try {
      const res = await requestQuestionBot({
        mode: "refine",
        templateId,
        unitId,
        period: activePeriod,
        slots,
        freeText: values[QB_VALUE_KEYS.freeText] ?? "",
        studentUid,
      });
      setDraft(res.draft || assembleQuestion(slots));
      setChecklist(res.checklist);
      setQuality(res.quality);
      setTurnsLeft(res.turnsLeft);
      setTurnsLeftToday(res.turnsLeftToday);
      setProbe(res.probe);
      setCandidates(res.candidates ?? []);
      if (res.message) setProbe(res.message);
    } catch {
      setProbe("잠시 후 다시 시도해 보세요. 슬롯을 채워 직접 질문을 만들 수도 있어요.");
    } finally {
      setLoading(false);
    }
  }, [readOnly, isGuest, studentUid, templateId, unitId, activePeriod, slots, values]);

  const pickCandidate = (text: string) => {
    const parsed = parseQuestionToSlots(text);
    if (parsed.change) onChange(QB_VALUE_KEYS.change, parsed.change);
    if (parsed.measure) onChange(QB_VALUE_KEYS.measure, parsed.measure);
    onMetaChange("inquiryQuestion", text);
    onChange(QB_VALUE_KEYS.confirmed, text);
    setDraft(text);
    setConfirmed(false);
  };

  const stuckEligible = isStuckEligible(slots, checklist);
  const displayDraft = meta.inquiryQuestion?.trim() || draft;

  return (
    <section className="inquiry-question-bot ui-card overflow-hidden print:border-slate-300">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-violet-100 bg-gradient-to-r from-violet-50 to-indigo-50 px-5 py-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">탐구 질문 만들기</h2>
          <p className="text-xs text-slate-600">관찰 → 바꿀 것 → 볼 것 순으로 적으면 질문이 만들어져요.</p>
        </div>
        {!isGuest && studentUid && (
          <p className="no-print text-xs font-medium text-violet-700">
            남은 도움 {turnsLeft}회 · 오늘 {turnsLeftToday}회
          </p>
        )}
      </div>

      <div className="space-y-5 p-5">
        <QuestionSlotFields slots={slots} onChange={handleSlotChange} readOnly={readOnly} />

        {displayDraft && (
          <WorksheetCallout variant="inquiry" title="내 탐구 질문 (자동 조립)">
            <p className="text-base font-medium text-slate-900">&ldquo;{displayDraft}&rdquo;</p>
            {!readOnly && (
              <button
                type="button"
                className="no-print ui-btn-primary ui-btn-sm mt-3"
                onClick={handleConfirm}
              >
                이 질문으로
              </button>
            )}
            {confirmed && (
              <p className="mt-2 text-xs text-emerald-700">✓ 탐구 질문이 확정되었습니다.</p>
            )}
          </WorksheetCallout>
        )}

        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm">
          <p className="mb-2 font-semibold text-slate-800">질문 점검</p>
          <ul className="space-y-1 text-slate-700">
            <li>{checklist.hasVariable ? "☑" : "☐"} 바꿀 조건과 볼 것이 있다</li>
            <li>{checklist.isTestable ? "☑" : "☐"} 교실에서 확인할 수 있다</li>
            <li>{checklist.isMeasurable ? "☑" : "☐"} 볼 것을 측정·관찰할 수 있다</li>
          </ul>
          <p className="mt-2 text-xs text-slate-500">질 점수: {quality}/3</p>
        </div>

        {probe && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
            {probe}
          </p>
        )}

        {candidates.length > 0 && (
          <div className="no-print space-y-2">
            <p className="text-sm font-semibold text-slate-700">탐구 질문 후보</p>
            {candidates.map((c) => (
              <button
                key={c}
                type="button"
                className="ui-chip w-full border border-violet-200 bg-white text-left text-sm hover:bg-violet-50"
                aria-label={`후보 질문: ${c}`}
                onClick={() => pickCandidate(c)}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {!readOnly && (
          <div className="no-print flex flex-wrap gap-3">
            <button
              type="button"
              className="ui-btn-secondary ui-btn-sm"
              disabled={!stuckEligible || loading || isGuest || !studentUid || turnsLeft <= 0}
              onClick={handleStuck}
            >
              {loading ? "도움 요청 중…" : "막혔어요, 도움받기"}
            </button>
            {isGuest && (
              <p className="text-xs text-slate-500">체험 모드에서는 규칙 조립만 사용할 수 있어요.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
