"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { reviseWorksheetContentWithAi } from "@/lib/ai/worksheet-content-client";
import { getFirebaseErrorMessage } from "@/lib/firebase";
import { publishWorksheetContent, getWorksheetContent } from "@/lib/firebase/worksheet-content";
import {
  WORKSHEET_CONTENT_SCHEMAS,
  getDefaultWorksheetContent,
  type WorksheetContentFieldDef,
  type WorksheetContentSchema,
} from "@/lib/worksheet-content/registry";

const INPUT = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";

const MAIN_KEYS = new Set(["unit", "topic", "writingGuide", "reminder1", "reminder2"]);

function groupFields(fields: WorksheetContentFieldDef[]) {
  const main: WorksheetContentFieldDef[] = [];
  const extra: WorksheetContentFieldDef[] = [];
  const hints: WorksheetContentFieldDef[] = [];

  for (const field of fields) {
    if (MAIN_KEYS.has(field.key)) main.push(field);
    else if (field.key.startsWith("hint_")) hints.push(field);
    else extra.push(field);
  }

  return { main, extra, hints };
}

function FieldEditor({
  field,
  value,
  onChange,
}: {
  field: WorksheetContentFieldDef;
  value: string;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{field.label}</label>
      {field.multiline ? (
        <textarea
          className={`${INPUT} min-h-[80px] resize-y leading-relaxed`}
          rows={3}
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      ) : (
        <input
          type="text"
          className={INPUT}
          value={value}
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      )}
    </div>
  );
}

export function WorksheetContentEditor() {
  const { user, role } = useAuth();
  const [selectedId, setSelectedId] = useState(WORKSHEET_CONTENT_SCHEMAS[0]?.templateId ?? "");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [aiInstruction, setAiInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const schema: WorksheetContentSchema | undefined = WORKSHEET_CONTENT_SCHEMAS.find(
    (s) => s.templateId === selectedId,
  );

  const fieldGroups = useMemo(
    () => (schema ? groupFields(schema.fields) : { main: [], extra: [], hints: [] }),
    [schema],
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

  const handleFieldChange = (key: string, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

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

  const handleAiRevise = async () => {
    if (!schema || aiLoading) return;
    setAiLoading(true);
    setError("");
    setMessage("");
    try {
      const result = await reviseWorksheetContentWithAi({
        templateId: schema.templateId,
        templateName: schema.templateName,
        fields,
        instruction: aiInstruction,
        topic: fields.topic,
        unit: fields.unit,
      });
      setFields((prev) => ({ ...prev, ...result.fields }));
      setMessage("AI가 문구를 수정했습니다. 내용을 확인한 뒤 배포하세요.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "AI 수정 실패");
    } finally {
      setAiLoading(false);
    }
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
        <div className="space-y-6">
          <section className="rounded-xl border border-violet-200 bg-violet-50/40 p-4">
            <h3 className="text-sm font-bold text-violet-900">AI로 문구 수정</h3>
            <p className="mt-1 text-xs text-violet-800/80">
              단원·주제에 맞게 안내 문구를 다듬습니다. 아래에 추가 지시를 적으면 반영됩니다.
            </p>
            <textarea
              className={`${INPUT} mt-3 min-h-[72px] resize-y`}
              rows={2}
              placeholder="예: 용해와 용액 단원에 맞게 초등 5학년 수준으로 쉽게 수정해 주세요."
              value={aiInstruction}
              onChange={(e) => setAiInstruction(e.target.value)}
            />
            <button
              type="button"
              disabled={aiLoading}
              onClick={() => void handleAiRevise()}
              className="mt-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-60"
            >
              {aiLoading ? "AI 수정 중…" : "AI로 문구 수정"}
            </button>
          </section>

          {fieldGroups.main.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800">기본 안내 문구</h3>
              {fieldGroups.main.map((field) => (
                <FieldEditor
                  key={field.key}
                  field={field}
                  value={fields[field.key] ?? ""}
                  onChange={handleFieldChange}
                />
              ))}
            </section>
          )}

          {fieldGroups.extra.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800">학습지 전용 문구</h3>
              {fieldGroups.extra.map((field) => (
                <FieldEditor
                  key={field.key}
                  field={field}
                  value={fields[field.key] ?? ""}
                  onChange={handleFieldChange}
                />
              ))}
            </section>
          )}

          {fieldGroups.hints.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800">입력 칸 안내 (placeholder)</h3>
              <p className="text-xs text-slate-500">
                학생 입력 칸에 표시될 예시·힌트 문구입니다. (템플릿별 연동 범위는 점진 확대 중)
              </p>
              {fieldGroups.hints.map((field) => (
                <FieldEditor
                  key={field.key}
                  field={field}
                  value={fields[field.key] ?? ""}
                  onChange={handleFieldChange}
                />
              ))}
            </section>
          )}

          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
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
