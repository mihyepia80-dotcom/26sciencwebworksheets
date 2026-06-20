"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { listStudentSubmissions } from "@/lib/firebase";
import { buildTemplateProgressMap } from "@/lib/student-progress/build-map";
import type { TemplateProgress } from "@/lib/student-progress/types";

export function useStudentTemplateProgress(enabled = true) {
  const { user, role } = useAuth();
  const isStudent = role === "student";
  const [loading, setLoading] = useState(false);
  const [progressMap, setProgressMap] = useState<Map<string, TemplateProgress>>(new Map());

  useEffect(() => {
    if (!enabled || !user || !isStudent) {
      setProgressMap(new Map());
      return;
    }

    let cancelled = false;
    setLoading(true);

    listStudentSubmissions(user.uid)
      .then((list) => {
        if (!cancelled) setProgressMap(buildTemplateProgressMap(list));
      })
      .catch(() => {
        if (!cancelled) setProgressMap(new Map());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, user, isStudent]);

  const getProgress = useMemo(
    () =>
      (templateId: string): TemplateProgress => {
        return progressMap.get(templateId) ?? { status: "none", aiRating: null };
      },
    [progressMap],
  );

  const summary = useMemo(() => {
    let completed = 0;
    let draft = 0;
    for (const progress of progressMap.values()) {
      if (progress.status === "submitted") completed += 1;
      else if (progress.status === "draft") draft += 1;
    }
    return { completed, draft };
  }, [progressMap]);

  return { loading, progressMap, getProgress, summary, isStudent };
}
