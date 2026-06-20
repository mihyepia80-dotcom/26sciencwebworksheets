"use client";

import { useEffect, useMemo, useState } from "react";
import { subscribeWorksheetContent } from "@/lib/firebase/worksheet-content";
import { mergeWorksheetContent } from "@/lib/worksheet-content/registry";

export function useWorksheetContent(templateId: string) {
  const [overrides, setOverrides] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeWorksheetContent(
      templateId,
      (doc) => {
        setOverrides(doc?.fields ?? null);
        setLoading(false);
      },
      () => {
        setOverrides(null);
        setLoading(false);
      },
    );
    return unsub;
  }, [templateId]);

  const content = useMemo(
    () => mergeWorksheetContent(templateId, overrides ?? undefined),
    [templateId, overrides],
  );

  const get = (key: string): string => content[key] ?? "";

  return { content, get, loading };
}
