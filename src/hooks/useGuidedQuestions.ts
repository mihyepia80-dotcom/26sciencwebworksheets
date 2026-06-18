"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { requestGuidedQuestions } from "@/lib/ai/guided-questions";
import { findPinnedGuidedQuestions } from "@/lib/firebase/guided-questions";
import {
  GUIDED_QUESTION_SLOTS,
  readGuidedQuestionsFromValues,
  writeGuidedQuestionsToValues,
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
  readOnly?: boolean;
}

function padQuestions(list: string[]): string[] {
  const next = [...list];
  while (next.length < GUIDED_QUESTION_SLOTS) next.push("");
  return next.slice(0, GUIDED_QUESTION_SLOTS);
}

export function useGuidedQuestions({
  templateId,
  templateName,
  meta,
  values,
  onChange,
  readOnly,
}: UseGuidedQuestionsOptions) {
  const [questions, setQuestions] = useState<string[]>(padQuestions([]));
  const [source, setSource] = useState<GuidedQuestionSource | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fetchedTopicKeyRef = useRef("");
  const hydratedFromSaveRef = useRef(false);

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
      setSource("saved");
    },
    [onChange, readOnly],
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

  const regenerate = useCallback(() => {
    if (readOnly || source === "pinned") return;
    fetchedTopicKeyRef.current = "";
    void loadForTopic(meta.topic, true);
  }, [loadForTopic, meta.topic, readOnly, source]);

  useEffect(() => {
    if (hydratedFromSaveRef.current) return;
    const saved = readGuidedQuestionsFromValues(values);
    if (saved.length === 0) return;

    hydratedFromSaveRef.current = true;
    fetchedTopicKeyRef.current = normalizeTopicKey(meta.topic);
    setQuestions(padQuestions(saved));
    setSource("saved");
  }, [meta.topic, values]);

  useEffect(() => {
    if (readOnly) return;
    const topic = meta.topic?.trim() ?? "";
    if (!isTopicReadyForGuidedQuestions(topic)) return;
    if (hydratedFromSaveRef.current && fetchedTopicKeyRef.current === normalizeTopicKey(topic)) {
      return;
    }

    const timer = window.setTimeout(() => {
      void loadForTopic(topic);
    }, 700);

    return () => window.clearTimeout(timer);
  }, [loadForTopic, meta.topic, readOnly]);

  useEffect(() => {
    hydratedFromSaveRef.current = false;
    fetchedTopicKeyRef.current = "";
  }, [templateId]);

  return {
    questions,
    source,
    loading,
    error,
    updateQuestion,
    regenerate,
    visible: isTopicReadyForGuidedQuestions(meta.topic),
  };
}
