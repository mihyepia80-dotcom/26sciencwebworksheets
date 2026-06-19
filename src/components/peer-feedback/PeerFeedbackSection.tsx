"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  createPeerFeedback,
  findClassmateWorkDocId,
  getInquiryReport,
  getStudentFirebaseErrorMessage,
  getSubmission,
  listAuthorPeerFeedbacks,
  listClassmates,
  listReceivedPeerFeedbacks,
  type PeerFeedbackDoc,
} from "@/lib/firebase";
import {
  EMPTY_PEER_FEEDBACK,
  MAX_PEER_FEEDBACK_COUNT,
  validatePeerFeedbackForm,
  type ClassmateInfo,
  type PeerFeedbackForm,
  type PeerFeedbackTargetType,
} from "@/lib/peer-feedback/types";
import { MIN_FEEDBACK_FIELD_CHARS } from "@/lib/worksheet-validation";

interface PeerFeedbackSectionProps {
  targetType: PeerFeedbackTargetType;
  templateId: string;
  templateName: string;
  ownDocId: string | null;
  enabled: boolean;
}

export function PeerFeedbackSection({
  targetType,
  templateId,
  templateName,
  ownDocId,
  enabled,
}: PeerFeedbackSectionProps) {
  const { user, studentProfile } = useAuth();
  const [given, setGiven] = useState<PeerFeedbackDoc[]>([]);
  const [received, setReceived] = useState<PeerFeedbackDoc[]>([]);
  const [classmates, setClassmates] = useState<ClassmateInfo[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ClassmateInfo | null>(null);
  const [form, setForm] = useState<PeerFeedbackForm>(EMPTY_PEER_FEEDBACK);
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    if (!user || !studentProfile || !enabled) return;
    setLoading(true);
    setError("");

    const [givenResult, receivedResult, matesResult] = await Promise.allSettled([
      listAuthorPeerFeedbacks(user.uid, targetType, templateId),
      listReceivedPeerFeedbacks(user.uid),
      listClassmates(studentProfile.grade, studentProfile.classNo, user.uid),
    ]);

    if (givenResult.status === "fulfilled") {
      setGiven(givenResult.value);
    } else {
      setGiven([]);
    }

    if (receivedResult.status === "fulfilled") {
      setReceived(
        receivedResult.value.filter(
          (f) =>
            f.targetType === targetType &&
            f.templateId === templateId &&
            (!ownDocId || f.targetDocId === ownDocId),
        ),
      );
    } else {
      setReceived([]);
    }

    if (matesResult.status === "fulfilled") {
      setClassmates(matesResult.value);
    } else {
      setClassmates([]);
    }

    setLoading(false);
  }, [enabled, ownDocId, studentProfile, targetType, templateId, user]);

  useEffect(() => {
    void load();
  }, [load]);

  const remaining = MAX_PEER_FEEDBACK_COUNT - given.length;
  const givenTargetIds = useMemo(() => new Set(given.map((g) => g.targetUid)), [given]);

  const filteredClassmates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return classmates.filter((c) => {
      if (givenTargetIds.has(c.uid)) return false;
      if (!q) return true;
      return c.studentName.toLowerCase().includes(q) || c.studentNo.includes(q);
    });
  }, [classmates, givenTargetIds, search]);

  const selectClassmate = async (mate: ClassmateInfo) => {
    if (!user || !studentProfile) return;
    setError("");
    setPreview("");
    setSelected(mate);
    setForm(EMPTY_PEER_FEEDBACK);
    try {
      const docId = await findClassmateWorkDocId(
        studentProfile.grade,
        studentProfile.classNo,
        targetType,
        templateId,
        mate.uid,
      );
      if (!docId) {
        setError(`${mate.studentName} 학생은 아직 같은 활동지를 제출하지 않았습니다.`);
        setSelected(null);
        return;
      }
      if (targetType === "worksheet") {
        const sub = await getSubmission(docId);
        if (!sub) throw new Error("활동지를 불러올 수 없습니다.");
        const previewText = Object.entries(sub.values)
          .filter(([, v]) => v.trim())
          .slice(0, 6)
          .map(([k, v]) => `[${k}]\n${v}`)
          .join("\n\n");
        setPreview(previewText || "작성 내용이 없습니다.");
      } else {
        const report = await getInquiryReport(docId);
        if (!report) throw new Error("탐구보고서를 불러올 수 없습니다.");
        setPreview(
          [
            report.inquiryProblem && `탐구 문제: ${report.inquiryProblem}`,
            report.inquiryResult && `탐구 결과: ${report.inquiryResult}`,
            report.learnedAfter && `알게 된 점: ${report.learnedAfter}`,
          ]
            .filter(Boolean)
            .join("\n\n") || "작성 내용이 없습니다.",
        );
      }
    } catch (e: unknown) {
      setError(getStudentFirebaseErrorMessage(e, "친구 활동지를 불러오지 못했습니다."));
      setSelected(null);
    }
  };

  const handleSubmit = async () => {
    if (!user || !studentProfile || !selected || remaining <= 0) return;
    const errors = validatePeerFeedbackForm(form);
    if (errors.length) {
      setError(errors[0] ?? "입력을 확인하세요.");
      return;
    }
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const targetDocId = await findClassmateWorkDocId(
        studentProfile.grade,
        studentProfile.classNo,
        targetType,
        templateId,
        selected.uid,
      );
      if (!targetDocId) throw new Error("동료의 제출물을 찾을 수 없습니다.");

      await createPeerFeedback({
        author: { ...studentProfile, uid: user.uid },
        target: { uid: selected.uid, studentName: selected.studentName },
        targetType,
        targetDocId,
        templateId,
        templateName,
        form,
      });
      setMessage(`${selected.studentName} 학생에게 피드백을 남겼습니다.`);
      setSelected(null);
      setSearch("");
      setForm(EMPTY_PEER_FEEDBACK);
      setPreview("");
      await load();
    } catch (e: unknown) {
      setError(getStudentFirebaseErrorMessage(e, "피드백 저장에 실패했습니다."));
    } finally {
      setSubmitting(false);
    }
  };

  if (!enabled || !user || !studentProfile) return null;

  return (
    <section className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50/40 p-5">
      <h3 className="text-base font-bold text-emerald-900">동료 피드백</h3>
      <p className="mt-1 text-sm text-emerald-800">
        같은 반 친구 활동지에 피드백을 작성하세요. 각 항목 {MIN_FEEDBACK_FIELD_CHARS}자 이상 한글로
        작성합니다. ({given.length}/{MAX_PEER_FEEDBACK_COUNT})
      </p>

      {loading && <p className="mt-3 text-sm text-slate-500">불러오는 중...</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {message && <p className="mt-3 text-sm text-green-600">{message}</p>}

      {remaining > 0 && (
        <div className="mt-4 space-y-4 rounded-lg border border-emerald-100 bg-white p-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">동료 이름 검색</span>
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              placeholder="이름 또는 번호"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>

          {search.trim() && !selected && (
            <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-100 p-2">
              {filteredClassmates.length === 0 && (
                <li className="px-2 py-2 text-sm text-slate-500">검색 결과가 없습니다.</li>
              )}
              {filteredClassmates.slice(0, 10).map((mate) => (
                <li key={mate.uid}>
                  <button
                    type="button"
                    onClick={() => void selectClassmate(mate)}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-emerald-50"
                  >
                    {mate.studentName} ({mate.studentNo}번)
                  </button>
                </li>
              ))}
            </ul>
          )}

          {selected && (
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <p className="text-sm font-medium text-slate-800">
                {selected.studentName} ({selected.studentNo}번)
              </p>
              <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
                {preview}
              </pre>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">나와 다른 점</span>
                <textarea
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm"
                  rows={2}
                  value={form.differentPoint}
                  onChange={(e) => setForm((f) => ({ ...f, differentPoint: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">잘한 점</span>
                <textarea
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm"
                  rows={2}
                  value={form.goodPoint}
                  onChange={(e) => setForm((f) => ({ ...f, goodPoint: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">궁금한 점</span>
                <textarea
                  className="w-full rounded-lg border border-slate-200 p-2 text-sm"
                  rows={2}
                  value={form.curiousPoint}
                  onChange={(e) => setForm((f) => ({ ...f, curiousPoint: e.target.value }))}
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleSubmit()}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {submitting ? "저장 중..." : "피드백 제출"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(null);
                    setForm(EMPTY_PEER_FEEDBACK);
                    setPreview("");
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600"
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {remaining <= 0 && given.length > 0 && (
        <p className="mt-3 text-sm text-emerald-700">동료 피드백 {MAX_PEER_FEEDBACK_COUNT}명 작성을 완료했습니다.</p>
      )}

      {given.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-slate-700">내가 작성한 피드백</h4>
          <ul className="mt-2 space-y-2">
            {given.map((f) => (
              <li key={f.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
                <p className="font-medium text-slate-800">→ {f.targetName}</p>
                <p className="mt-1 text-slate-600">다른 점: {f.differentPoint}</p>
                <p className="text-slate-600">잘한 점: {f.goodPoint}</p>
                <p className="text-slate-600">궁금한 점: {f.curiousPoint}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {received.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-slate-700">친구가 남긴 피드백</h4>
          <ul className="mt-2 space-y-2">
            {received.map((f) => (
              <li key={f.id} className="rounded-lg border border-violet-200 bg-violet-50/50 p-3 text-sm">
                <p className="font-medium text-violet-900">← {f.authorName}</p>
                <p className="mt-1 text-slate-600">다른 점: {f.differentPoint}</p>
                <p className="text-slate-600">잘한 점: {f.goodPoint}</p>
                <p className="text-slate-600">궁금한 점: {f.curiousPoint}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
