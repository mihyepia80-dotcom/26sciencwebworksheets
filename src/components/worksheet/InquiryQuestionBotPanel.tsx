"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { WorksheetMeta } from "@/lib/types";
import {
  getActiveChatStep,
  QB_CHAT_STEPS,
  QB_VALUE_KEYS,
  slotsFromValues,
  type QbChatStepKey,
} from "@/components/worksheet/QuestionSlotFields";
import {
  buildComposerPlaceholder,
  buildConversationalChatLines,
  getActiveStructuredQuestion,
} from "@/lib/inquiry-question-bot/chat-flow";
import { fetchQuestionBotStatus, requestQuestionBot } from "@/lib/inquiry-question-bot/client";
import {
  assembleQuestion,
  buildRuleCandidates,
  computeQuality,
  evaluateChecklist,
  isStuckEligible,
  slotsAreComplete,
} from "@/lib/inquiry-question-bot/slot-rules";
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
  onConfirmedChange?: (confirmed: boolean) => void;
}

function stepConfig(step: QbChatStepKey) {
  if (step === "review" || step === "done") return null;
  return QB_CHAT_STEPS.find((s) => s.key === step) ?? null;
}

function BotAvatar() {
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white shadow-sm"
      aria-hidden
    >
      톡
    </div>
  );
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
  onConfirmedChange,
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
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const activePeriod = period || meta.period || "1/8";
  const unitId = DEFAULT_UNIT_ID;
  const activeStep = getActiveChatStep(slots, confirmed);
  const currentField = stepConfig(activeStep);

  useEffect(() => {
    const cl = evaluateChecklist(slots);
    setChecklist(cl);
    setQuality(computeQuality(cl));
    const nextDraft = slotsAreComplete(slots) ? assembleQuestion(slots) : "";
    setDraft(nextDraft);
    if (slotsAreComplete(slots) && !confirmed) {
      const rules = buildRuleCandidates(slots);
      if (rules.length === 2) {
        setCandidates((prev) => (prev[0] === rules[0] && prev[1] === rules[1] ? prev : [...rules]));
      }
    }
  }, [slots, confirmed]);

  useEffect(() => {
    onConfirmedChange?.(confirmed);
  }, [confirmed, onConfirmedChange]);

  useEffect(() => {
    if (meta.inquiryQuestion?.trim()) setConfirmed(true);
  }, [meta.inquiryQuestion]);

  useEffect(() => {
    if (!studentUid || isGuest) return;
    fetchQuestionBotStatus(studentUid, unitId, activePeriod).then((s) => {
      if (s?.questionBot) {
        setTurnsLeft(s.questionBot.turnsLeftThisPeriod);
        setTurnsLeftToday(s.questionBot.turnsLeftToday);
      }
    });
  }, [studentUid, isGuest, unitId, activePeriod]);

  const chatLines = useMemo(
    () =>
      buildConversationalChatLines({
        slots,
        confirmed,
        inquiryQuestion: meta.inquiryQuestion,
        probe,
      }),
    [slots, confirmed, meta.inquiryQuestion, probe],
  );

  const composerPlaceholder = useMemo(() => {
    if (!currentField) return "답변을 입력하세요";
    return buildComposerPlaceholder(currentField.key, slots);
  }, [currentField, slots]);

  const activeStructuredQuestion = useMemo(() => {
    if (!currentField) return null;
    return getActiveStructuredQuestion(currentField.key, slots);
  }, [currentField, slots]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chatLines.length, candidates.length, loading]);

  const handleSlotChange = useCallback(
    (key: "observed" | "change" | "measure", value: string) => {
      const map = { observed: QB_VALUE_KEYS.observed, change: QB_VALUE_KEYS.change, measure: QB_VALUE_KEYS.measure };
      onChange(map[key], value);
    },
    [onChange],
  );

  const sendCurrentStep = useCallback(() => {
    if (readOnly || !currentField) return;
    const text = input.trim();
    if (!text) return;
    handleSlotChange(currentField.key, text.slice(0, currentField.limit));
    setInput("");
    setProbe(null);
    setCandidates([]);
  }, [readOnly, currentField, input, handleSlotChange]);

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
  }, [meta.inquiryQuestion, draft, onMetaChange, onChange, studentUid, isGuest, unitId, activePeriod, templateId, slots]);

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
        freeText: values[QB_VALUE_KEYS.freeText] ?? input.trim(),
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
      setProbe("잠시 후 다시 시도해 보세요. 위 질문에 차례대로 답해 보면 질문을 만들 수 있어요.");
    } finally {
      setLoading(false);
    }
  }, [readOnly, isGuest, studentUid, templateId, unitId, activePeriod, slots, values, input]);

  const pickCandidate = (text: string) => {
    onMetaChange("inquiryQuestion", text);
    onChange(QB_VALUE_KEYS.confirmed, text);
    setDraft(text);
    setConfirmed(true);
    setInput("");
  };

  const stuckEligible = isStuckEligible(slots, checklist);
  const displayDraft = meta.inquiryQuestion?.trim() || draft;
  const showComposer = !readOnly && !confirmed && currentField;

  return (
    <section className="inquiry-question-bot ui-card flex flex-col overflow-hidden print:border-slate-300">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-violet-100 bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-white">
        <div className="flex items-center gap-3">
          <BotAvatar />
          <div>
            <h2 className="text-base font-bold">탐구질문 톡톡</h2>
            <p className="text-xs text-violet-100">1단계 · 탐구 질문 만들기</p>
          </div>
        </div>
        {!isGuest && studentUid && (
          <p className="no-print text-xs font-medium text-violet-100">
            도움 {turnsLeft}회 · 오늘 {turnsLeftToday}회
          </p>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex max-h-[min(420px,55vh)] min-h-[240px] flex-1 flex-col gap-3 overflow-y-auto bg-slate-50/80 px-4 py-4"
        role="log"
        aria-live="polite"
        aria-label="탐구질문 챗봇 대화"
      >
        {chatLines.map((line) => (
          <div
            key={line.id}
            className={`flex gap-2 ${line.role === "user" ? "flex-row-reverse" : ""} ${line.role === "system" ? "justify-center" : ""}`}
          >
            {line.role === "bot" && <BotAvatar />}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                line.role === "user"
                  ? "rounded-tr-sm bg-violet-600 text-white"
                  : line.role === "system"
                    ? "rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 text-center"
                    : "rounded-tl-sm border border-slate-200 bg-white text-slate-800 shadow-sm"
              }`}
            >
              {line.text}
            </div>
          </div>
        ))}

        {activeStep === "review" && displayDraft && !confirmed && (
          <div className="mx-auto w-full max-w-md rounded-xl border border-violet-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-violet-700">질문 점검 · {quality}/3</p>
            <ul className="mt-2 space-y-1 text-xs text-slate-700">
              <li>{checklist.hasVariable ? "☑" : "☐"} 바꿀 조건과 볼 것</li>
              <li>{checklist.isTestable ? "☑" : "☐"} 교실에서 확인 가능</li>
              <li>{checklist.isMeasurable ? "☑" : "☐"} 측정·관찰 가능</li>
            </ul>
            {!readOnly && (
              <button type="button" className="no-print ui-btn-primary ui-btn-sm mt-3 w-full" onClick={handleConfirm}>
                이 질문으로
              </button>
            )}
          </div>
        )}

        {candidates.length > 0 && (
          <div className="no-print space-y-2 pl-11">
            <p className="text-xs font-semibold text-slate-600">탐구 질문 후보 — 골라 보세요</p>
            {candidates.map((c) => (
              <button
                key={c}
                type="button"
                className="block w-full rounded-xl border border-violet-200 bg-white px-3 py-2 text-left text-sm hover:bg-violet-50"
                onClick={() => pickCandidate(c)}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex gap-2 pl-11">
            <span className="rounded-2xl rounded-tl-sm border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500">
              생각하는 중…
            </span>
          </div>
        )}
      </div>

      {showComposer && (
        <div className="no-print shrink-0 border-t border-slate-200 bg-white p-3">
          {currentField && activeStructuredQuestion && (
            <div className="mb-3 rounded-xl border border-violet-100 bg-violet-50/60 px-3 py-2.5">
              <p className="text-xs font-semibold text-violet-800">{currentField.label}</p>
              <p className="mt-1 text-sm leading-snug text-slate-800">{activeStructuredQuestion}</p>
            </div>
          )}
          {currentField && (
            <p className="mb-2 text-xs text-slate-500">
              {input.length}/{currentField.limit}자
            </p>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              className="ui-input-compact min-w-0 flex-1"
              value={input}
              maxLength={currentField?.limit ?? 120}
              placeholder={composerPlaceholder}
              disabled={loading}
              onChange={(e) => setInput(e.target.value.slice(0, currentField?.limit ?? 120))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendCurrentStep();
                }
              }}
            />
            <button
              type="button"
              className="ui-btn-primary shrink-0 px-4"
              disabled={!input.trim() || loading}
              onClick={sendCurrentStep}
            >
              보내기
            </button>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="ui-btn-secondary ui-btn-sm"
              disabled={!stuckEligible || loading || isGuest || !studentUid || turnsLeft <= 0}
              onClick={handleStuck}
            >
              막혔어요
            </button>
            {isGuest && <span className="text-xs text-slate-500">체험 모드: AI 도움 없음</span>}
          </div>
        </div>
      )}

      <div className="hidden print:block border-t border-slate-200 p-4 text-sm">
        <p className="font-semibold">탐구 질문</p>
        {slots.observed && <p>관찰: {slots.observed}</p>}
        {slots.change && <p>바꿀 것: {slots.change}</p>}
        {slots.measure && <p>볼 것: {slots.measure}</p>}
        {displayDraft && <p className="mt-2 font-medium">확정: {displayDraft}</p>}
      </div>
    </section>
  );
}
