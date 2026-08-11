"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { WorksheetMeta } from "@/lib/types";
import { WorksheetCallout } from "@/components/common/WorksheetUi";
import { fetchMyPadletBoard, publishToPadlet } from "@/lib/padlet/client";
import { composePost, parsePeriodFromMeta } from "@/lib/padlet/post-composer";
import { resolvePadletFields } from "@/lib/padlet/padlet-fields";
import { getTemplateById } from "@/lib/templates/registry";
import type { SubmissionPadletPost } from "@/lib/padlet/publish-types";
import { useAuth } from "@/components/AuthProvider";

interface PadletPublishPanelProps {
  submissionId: string;
  submitted: boolean;
  templateId: string;
  templateName: string;
  meta: WorksheetMeta;
  values: Record<string, string>;
  padletPost?: SubmissionPadletPost;
  isGuest?: boolean;
  onPadletPostChange?: (post: SubmissionPadletPost) => void;
}

export function PadletPublishPanel({
  submissionId,
  submitted,
  templateId,
  templateName,
  meta,
  values,
  padletPost,
  isGuest = false,
  onPadletPostChange,
}: PadletPublishPanelProps) {
  const { user } = useAuth();
  const [boardUrl, setBoardUrl] = useState<string | null>(null);
  const [boardTitle, setBoardTitle] = useState("");
  const [publishOpen, setPublishOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState("");
  const [localPost, setLocalPost] = useState<SubmissionPadletPost | undefined>(padletPost);

  const period = parsePeriodFromMeta(meta.period, getTemplateById(templateId)?.defaultPeriod);
  const studentNo = Number(meta.studentNo) || 0;
  const template = getTemplateById(templateId);
  const preview = useMemo(
    () => composePost({ templateId, templateName, meta, values }, period, studentNo, null, resolvePadletFields(templateId, template?.padletFields)),
    [templateId, templateName, meta, values, period, studentNo, template?.padletFields],
  );

  useEffect(() => {
    setLocalPost(padletPost);
  }, [padletPost]);

  const loadBoard = useCallback(async () => {
    if (!user || isGuest) return;
    const grade = Number(meta.grade);
    const classNo = Number(meta.classNo);
    if (!grade || !classNo) return;
    setLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetchMyPadletBoard(token, { grade, classNo, period });
      if (res.board) {
        setBoardUrl(res.board.boardUrl);
        setBoardTitle(res.board.title);
        setPublishOpen(res.board.publishOpen);
        const mine = res.board.myPosts.find((p) => p.period === period);
        if (mine?.postUrl && !localPost?.postUrl) {
          const next: SubmissionPadletPost = {
            boardId: "",
            postDocId: "",
            postUrl: mine.postUrl,
            status: mine.status as SubmissionPadletPost["status"],
            publishedAt: null,
          };
          setLocalPost(next);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [user, isGuest, meta.grade, meta.classNo, period, localPost?.postUrl]);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  const handlePublish = async () => {
    if (!user || isGuest || !submitted) return;
    setPublishing(true);
    setMessage("");
    try {
      const token = await user.getIdToken();
      const res = await publishToPadlet(token, {
        submissionId,
        mode: localPost?.status === "published" || localPost?.status === "stale" ? "republish" : "publish",
      });
      setMessage(res.message ?? "");
      if (res.status === "published" || res.status === "updated" || res.status === "duplicate") {
        const next: SubmissionPadletPost = {
          boardId: "",
          postDocId: "",
          postUrl: res.postUrl,
          status: res.status === "duplicate" ? "published" : "published",
          publishedAt: new Date(),
        };
        setLocalPost(next);
        onPadletPostChange?.(next);
      }
    } catch (e: unknown) {
      setMessage(e instanceof Error ? e.message : "게시에 실패했습니다.");
    } finally {
      setPublishing(false);
    }
  };

  if (isGuest) return null;

  const published = localPost?.status === "published";
  const stale = localPost?.status === "stale";
  const failed = localPost?.status === "failed";

  return (
    <section className="padlet-publish-panel ui-card overflow-hidden no-print print:hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50 px-5 py-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">우리 반 나눔 게시판</h2>
          <p className="text-xs text-slate-600">
            {boardTitle || "연결된 게시판"} · {studentNo}번 칸 · {period}차시
          </p>
        </div>
      </div>

      <div className="space-y-4 p-5">
        {!submitted && (
          <p className="text-sm text-amber-800">먼저 제출해야 게시판에 올릴 수 있어요.</p>
        )}

        {submitted && !boardUrl && !loading && (
          <p className="text-sm text-slate-600">연결된 나눔 게시판이 없어요. 선생님께 문의해 주세요.</p>
        )}

        {submitted && boardUrl && (
          <>
            <WorksheetCallout variant="neutral" title="게시 미리보기">
              <p className="text-sm font-medium text-slate-900">{preview.subject}</p>
              <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{preview.body.slice(0, 200)}…</p>
            </WorksheetCallout>

            {!publishOpen && (
              <p className="text-sm text-amber-800">선생님이 게시를 마감했어요.</p>
            )}

            {published && !stale && (
              <p className="text-sm text-emerald-700">
                ✓ {period}차시 글을 올렸어요
                {localPost?.publishedAt instanceof Date
                  ? ` (${localPost.publishedAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })})`
                  : ""}
              </p>
            )}

            {stale && (
              <p className="text-sm text-amber-800">수정한 내용이 아직 게시되지 않았어요.</p>
            )}

            {failed && <p className="text-sm text-red-600">게시에 실패했어요. 다시 시도해 주세요.</p>}
            {message && <p className="text-sm text-slate-600">{message}</p>}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="ui-btn-primary ui-btn-sm"
                disabled={!submitted || !publishOpen || publishing || loading}
                onClick={handlePublish}
              >
                {publishing
                  ? "올리는 중…"
                  : published || stale
                    ? "수정한 내용을 다시 올리기"
                    : "게시판에 올리기"}
              </button>
              {boardUrl && (
                <a
                  href={boardUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ui-btn-secondary ui-btn-sm"
                >
                  게시판 열기
                </a>
              )}
              {localPost?.postUrl && (
                <a
                  href={localPost.postUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ui-btn-secondary ui-btn-sm"
                >
                  올린 글 보기
                </a>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
