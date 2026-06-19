"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import {
  createLessonPlan,
  deleteLessonPlan,
  getLessonPlan,
  getFirebaseErrorMessage,
  listTeacherLessonPlans,
  updateLessonPlan,
  type LessonPlanDoc,
} from "@/lib/firebase";
import {
  EMPTY_LESSON_PLAN,
  EMPTY_PROCESS_ROW,
  type LessonPlanForm,
  type LessonProcessRow,
} from "@/lib/lesson-plan/types";
import {
  buildInquiryStages,
  formatToolOption,
  getPrimaryToolOptions,
  getReflectionToolOptions,
  parseInquiryStages,
  validateLessonThinkingTools,
  type PrimaryInquiryStageKey,
} from "@/lib/lesson-plan/thinking-tools";

const PRIMARY_STAGE_LABELS: { key: PrimaryInquiryStageKey; label: string }[] = [
  { key: "questioning", label: "질문하기" },
  { key: "inquiring", label: "탐구하기" },
  { key: "generalizing", label: "일반화하기" },
  { key: "transferring", label: "전이하기" },
];

const INPUT = "w-full rounded border border-slate-200 px-3 py-2 text-sm";
const SELECT = `${INPUT} bg-white`;
const TEXTAREA = "w-full resize-y rounded border border-slate-200 px-3 py-2 text-sm";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-xs font-semibold text-slate-600">{children}</span>;
}

function GridCell({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`border border-slate-200 p-3 ${className}`}>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  );
}

export function LessonPlanManager({ initialPlanId }: { initialPlanId?: string | null }) {
  const { user, role } = useAuth();
  const [plans, setPlans] = useState<LessonPlanDoc[]>([]);
  const [form, setForm] = useState<LessonPlanForm>(EMPTY_LESSON_PLAN);
  const [planId, setPlanId] = useState<string | null>(initialPlanId ?? null);
  const [listLoading, setListLoading] = useState(true);
  const [editorLoading, setEditorLoading] = useState(Boolean(initialPlanId));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadList = useCallback(() => {
    if (!user || role !== "teacher") return;
    setListLoading(true);
    listTeacherLessonPlans(user.uid)
      .then(setPlans)
      .catch((e: unknown) => setError(getFirebaseErrorMessage(e, "목록 불러오기 실패")))
      .finally(() => setListLoading(false));
  }, [user, role]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    if (!initialPlanId || !user) {
      setEditorLoading(false);
      return;
    }
    getLessonPlan(initialPlanId)
      .then((doc) => {
        if (!doc || doc.teacherUid !== user.uid) {
          setError("지도안을 불러올 수 없습니다.");
          return;
        }
        const { primary, useReflection } = parseInquiryStages(doc.inquiryStages);
        setForm({
          planTitle: doc.planTitle,
          unit: doc.unit,
          period: doc.period,
          teachingModel: doc.teachingModel,
          coreIdea: doc.coreIdea,
          inquiryStages: buildInquiryStages(primary, useReflection),
          learningTopic: doc.learningTopic,
          achievementStandards: doc.achievementStandards,
          learningObjectives: doc.learningObjectives,
          inquiryKnowledge: doc.inquiryKnowledge,
          inquiryProcess: doc.inquiryProcess,
          inquiryValues: doc.inquiryValues,
          inquiryQuestions: doc.inquiryQuestions,
          activities: doc.activities,
          writingTask: doc.writingTask,
          thinkingTechnique: doc.thinkingTechnique,
          thinkingStep1: doc.thinkingStep1,
          thinkingStep2: doc.thinkingStep2,
          thinkingStep3: doc.thinkingStep3,
          reflection: doc.reflection,
          evaluationKnowledge: doc.evaluationKnowledge,
          evaluationProcess: doc.evaluationProcess,
          evaluationValues: doc.evaluationValues,
          thinkingTool: doc.thinkingTool,
          reflectionThinkingTool: doc.reflectionThinkingTool ?? "",
          templateSource: doc.templateSource,
          writingContext: doc.writingContext,
          aiWebApp: doc.aiWebApp,
          usageTips: doc.usageTips,
          processRows: doc.processRows,
        });
        setPlanId(doc.id ?? initialPlanId);
      })
      .catch(() => setError("불러오기 실패"))
      .finally(() => setEditorLoading(false));
  }, [initialPlanId, user]);

  const patch = <K extends keyof LessonPlanForm>(key: K, value: LessonPlanForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const patchRow = (index: number, key: keyof LessonProcessRow, value: string) => {
    setForm((prev) => {
      const rows = [...prev.processRows];
      rows[index] = { ...rows[index], [key]: value };
      return { ...prev, processRows: rows };
    });
  };

  const addRow = () => {
    setForm((prev) => ({ ...prev, processRows: [...prev.processRows, { ...EMPTY_PROCESS_ROW }] }));
  };

  const removeRow = (index: number) => {
    setForm((prev) => ({
      ...prev,
      processRows: prev.processRows.length > 1 ? prev.processRows.filter((_, i) => i !== index) : prev.processRows,
    }));
  };

  const { primary: primaryStage, useReflection } = parseInquiryStages(form.inquiryStages);
  const primaryToolOptions = getPrimaryToolOptions(primaryStage);
  const reflectionToolOptions = getReflectionToolOptions();

  const setPrimaryStage = (stage: PrimaryInquiryStageKey) => {
    setForm((prev) => {
      const options = getPrimaryToolOptions(stage);
      const keepTool =
        !prev.thinkingTool || options.some((t) => formatToolOption(t) === prev.thinkingTool);
      return {
        ...prev,
        inquiryStages: buildInquiryStages(stage, prev.inquiryStages.reflecting),
        thinkingTool: keepTool ? prev.thinkingTool : "",
      };
    });
  };

  const setUseReflection = (checked: boolean) => {
    setForm((prev) => {
      const { primary } = parseInquiryStages(prev.inquiryStages);
      return {
        ...prev,
        inquiryStages: buildInquiryStages(primary, checked),
        reflectionThinkingTool: checked ? prev.reflectionThinkingTool : "",
      };
    });
  };

  const handleSave = async () => {
    if (!user || role !== "teacher") return;

    const toolError = validateLessonThinkingTools(
      form.thinkingTool,
      form.reflectionThinkingTool,
      useReflection,
    );
    if (toolError) {
      setError(toolError);
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    const saveForm: LessonPlanForm = {
      ...form,
      inquiryStages: buildInquiryStages(primaryStage, useReflection),
    };
    try {
      if (planId) {
        await updateLessonPlan(planId, saveForm, user.uid);
        setForm(saveForm);
      } else {
        const id = await createLessonPlan(saveForm, user.uid);
        setPlanId(id);
        setForm(saveForm);
        window.history.replaceState(null, "", `/teacher/lesson-plans?plan=${id}`);
      }
      setMessage("저장되었습니다.");
      loadList();
    } catch (e: unknown) {
      setError(getFirebaseErrorMessage(e, "저장 실패"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!planId || !window.confirm("이 수업지도안을 삭제할까요?")) return;
    setSaving(true);
    try {
      await deleteLessonPlan(planId);
      setPlanId(null);
      setForm(EMPTY_LESSON_PLAN);
      setMessage("삭제되었습니다.");
      window.history.replaceState(null, "", "/teacher/lesson-plans");
      loadList();
    } catch (e: unknown) {
      setError(getFirebaseErrorMessage(e, "삭제 실패"));
    } finally {
      setSaving(false);
    }
  };

  const handleNew = () => {
    setPlanId(null);
    setForm(EMPTY_LESSON_PLAN);
    setMessage("");
    setError("");
    window.history.replaceState(null, "", "/teacher/lesson-plans");
  };

  if (editorLoading) {
    return <p className="py-16 text-center text-sm text-slate-500">불러오는 중...</p>;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 print:max-w-none print:px-2">
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <div>
          <Link href="/teacher" className="text-sm text-blue-600 hover:underline">
            ← 교사 대시보드
          </Link>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">수업지도안 설계</h1>
          <p className="mt-1 text-sm text-slate-600">
            차시별로 직접 구성·저장합니다. 한 차시에는 <strong>주 사고도구 1개</strong>, 필요 시{" "}
            <strong>성찰 단계 사고도구 1개</strong>만 사용합니다.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleNew} className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50">
            새 지도안
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
          >
            🖨 인쇄
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
          {planId && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              삭제
            </button>
          )}
        </div>
      </div>

      {message && <p className="mt-4 text-sm text-green-600 print:hidden">{message}</p>}
      {error && <p className="mt-4 text-sm text-red-600 print:hidden">{error}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr] print:mt-0 print:block">
        <aside className="rounded-xl border border-slate-200 bg-white p-4 print:hidden">
          <h2 className="text-sm font-bold text-slate-800">내 지도안</h2>
          {listLoading && <p className="mt-3 text-xs text-slate-500">불러오는 중...</p>}
          <ul className="mt-3 space-y-2">
            {plans.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/teacher/lesson-plans?plan=${p.id}`}
                  className={`block rounded-lg px-3 py-2 text-sm ${
                    planId === p.id ? "bg-blue-50 font-medium text-blue-800" : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {p.planTitle || p.unit || "제목 없음"}
                  <span className="mt-0.5 block text-xs text-slate-400">{p.period || "차시 미입력"}</span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        <div id="lesson-plan-print" className="space-y-4 print:space-y-0">
          <div className="rounded-xl border border-slate-200 bg-white p-4 print:rounded-none print:border-0 print:p-0 print:shadow-none">
            <h2 className="mb-4 text-center text-base font-bold text-slate-900">
              개념기반탐구수업 사고촉진 전략 글쓰기 수업 설계
            </h2>

            <label className="mb-4 block">
              <FieldLabel>지도안 제목 (관리용)</FieldLabel>
              <input className={INPUT} value={form.planTitle} onChange={(e) => patch("planTitle", e.target.value)} placeholder="예: 용해와 용액 4~5차시" />
            </label>

            <div className="grid border border-slate-200 sm:grid-cols-2 lg:grid-cols-4">
              <GridCell label="단원">
                <input className={INPUT} value={form.unit} onChange={(e) => patch("unit", e.target.value)} placeholder="3. 용해와 용액" />
              </GridCell>
              <GridCell label="차시">
                <input className={INPUT} value={form.period} onChange={(e) => patch("period", e.target.value)} placeholder="4~5/12" />
              </GridCell>
              <GridCell label="교수학습모형">
                <input className={INPUT} value={form.teachingModel} onChange={(e) => patch("teachingModel", e.target.value)} />
              </GridCell>
              <GridCell label="템플릿">
                <input className={INPUT} value={form.templateSource} onChange={(e) => patch("templateSource", e.target.value)} placeholder="캔바, 웹앱 등" />
              </GridCell>
            </div>

            <div className="grid border-x border-b border-slate-200 sm:grid-cols-2">
              <GridCell label="이 차시의 주 탐구 단계 (1개)">
                <div className="flex flex-wrap gap-3">
                  {PRIMARY_STAGE_LABELS.map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-1.5 text-sm">
                      <input
                        type="radio"
                        name="primaryInquiryStage"
                        checked={primaryStage === key}
                        onChange={() => setPrimaryStage(key)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </GridCell>
              <GridCell label="주 사고도구 (1개)">
                <select
                  className={SELECT}
                  value={form.thinkingTool}
                  onChange={(e) => patch("thinkingTool", e.target.value)}
                >
                  <option value="">선택하세요</option>
                  {primaryToolOptions.map((t) => (
                    <option key={t.id} value={formatToolOption(t)}>
                      {formatToolOption(t)}
                    </option>
                  ))}
                </select>
              </GridCell>
              <GridCell label="성찰 단계 추가" className="sm:col-span-2">
                <label className="mb-2 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={useReflection}
                    onChange={(e) => setUseReflection(e.target.checked)}
                  />
                  성찰 단계에 사고도구를 <strong>1개 더</strong> 사용합니다
                </label>
                {useReflection && (
                  <select
                    className={SELECT}
                    value={form.reflectionThinkingTool}
                    onChange={(e) => patch("reflectionThinkingTool", e.target.value)}
                  >
                    <option value="">성찰 사고도구 선택</option>
                    {reflectionToolOptions.map((t) => (
                      <option key={t.id} value={formatToolOption(t)}>
                        {formatToolOption(t)}
                      </option>
                    ))}
                  </select>
                )}
              </GridCell>
            </div>

            <div className="grid border-x border-b border-slate-200 sm:grid-cols-2">
              <GridCell label="핵심 아이디어" className="sm:col-span-2">
                <textarea className={TEXTAREA} rows={2} value={form.coreIdea} onChange={(e) => patch("coreIdea", e.target.value)} />
              </GridCell>
              <GridCell label="학습주제" className="sm:col-span-2">
                <input className={INPUT} value={form.learningTopic} onChange={(e) => patch("learningTopic", e.target.value)} />
              </GridCell>
              <GridCell label="성취기준" className="sm:col-span-2">
                <textarea className={TEXTAREA} rows={2} value={form.achievementStandards} onChange={(e) => patch("achievementStandards", e.target.value)} />
              </GridCell>
            </div>

            <div className="grid border-x border-b border-slate-200 lg:grid-cols-2">
              <GridCell label="학습목표">
                <textarea className={TEXTAREA} rows={4} value={form.learningObjectives} onChange={(e) => patch("learningObjectives", e.target.value)} />
              </GridCell>
              <div className="grid border-l border-slate-200 lg:grid-cols-3">
                <GridCell label="지식·이해">
                  <textarea className={TEXTAREA} rows={4} value={form.inquiryKnowledge} onChange={(e) => patch("inquiryKnowledge", e.target.value)} />
                </GridCell>
                <GridCell label="과정·기능">
                  <textarea className={TEXTAREA} rows={4} value={form.inquiryProcess} onChange={(e) => patch("inquiryProcess", e.target.value)} />
                </GridCell>
                <GridCell label="가치·태도">
                  <textarea className={TEXTAREA} rows={4} value={form.inquiryValues} onChange={(e) => patch("inquiryValues", e.target.value)} />
                </GridCell>
              </div>
              <GridCell label="탐구 질문">
                <textarea className={TEXTAREA} rows={4} value={form.inquiryQuestions} onChange={(e) => patch("inquiryQuestions", e.target.value)} />
              </GridCell>
              <GridCell label="활동">
                <textarea className={TEXTAREA} rows={4} value={form.activities} onChange={(e) => patch("activities", e.target.value)} placeholder="활동1, 활동2..." />
              </GridCell>
            </div>

            <div className="grid border-x border-b border-slate-200 sm:grid-cols-2">
              <GridCell label="글쓰기 과제">
                <textarea className={TEXTAREA} rows={3} value={form.writingTask} onChange={(e) => patch("writingTask", e.target.value)} />
              </GridCell>
              <GridCell label="사고기법">
                <input className={INPUT} value={form.thinkingTechnique} onChange={(e) => patch("thinkingTechnique", e.target.value)} placeholder="탐구보고서 형식으로 쓰기" />
              </GridCell>
            </div>

            <p className="border-x border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              아래 [1~3단계] 생각 만들기·모으기·제시하기는 <strong>글쓰기 과정</strong>입니다. 사고도구와는 별개로
              기록합니다.
            </p>
            <div className="grid border-x border-b border-slate-200 lg:grid-cols-3">
              <GridCell label="[1단계] 생각 만들기">
                <textarea className={TEXTAREA} rows={3} value={form.thinkingStep1} onChange={(e) => patch("thinkingStep1", e.target.value)} />
              </GridCell>
              <GridCell label="[2단계] 생각 모으기">
                <textarea className={TEXTAREA} rows={3} value={form.thinkingStep2} onChange={(e) => patch("thinkingStep2", e.target.value)} />
              </GridCell>
              <GridCell label="[3단계] 제시하기">
                <textarea className={TEXTAREA} rows={3} value={form.thinkingStep3} onChange={(e) => patch("thinkingStep3", e.target.value)} />
              </GridCell>
            </div>

            <div className="grid border-x border-b border-slate-200 sm:grid-cols-2">
              <GridCell label="글쓰기 상황">
                <textarea className={TEXTAREA} rows={3} value={form.writingContext} onChange={(e) => patch("writingContext", e.target.value)} />
              </GridCell>
              <GridCell label="AI 활용 웹앱">
                <textarea className={TEXTAREA} rows={3} value={form.aiWebApp} onChange={(e) => patch("aiWebApp", e.target.value)} />
              </GridCell>
              <GridCell label="성찰하기" className="sm:col-span-2">
                <textarea className={TEXTAREA} rows={2} value={form.reflection} onChange={(e) => patch("reflection", e.target.value)} />
              </GridCell>
              <GridCell label="활용팁" className="sm:col-span-2">
                <textarea className={TEXTAREA} rows={3} value={form.usageTips} onChange={(e) => patch("usageTips", e.target.value)} />
              </GridCell>
            </div>

            <div className="border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">평가계획</div>
              <div className="grid sm:grid-cols-3">
                <GridCell label="[지식·이해]">
                  <textarea className={TEXTAREA} rows={3} value={form.evaluationKnowledge} onChange={(e) => patch("evaluationKnowledge", e.target.value)} />
                </GridCell>
                <GridCell label="[과정·기능]">
                  <textarea className={TEXTAREA} rows={3} value={form.evaluationProcess} onChange={(e) => patch("evaluationProcess", e.target.value)} />
                </GridCell>
                <GridCell label="[가치·태도]">
                  <textarea className={TEXTAREA} rows={3} value={form.evaluationValues} onChange={(e) => patch("evaluationValues", e.target.value)} />
                </GridCell>
              </div>
            </div>

            <div className="mt-4 border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2 print:bg-white">
                <span className="text-sm font-bold text-slate-700">교수·학습 과정</span>
                <button type="button" onClick={addRow} className="text-xs text-blue-600 hover:underline print:hidden">
                  + 행 추가
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-600">
                      <th className="p-2 w-24">단계(시간)</th>
                      <th className="p-2 w-32">학습내용</th>
                      <th className="p-2">교수·학습 활동</th>
                      <th className="w-36 p-2">자료·유의점</th>
                      <th className="w-12 p-2 print:hidden" />
                    </tr>
                  </thead>
                  <tbody>
                    {form.processRows.map((row, i) => (
                      <tr key={i} className="border-b border-slate-100 align-top print:break-inside-avoid">
                        <td className="p-2">
                          <input className={INPUT} value={row.stage} onChange={(e) => patchRow(i, "stage", e.target.value)} placeholder="도입" />
                          <input className={`${INPUT} mt-1`} value={row.time} onChange={(e) => patchRow(i, "time", e.target.value)} placeholder="10분" />
                        </td>
                        <td className="p-2">
                          <textarea className={TEXTAREA} rows={3} value={row.content} onChange={(e) => patchRow(i, "content", e.target.value)} />
                        </td>
                        <td className="p-2">
                          <textarea className={TEXTAREA} rows={3} value={row.activities} onChange={(e) => patchRow(i, "activities", e.target.value)} />
                        </td>
                        <td className="p-2">
                          <textarea className={TEXTAREA} rows={3} value={row.materials} onChange={(e) => patchRow(i, "materials", e.target.value)} />
                        </td>
                        <td className="p-2 print:hidden">
                          <button type="button" onClick={() => removeRow(i)} className="text-xs text-red-500 hover:underline">
                            삭제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
