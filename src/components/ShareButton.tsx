"use client";

import { useState } from "react";
import { createShareLink } from "@/lib/firebase/shares";
import type { WorksheetSubmission } from "@/lib/firebase/submissions";

interface ShareButtonProps {
  submission: WorksheetSubmission;
  studentUid: string;
}

export function ShareButton({ submission, studentUid }: ShareButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [shareUrl, setShareUrl] = useState("");

  const handleShare = async () => {
    setLoading(true);
    setMessage("");
    try {
      const token = await createShareLink(submission, studentUid);
      const url = `${window.location.origin}/share/${token}`;
      setShareUrl(url);
      await navigator.clipboard.writeText(url);
      setMessage("공유 링크가 복사되었습니다. (보기 전용)");
    } catch {
      setMessage("공유 링크를 만들지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={loading}
        onClick={handleShare}
        className="rounded-lg border border-violet-200 px-4 py-2 text-sm text-violet-700 hover:bg-violet-50 disabled:opacity-60"
      >
        {loading ? "링크 생성 중..." : "공유 링크 복사"}
      </button>
      {message && <p className="text-xs text-slate-600">{message}</p>}
      {shareUrl && (
        <p className="break-all text-xs text-slate-500">{shareUrl}</p>
      )}
    </div>
  );
}
