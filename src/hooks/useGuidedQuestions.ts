"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { requestGuidedQuestions } from "@/lib/ai/guided-questions";
import {
  findLatestPinnedGuidedQuestionsForTemplate,
  findPinnedGuidedQuestions,
} from "@/lib/firebase/guided-questions";
import {
  GUIDED_QUESTION_SLOTS,
  readGuidedQuestionsFromValues,
  writeGuidedQuestionsToValues,
  type GuidedQuestionSet,
  type GuidedQuestionSource,
} from "@/lib/guided-questions/types";
import { isTopicReadyForGuidedQuestions, normalizeTopicKey } from "@/lib/guided-questions/topic-key";
import type { WorksheetMeta } from "@/lib/types";

interface UseGuidedQuestionsOptions {
  templateId: string;
  templateName: string;
  meta: WorksheetMeta;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onMetaPrefill?: (patch: Partial<WorksheetMeta>) => void;
  readOnly?: boolean;
  /** 학생 모드: 교사 가이드 질문만 표시, AI 생성 없음 */
  studentMode?: boolean;
  /** 기존 제출 불러오기 중이면 교사 설정으로 덮어쓰지 않음 */
  skipTeacherPrefill?: boolean;
}

function padQuestions(list: string[]): string[] {
  const next = [...list];
  while (next.length < GUIDED_QUESTION_SLOTS) next.push("");
  return next.slice(0, GUIDED_QUESTION_SLOTS);
}

function applyTeacherMeta(set: GuidedQuestionSet, onMetaPrefill?: (patch: Partial<WorksheetMeta>) => void) {
  if (!onMetaPrefill) return;
  const patch: Partial<WorksheetMeta> = {};
  if (set.unit?.trim()) patch.unit = set.unit.trim();
  if (set.topic?.trim()) patch.topic = set.topic.trim();
  if (set.writingContext?.trim()) patch.writingContext = set.writingContext.trim();
  if (Object.keys(patch).length > 0) onMetaPrefill(patch);
}

export function useGuidedQuestions({
  templateId,
  templateName,
  meta,
  values,
  onChange,
  onMetaPrefill,
  readOnly,
  studentMode = false,
  skipTeacherPrefill = false,
}: UseGuidedQuestionsOptions) {
  const [questions, setQuestions] = useState<string[]>(padQuestions([]));
  const [source, setSource] = useState<GuidedQuestionSource | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fetchedTopicKeyRef = useRef("");
  const hydratedFromSaveRef = useRef(false);
  const teacherPrefillDoneRef = useRef(false);

  const applyQuestions = useCallback(
    (list: string[], nextSource: GuidedQuestionSource) => {
      const padded = padQuestions(list);
      setQuestions(padded);
      setSource(nextSource);
      if (!readOnly) {
        writeGuidedQuestionsToValues(padded, onChange);
      }
    },
    [onChange, readOnly],
  );

  const updateQuestion = useCallback(
    (index: number, text: string) => {
      setQuestions((prev) => {
        const next = [...prev];
        next[index] = text;
        if (!readOnly) onChange(`guided_q_${index}`, text);
        return next;
      });
      setSource(studentMode ? "manual" : "saved");
    },
    [onChange, readOnly, studentMode],
  );

  const loadForTopic = useCallback(
    async (topic: string, forceAi = false) => {
      const topicKey = normalizeTopicKey(topic);
      if (!isTopicReadyForGuidedQuestions(topic)) {
        setQuestions(padQuestions([]));
        setSource(null);
        setError("");
        fetchedTopicKeyRef.current = "";
        return;
      }

      if (!forceAi && fetchedTopicKeyRef.current === topicKey) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        if (!forceAi) {
          const pinned = await findPinnedGuidedQuestions(templateId, topic);
          if (pinned?.questions.length) {
            fetchedTopicKeyRef.current = topicKey;
            applyQuestions(pinned.questions, "pinned");
            return;
          }
        }

        const ai = await requestGuidedQuestions({
          templateId,
          templateName,
          meta,
        });
        fetchedTopicKeyRef.current = topicKey;
        applyQuestions(ai.questions, "ai");
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "유도 질문을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    },
    [applyQuestions, meta, templateId, templateName],
  );

  const loadTeacherGuide = useCallback(async () => {
    if (skipTeacherPrefill || teacherPrefillDoneRef.current) return;
    if (hydratedFromSaveRef.current) {
      teacherPrefillDoneRef.current = true;
      return;
    }

    setLoading(true);
    setError("");

    try {
      const pinned = await findLatestPinnedGuidedQuestionsForTemplate(templateId);
      teacherPrefillDoneRef.current = true;
      if (!pinned) {
        setSource("manual");
        return;
      }

      applyTeacherMeta(pinned, onMetaPrefill);
      if (pinned.questions.length) {
        applyQuestions(pinned.questions, "pinned");
      } else {
        setSource("manual");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "가이드 질문을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [applyQuestions, onMetaPrefill, skipTeacherPrefill, templateId]);

  const regenerate = useCallback(() => {
    if (readOnly || source === "pinned" || studentMode) return;
    fetchedTopicKeyRef.current = "";
    void loadForTopic(meta.topic, true);
  }, [loadForTopic, meta.topic, readOnly, source, studentMode]);

  useEffect(() => {
    if (hydratedFromSaveRef.current) return;
    const saved = readGuidedQuestionsFromValues(values);
    if (saved.length === 0) return;

    hydratedFromSaveRef.current = true;
    fetchedTopicKeyRef.current = normalizeTopicKey(meta.topic);
    setQuestions(padQuestions(saved));
    setSource(studentMode ? "manual" : "saved");
  }, [meta.topic, studentMode, values]);

  useEffect(() => {
    if (readOnly || !studentMode) return;
    void loadTeacherGuide();
  }, [loadTeacherGuide, readOnly, studentMode]);

  useEffect(() => {
    if (readOnly || studentMode) return;
    const topic = meta.topic?.trim() ?? "";
    if (!isTopicReadyForGuidedQuestions(topic)) return;
    if (hydratedFromSaveRef.current && fetchedTopicKeyRef.current === normalizeTopicKey(topic)) {
      return;
    }

    const timer = window.setTimeout(() => {
      void loadForTopic(topic);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [loadForTopic, meta.topic, readOnly, studentMode]);

  useEffect(() => {
    hydratedFromSaveRef.current = false;
    fetchedTopicKeyRef.current = "";
    teacherPrefillDoneRef.current = false;
  }, [templateId]);

  return {
    questions,
    source,
    loading,
    error,
    updateQuestion,
    regenerate,
    visible: studentMode ? true : isTopicReadyForGuidedQuestions(meta.topic),
    studentMode,
  };
}
