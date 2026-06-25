"use client";

import { useState } from "react";
import { createTeacherInviteLink } from "@/lib/firebase/teacher-invites";
import { getFirebaseErrorMessage } from "@/lib/firebase";
import { buildJoinUrl, TEACHER_INVITE_MODE_LABELS, type TeacherInviteMode } from "@/lib/teacher-invites/types";

interface TeacherInviteShareButtonProps {
  teacherUid: string;
  mode: TeacherInviteMode;
  templateId?: string;
  disabled?: boolean;
  className?: string;
}

export function TeacherInviteShareButton({
  teacherUid,
  mode,
  templateId,
  disabled,
  className = "ui-btn-secondary ui-btn-sm",
}: TeacherInviteShareButtonProps) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [shareUrl, setShareUrl] = useState("");

  const needsTemplate = mode === "worksheet" || mode === "workspace";
  const isDisabled = disabled || loading || (needsTemplate && !templateId);

  const handleShare = async () => {
    setLoading(true);
    setMessage("");
    setShareUrl("");
    try {
      const token = await createTeacherInviteLink(teacherUid, mode, templateId);
      const url = buildJoinUrl(token, window.location.origin);
      setShareUrl(url);
      try {
        await navigator.clipboard.writeText(url);
        setMessage("공유 링크가 복사되었습니다.");
      } catch {
        setMessage("링크가 생성되었습니다. 아래 주소를 복사해 주세요.");
      }
    } catch (err: unknown) {
      setMessage(getFirebaseErrorMessage(err, "공유 링크를 만들지 못했습니다."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1">
      <button type="button" disabled={isDisabled} onClick={() => void handleShare()} className={className}>
        {loading ? "링크 생성 중…" : `${TEACHER_INVITE_MODE_LABELS[mode]} 공유`}
      </button>
      {message && (
        <p className={`text-xs ${shareUrl ? "text-emerald-700" : "text-red-600"}`}>{message}</p>
      )}
      {shareUrl && <p className="break-all text-xs text-slate-500">{shareUrl}</p>}
    </div>
  );
}
