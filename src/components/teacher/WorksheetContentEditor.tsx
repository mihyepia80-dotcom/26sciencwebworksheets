"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import {
  applyDesignPreset,
  buildTeachingDesignHrefWithExtra,
  getDesignPresetsForUnit,
  getLessonUnit,
  getWorksheetPresetForPeriod,
  LESSON_UNITS,
  parseTeachingDesignContext,
} from "@/lib/curriculum/design-flow";
import { TeachingDesignSteps } from "@/components/teacher/TeachingDesignSteps";

const INPUT = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";

const MAIN_KEYS = new Set(["unit", "topic", "inquiryQuestion", "writingGuide", "reminder1", "reminder2", "usageTips"]);

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, role } = useAuth();
  const initialCtx = useMemo(() => parseTeachingDesignContext(searchParams), [searchParams]);
  const [unitId, setUnitId] = useState(initialCtx.unitId);
  const [period, setPeriod] = useState(initialCtx.period);
  const [selectedId, setSelectedId] = useState(
    (initialCtx.templateId || WORKSHEET_CONTENT_SCHEMAS[0]?.templateId) ?? "",
  );
  const [fields, setFields] = useState<Record<string, string>>({});
  const [aiInstruction, setAiInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const skipLoadRef = useRef(false);

  const designCtx = useMemo(() => {
    const ctx = applyDesignPreset(unitId, period);
    const worksheet = getWorksheetPresetForPeriod(unitId, period);
    return {
      ...ctx,
      templateId: selectedId || worksheet?.templateId || ctx.templateId,
      templateLabel: worksheet?.templateLabel ?? ctx.templateLabel,
      learningTopic: fields.topic || ctx.learningTopic,
    };
  }, [unitId, period, selectedId, fields.topic]);

  const selectedUnit = getLessonUnit(unitId);
  const periodPresets = getDesignPresetsForUnit(unitId);

  const syncDesignUrl = useCallback(
    (ctxOverride?: Partial<typeof designCtx>) => {
      const ctx = ctxOverride ? { ...designCtx, ...ctxOverride } : designCtx;
      router.replace(buildTeachingDesignHrefWithExtra(3, ctx), { scroll: false });
    },
    [router, designCtx],
  );

  useEffect(() => {
    const ctx = parseTeachingDesignContext(searchParams);
    setUnitId(ctx.unitId);
    setPeriod(ctx.period);
    if (ctx.templateId) setSelectedId(ctx.templateId);

    const worksheet = getWorksheetPresetForPeriod(ctx.unitId, ctx.period);
    if (worksheet && (!ctx.templateId || ctx.templateId === worksheet.templateId)) {
      skipLoadRef.current = true;
      setSelectedId(worksheet.templateId);
      setFields((prev) => ({
        ...getDefaultWorksheetContent(worksheet.templateId),
        ...worksheet.fields,
        ...prev,
      }));
    }
  }, [searchParams]);

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
    if (skipLoadRef.current) {
      skipLoadRef.current = false;
      return;
    }
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

  const handleApplyUnitPreset = (presetPeriod: string) => {
    const worksheet = getWorksheetPresetForPeriod(unitId, presetPeriod);
    if (!worksheet) return;
    setPeriod(presetPeriod);
    skipLoadRef.current = true;
    if (worksheet.templateId !== selectedId) {
      setSelectedId(worksheet.templateId);
    }
    setFields({ ...getDefaultWorksheetContent(worksheet.templateId), ...worksheet.fields });
    setMessage(
      `${designCtx.unitLabel} ${presetPeriod}차시(${worksheet.templateLabel}) 프리셋을 적용했습니다. 배포 전 확인하세요.`,
    );
    syncDesignUrl(
      applyDesignPreset(unitId, presetPeriod, fields.unit || undefined),
    );
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
      <TeachingDesignSteps currentStep={3} ctx={designCtx} />

      <section className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
        <h3 className="text-sm font-bold text-indigo-950">③ 학습지 텍스트 — 단원·차시 연동</h3>
        <p className="mt-1 text-xs leading-relaxed text-indigo-900/90">
          ①·②에서 정한 단원·차시·사고 활동지에 맞는 안내 문구를 편집·배포합니다.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-indigo-900">단원</span>
            <select
              className={INPUT}
              value={unitId}
              onChange={(e) => {
                const nextUnitId = e.target.value;
                setUnitId(nextUnitId);
                const first = getDesignPresetsForUnit(nextUnitId)[0];
                if (first) {
                  const ws = getWorksheetPresetForPeriod(nextUnitId, first.period);
                  setPeriod(first.period);
                  if (ws) {
                    skipLoadRef.current = true;
                    setSelectedId(ws.templateId);
                    setFields({ ...getDefaultWorksheetContent(ws.templateId), ...ws.fields });
                  }
                  syncDesignUrl(applyDesignPreset(nextUnitId, first.period));
                } else {
                  syncDesignUrl({
                    unitId: nextUnitId,
                    unitLabel: getLessonUnit(nextUnitId).label,
                  });
                }
              }}
            >
              {LESSON_UNITS.filter((u) => !u.customLabel).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-indigo-900">차시</span>
            <input
              className={INPUT}
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value);
                syncDesignUrl({ period: e.target.value });
              }}
              placeholder="1/12"
            />
          </label>
        </div>
        {periodPresets.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {periodPresets.map((p) => {
              const ws = getWorksheetPresetForPeriod(unitId, p.period);
              if (!ws) return null;
              return (
                <button
                  key={p.period}
                  type="button"
                  onClick={() => handleApplyUnitPreset(p.period)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                    period === p.period && ws.templateId === selectedId
                      ? "bg-indigo-600 text-white"
                      : "border border-indigo-200 bg-white text-indigo-800 hover:bg-indigo-50"
                  }`}
                >
                  {p.period} · {ws.templateLabel}
                </button>
              );
            })}
          </div>
        )}
        {selectedUnit.periodPresets.length === 0 && (
          <p className="mt-2 text-xs text-indigo-800/80">
            이 단원은 차시 프리셋이 없습니다. 아래에서 학습지를 직접 선택하세요.
          </p>
        )}
      </section>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">사고 활동지(학습지) 선택</label>
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
