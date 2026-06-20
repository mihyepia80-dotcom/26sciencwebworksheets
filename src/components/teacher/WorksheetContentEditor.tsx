"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { getFirebaseErrorMessage } from "@/lib/firebase";
import { publishWorksheetContent, getWorksheetContent } from "@/lib/firebase/worksheet-content";
import {
  WORKSHEET_CONTENT_SCHEMAS,
  getDefaultWorksheetContent,
  type WorksheetContentSchema,
} from "@/lib/worksheet-content/registry";

const INPUT = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";

export function WorksheetContentEditor() {
  const { user, role } = useAuth();
  const [selectedId, setSelectedId] = useState(WORKSHEET_CONTENT_SCHEMAS[0]?.templateId ?? "");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const schema: WorksheetContentSchema | undefined = WORKSHEET_CONTENT_SCHEMAS.find(
    (s) => s.templateId === selectedId,
  );

  const loadContent = useCallback(async (templateId: string) => {
    setLoading(true);
    setError("");
    try {
      const doc = await getWorksheetContent(templateId);
      const defaults = getDefaultWorksheetContent(templateId);
      setFields(doc?.fields ? { ...defaults, ...doc.fields } : defaults);
      setLastUpdated(doc?.updatedAt ?? null);
    } catch (e: unknown) {
      setError(getFirebaseErrorMessage(e, "불러오기 실패"));
      setFields(getDefaultWorksheetContent(templateId));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) void loadContent(selectedId);
  }, [selectedId, loadContent]);

  const handlePublish = async () => {
    if (!user || role !== "teacher" || !selectedId) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await publishWorksheetContent(selectedId, fields, user.uid);
      setMessage("학습지 고정 텍스트가 배포되었습니다. 학생 화면에 즉시 반영됩니다.");
      await loadContent(selectedId);
    } catch (e: unknown) {
      setError(getFirebaseErrorMessage(e, "배포 실패"));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!selectedId) return;
    if (!window.confirm("코드 기본값으로 되돌릴까요? (저장 전까지 학생에게 반영되지 않습니다)")) return;
    setFields(getDefaultWorksheetContent(selectedId));
  };

  if (role !== "teacher") {
    return (
      <p className="text-sm text-slate-600">
        교사 로그인이 필요합니다.{" "}
        <Link href="/teacher" className="text-blue-600 hover:underline">
          교사 대시보드
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">학습지 선택</label>
        <select
          className={INPUT}
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {WORKSHEET_CONTENT_SCHEMAS.map((s) => (
            <option key={s.templateId} value={s.templateId}>
              {s.templateName}
            </option>
          ))}
        </select>
      </div>

      {lastUpdated && (
        <p className="text-xs text-slate-500">마지막 배포: {lastUpdated.toLocaleString("ko-KR")}</p>
      )}
      {loading && <p className="text-sm text-slate-500">불러오는 중…</p>}
      {message && <p className="text-sm text-emerald-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {schema && !loading && (
        <div className="space-y-4">
          {schema.fields.map((field) => (
            <div key={field.key}>
              <label className="mb-1 block text-xs font-medium text-slate-600">{field.label}</label>
              {field.multiline ? (
                <textarea
                  className={`${INPUT} min-h-[80px] resize-y leading-relaxed`}
                  rows={3}
                  value={fields[field.key] ?? ""}
                  onChange={(e) => setFields((prev) => ({ ...prev, [field.key]: e.target.value }))}
                />
              ) : (
                <input
                  type="text"
                  className={INPUT}
                  value={fields[field.key] ?? ""}
                  onChange={(e) => setFields((prev) => ({ ...prev, [field.key]: e.target.value }))}
                />
              )}
            </div>
          ))}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => void handlePublish()}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving ? "배포 중…" : "학생에게 배포"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
            >
              기본값으로 되돌리기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
