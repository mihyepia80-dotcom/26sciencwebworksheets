"use client";

import { useEffect, useState } from "react";
import { fetchAiQuotaStatus, type AiQuotaStatus } from "@/lib/ai/feedback";

const EXHAUSTED_QUOTA: AiQuotaStatus = {
  available: false,
  studentUsed: 1,
  studentLimit: 1,
  studentRemaining: 0,
  globalUsed: 100,
  globalLimit: 100,
  globalRemaining: 0,
  reason: "student",
};

export function useAiQuota(studentUid: string | undefined, enabled: boolean) {
  const [aiQuota, setAiQuota] = useState<AiQuotaStatus | null>(null);

  useEffect(() => {
    if (!enabled || !studentUid) return;
    fetchAiQuotaStatus(studentUid).then(setAiQuota).catch(() => setAiQuota(EXHAUSTED_QUOTA));
  }, [studentUid, enabled]);

  return { aiQuota, setAiQuota };
}
