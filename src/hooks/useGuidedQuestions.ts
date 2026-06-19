"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { requestGuidedQuestions } from "@/lib/ai/guided-questions";
import { getStudentFirebaseErrorMessage } from "@/lib/firebase/errors";
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
  /** 로그인 후에만 Firestore 조회 (미인증 permission-denied 방지) */
  userUid?: string;
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
  userUid,
}: UseGuidedQuestionsOptions) {
  const [questions, setQuestions] = useState<string[]>(padQuestions([]));
  const [teacherReferenceQuestions, setTeacherReferenceQuestions] = useState<string[]>(padQuestions([]));
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
        const reference = padQuestions(pinned.questions);
        setTeacherReferenceQuestions(reference);
        if (studentMode) {
          setSource("pinned");
        } else {
          applyQuestions(pinned.questions, "pinned");
        }
      } else {
        setSource("manual");
      }
    } catch (e: unknown) {
      const code = e instanceof Error ? (e as Error & { code?: string }).code : undefined;
      if (code === "permission-denied") {
        setSource("manual");
        return;
      }
      setError(
        getStudentFirebaseErrorMessage(e, "가이드 질문을 불러오지 못했습니다. 학습지는 그대로 작성할 수 있습니다."),
      );
    } finally {
      setLoading(false);
    }
  }, [applyQuestions, onMetaPrefill, skipTeacherPrefill, studentMode, templateId]);

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
    if (readOnly || !studentMode || !userUid) return;
    void loadTeacherGuide();
  }, [loadTeacherGuide, readOnly, studentMode, userUid]);

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
    setTeacherReferenceQuestions(padQuestions([]));
  }, [templateId]);

  return {
    questions,
    teacherReferenceQuestions,
    source,
    loading,
    error,
    updateQuestion,
    regenerate,
    visible: studentMode ? true : isTopicReadyForGuidedQuestions(meta.topic),
    studentMode,
  };
}
