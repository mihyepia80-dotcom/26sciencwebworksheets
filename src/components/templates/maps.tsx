"use client";

import type { TemplateProps } from "@/lib/types";
import { FRAYER_FIELD_GUIDES, FRAYER_NONEXAMPLE_CHIPS } from "@/lib/templates/ai-guides";
import { GuideChips, SectionBox, TextAreaField, TextField } from "@/components/common/Fields";

const v = (values: Record<string, string>, key: string) => values[key] ?? "";

/* ── Circle & Tree Map ── */
export function CircleTreeMapTemplate({ values, onChange, readOnly }: TemplateProps) {
  return (
    <SectionBox title="사고하기 — 써클맵, 트리맵" color="pink">
      <div className="space-y-6">
        <div>
          <h4 className="mb-2 text-sm font-bold">1. 써클맵</h4>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <div className="relative flex h-48 w-48 items-center justify-center rounded-full border-2 border-pink-200 bg-pink-50">
              <textarea
                className="absolute inset-4 resize-none rounded-full border border-pink-200 bg-white p-2 text-center text-xs focus:outline-none"
                style={{ width: "60%", height: "60%", borderRadius: "50%" }}
                value={v(values, "circleCenter")}
                disabled={readOnly}
                placeholder="핵심 주제"
                onChange={(e) => onChange("circleCenter", e.target.value)}
              />
              <textarea
                className="h-full w-full resize-none rounded-full bg-transparent p-6 text-xs focus:outline-none"
                value={v(values, "circleOuter")}
                disabled={readOnly}
                placeholder="관련 생각들"
                onChange={(e) => onChange("circleOuter", e.target.value)}
              />
            </div>
          </div>
        </div>
        <div>
          <h4 className="mb-2 text-sm font-bold">2. 트리맵</h4>
          <TextField label="루트 (주제)" value={v(values, "treeRoot")} onChange={(val) => onChange("treeRoot", val)} readOnly={readOnly} className="mb-3" />
          <div className="grid gap-2 md:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded border border-pink-200 bg-pink-50 p-2">
                <TextField label={`분류 ${n}`} value={v(values, `treeCat${n}`)} onChange={(val) => onChange(`treeCat${n}`, val)} readOnly={readOnly} className="mb-2" />
                <TextAreaField value={v(values, `treeDetail${n}`)} onChange={(val) => onChange(`treeDetail${n}`, val)} rows={3} readOnly={readOnly} placeholder="세부 예시" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionBox>
  );
}

/* ── Double Bubble Map ── */
export function DoubleBubbleMapTemplate({ values, onChange, readOnly }: TemplateProps) {
  const bubble = (key: string, ph: string, size = "h-20 w-20") => (
    <textarea
      className={`${size} resize-none rounded-full border-2 border-pink-200 bg-pink-50 p-2 text-center text-xs focus:outline-none`}
      value={v(values, key)}
      disabled={readOnly}
      placeholder={ph}
      onChange={(e) => onChange(key, e.target.value)}
    />
  );
  return (
    <SectionBox title="더블 버블 맵" color="pink">
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {bubble("topUnique1", "고유1")}{bubble("topUnique2", "고유2")}{bubble("topUnique3", "고유3")}
        </div>
        <div className="flex items-center gap-4">
          {bubble("subjectA", "대상 A", "h-24 w-24")}
          <div className="flex flex-col gap-2">
            {bubble("shared1", "공통1", "h-16 w-16")}
            {bubble("shared2", "공통2", "h-16 w-16")}
          </div>
          {bubble("subjectB", "대상 B", "h-24 w-24")}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {bubble("bottomUnique1", "고유1")}{bubble("bottomUnique2", "고유2")}{bubble("bottomUnique3", "고유3")}
        </div>
      </div>
    </SectionBox>
  );
}

/* ── Multi Flow Map ── */
export function MultiFlowMapTemplate({ values, onChange, readOnly }: TemplateProps) {
  const box = (key: string) => (
    <textarea
      className="min-h-[64px] w-full resize-y rounded border-2 border-pink-200 bg-pink-50 p-2 text-sm focus:outline-none"
      value={v(values, key)}
      disabled={readOnly}
      onChange={(e) => onChange(key, e.target.value)}
    />
  );
  return (
    <SectionBox title="멀티플로우맵" color="pink">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-8 text-xs font-bold [writing-mode:vertical-lr]">결과</span>
          <div className="grid flex-1 grid-cols-3 gap-2">{[1, 2, 3].map((n) => <div key={n}>{box(`effect${n}`)}</div>)}</div>
        </div>
        <div className="flex justify-center py-2">{box("event")}</div>
        <div className="flex items-center gap-2">
          <span className="w-8 text-xs font-bold [writing-mode:vertical-lr]">원인</span>
          <div className="grid flex-1 grid-cols-3 gap-2">{[1, 2, 3].map((n) => <div key={n}>{box(`cause${n}`)}</div>)}</div>
        </div>
      </div>
    </SectionBox>
  );
}

/* ── Bridge Map ── */
export function BridgeMapTemplate({ values, onChange, readOnly }: TemplateProps) {
  return (
    <SectionBox title="브릿지맵" color="pink">
      {[1, 2, 3].map((n) => (
        <div key={n} className="mb-4">
          <TextField label={`${n}. 유형`} value={v(values, `bridgeLabel${n}`)} onChange={(val) => onChange(`bridgeLabel${n}`, val)} readOnly={readOnly} className="mb-2" />
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <TextAreaField value={v(values, `bridgeTop${n}`)} onChange={(val) => onChange(`bridgeTop${n}`, val)} rows={2} readOnly={readOnly} placeholder="위" />
            <div className="text-2xl text-slate-400">⟷</div>
            <TextAreaField value={v(values, `bridgeBottom${n}`)} onChange={(val) => onChange(`bridgeBottom${n}`, val)} rows={2} readOnly={readOnly} placeholder="아래 (as)" />
          </div>
        </div>
      ))}
    </SectionBox>
  );
}

/* ── Window Map ── */
export function WindowMapTemplate({ values, onChange, readOnly }: TemplateProps) {
  const cell = (key: string) => (
    <textarea className="min-h-[60px] w-full resize-y border border-slate-300 bg-white p-1 text-xs focus:outline-none" value={v(values, key)} disabled={readOnly} onChange={(e) => onChange(key, e.target.value)} />
  );
  return (
    <SectionBox title="윈도우맵" color="pink">
      <div className="relative mx-auto max-w-lg">
        <div className="grid grid-cols-2 gap-0 border-2 border-slate-400">
          {["tl", "tr", "bl", "br"].map((k) => <div key={k}>{cell(k)}</div>)}
        </div>
        <div className="absolute left-1/2 top-1/2 z-10 w-16 -translate-x-1/2 -translate-y-1/2 border-2 border-slate-500 bg-white">{cell("center")}</div>
        <div className="mt-2 grid grid-cols-4 gap-1">
          {["left1", "left2", "right1", "right2"].map((k) => cell(k))}
        </div>
      </div>
    </SectionBox>
  );
}

/* ── SWOT ── */
export function SwotTemplate({ values, onChange, readOnly }: TemplateProps) {
  const q = [
    { key: "strength", label: "Strength (강점)" },
    { key: "weakness", label: "Weakness (약점)" },
    { key: "opportunity", label: "Opportunity (기회)" },
    { key: "threat", label: "Threat (위협)" },
  ];
  return (
    <SectionBox title="SWOT 기법" color="pink">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {q.map(({ key, label }) => (
          <TextAreaField key={key} label={label} value={v(values, key)} onChange={(val) => onChange(key, val)} rows={5} readOnly={readOnly} />
        ))}
      </div>
    </SectionBox>
  );
}

/* ── Frayer Model ── */
export function FrayerModelTemplate({ values, onChange, readOnly }: TemplateProps) {
  const quadrants = [
    { key: "definition", label: "1. 정의", pos: "top-left" },
    { key: "characteristics", label: "2. 특징", pos: "top-right" },
    { key: "examples", label: "3. 예시", pos: "bottom-left" },
    { key: "nonExamples", label: "4. 비예시", pos: "bottom-right" },
  ] as const;

  return (
    <SectionBox title="프레이어 모델 — 과학 개념 정의기" color="pink">
      <div className="mb-4 rounded-lg border border-violet-200 bg-violet-50 p-3 text-xs text-violet-900">
        <p className="font-bold">중심 개념</p>
        <p className="mt-1 text-violet-800">{FRAYER_FIELD_GUIDES.concept.student}</p>
        <p className="mt-2 text-violet-600">AI: {FRAYER_FIELD_GUIDES.concept.aiRole}</p>
      </div>
      <div className="relative grid grid-cols-2 gap-0 rounded border-2 border-orange-200 bg-orange-50">
        {quadrants.map(({ key, label }) => {
          const guide = FRAYER_FIELD_GUIDES[key];
          return (
            <div key={key} className="border border-orange-200 p-2 pt-6">
              <span className="text-xs font-bold text-slate-600">{label}</span>
              <p className="mt-1 text-[11px] leading-snug text-slate-500">{guide.student}</p>
              <p className="mt-1 text-[10px] text-violet-600">AI: {guide.aiRole}</p>
              <TextAreaField
                value={v(values, key)}
                onChange={(val) => onChange(key, val)}
                rows={4}
                readOnly={readOnly}
                className="mt-2"
              />
              {key === "nonExamples" && !readOnly && (
                <div className="mt-2">
                  <p className="mb-1 text-[10px] font-medium text-blue-700">AI 추천 칩</p>
                  <GuideChips
                    chips={FRAYER_NONEXAMPLE_CHIPS}
                    onSelect={(text) => {
                      const prev = v(values, key);
                      onChange(key, prev ? `${prev}\n${text}` : text);
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
        <div className="absolute left-1/2 top-1/2 z-10 w-28 -translate-x-1/2 -translate-y-1/2 rounded border-2 border-slate-400 bg-white p-2 text-center">
          <span className="text-xs font-bold">중심 개념</span>
          <textarea
            className="mt-1 w-full resize-none text-xs focus:outline-none"
            rows={2}
            placeholder="용해, 산화…"
            value={v(values, "concept")}
            disabled={readOnly}
            onChange={(e) => onChange("concept", e.target.value)}
          />
        </div>
      </div>
    </SectionBox>
  );
}

/* ── Hexagon Keywords ── */
function HexCell({ value, onChange, readOnly, className = "" }: { value: string; onChange: (v: string) => void; readOnly?: boolean; className?: string }) {
  return (
    <textarea
      className={`hex-cell resize-none border-2 border-slate-400 bg-white p-2 text-center text-xs focus:outline-none ${className}`}
      value={value}
      disabled={readOnly}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function HexagonKeywordsTemplate({ values, onChange, readOnly }: TemplateProps) {
  return (
    <SectionBox title="육각형 핵심 단어 연결하기" color="yellow">
      <div className="mx-auto max-w-md">
        <div className="grid grid-cols-3 gap-1 place-items-center">
          <HexCell value={v(values, "topLeft")} onChange={(val) => onChange("topLeft", val)} readOnly={readOnly} />
          <HexCell value={v(values, "top")} onChange={(val) => onChange("top", val)} readOnly={readOnly} />
          <HexCell value={v(values, "topRight")} onChange={(val) => onChange("topRight", val)} readOnly={readOnly} />
          <HexCell value={v(values, "bottomLeft")} onChange={(val) => onChange("bottomLeft", val)} readOnly={readOnly} />
          <HexCell value={v(values, "center")} onChange={(val) => onChange("center", val)} readOnly={readOnly} className="font-bold" />
          <HexCell value={v(values, "bottomRight")} onChange={(val) => onChange("bottomRight", val)} readOnly={readOnly} />
          <div />
          <HexCell value={v(values, "bottom")} onChange={(val) => onChange("bottom", val)} readOnly={readOnly} />
          <div />
        </div>
      </div>
      <p className="my-3 text-xs text-slate-500">알파벳 A~L: 두 단어 사이의 연결을 설명하세요</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {"ABCDEFGHIJKL".split("").map((letter, i) => (
          <TextAreaField key={letter} label={letter} value={v(values, `link_${letter}`)} onChange={(val) => onChange(`link_${letter}`, val)} rows={2} readOnly={readOnly} />
        ))}
      </div>
      <TextAreaField label="한 문장으로 정리" value={v(values, "summary")} onChange={(val) => onChange("summary", val)} rows={2} readOnly={readOnly} className="mt-3" />
    </SectionBox>
  );
}

/* ── Honeycomb Questions ── */
export function HoneycombQuestionsTemplate({ values, onChange, readOnly }: TemplateProps) {
  const keys = ["left1", "left2", "center", "right1", "right2"];
  return (
    <SectionBox title="벌집 질문" color="yellow">
      <div className="mx-auto grid max-w-sm grid-cols-3 gap-1 place-items-center">
        <textarea className="hex-cell col-start-1 row-start-1 border-2 border-slate-800 p-2 text-xs" value={v(values, "left1")} disabled={readOnly} onChange={(e) => onChange("left1", e.target.value)} />
        <textarea className="hex-cell col-start-1 row-start-2 border-2 border-slate-800 p-2 text-xs" value={v(values, "left2")} disabled={readOnly} onChange={(e) => onChange("left2", e.target.value)} />
        <textarea className="hex-cell col-start-2 row-span-2 row-start-1 self-center border-2 border-slate-800 p-2 text-xs" value={v(values, "center")} disabled={readOnly} onChange={(e) => onChange("center", e.target.value)} />
        <textarea className="hex-cell col-start-3 row-start-1 border-2 border-slate-800 p-2 text-xs" value={v(values, "right1")} disabled={readOnly} onChange={(e) => onChange("right1", e.target.value)} />
        <textarea className="hex-cell col-start-3 row-start-2 border-2 border-slate-800 p-2 text-xs" value={v(values, "right2")} disabled={readOnly} onChange={(e) => onChange("right2", e.target.value)} />
      </div>
      <TextAreaField label="종합" value={v(values, "summary")} onChange={(val) => onChange("summary", val)} rows={4} readOnly={readOnly} className="mt-4" />
    </SectionBox>
  );
}

/* ── Compass Points ── */
export function CompassPointsTemplate({ values, onChange, readOnly }: TemplateProps) {
  return (
    <SectionBox title="Compass Points" color="pink">
      <div className="relative mx-auto aspect-square max-w-md border-2 border-pink-300">
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
          <textarea className="resize-none border border-pink-200 p-2 text-xs focus:outline-none" placeholder="NEED TO KNOW" value={v(values, "needToKnow")} disabled={readOnly} onChange={(e) => onChange("needToKnow", e.target.value)} />
          <textarea className="resize-none border border-pink-200 p-2 text-xs focus:outline-none" placeholder="EXCITED" value={v(values, "excited")} disabled={readOnly} onChange={(e) => onChange("excited", e.target.value)} />
          <textarea className="resize-none border border-pink-200 p-2 text-xs focus:outline-none" placeholder="WORRIES" value={v(values, "worries")} disabled={readOnly} onChange={(e) => onChange("worries", e.target.value)} />
          <textarea className="resize-none border border-pink-200 p-2 text-xs focus:outline-none" placeholder="STEPS" value={v(values, "steps")} disabled={readOnly} onChange={(e) => onChange("steps", e.target.value)} />
        </div>
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-400" />
      </div>
      <TextAreaField label="추가 메모" value={v(values, "notes")} onChange={(val) => onChange("notes", val)} rows={3} readOnly={readOnly} className="mt-4" />
    </SectionBox>
  );
}

/* ── Mandalart ── */
const CENTER_RING = ["detail_0", "detail_1", "detail_2", "detail_3", "center", "detail_4", "detail_5", "detail_6", "detail_7"];
const BLOCK_DETAIL: Record<number, number> = { 0: 0, 1: 1, 2: 2, 3: 3, 5: 4, 6: 5, 7: 6, 8: 7 };

function MandalartBlock({
  blockIdx,
  values,
  onChange,
  readOnly,
}: {
  blockIdx: number;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  readOnly?: boolean;
}) {
  const isCenter = blockIdx === 4;
  const detailNum = BLOCK_DETAIL[blockIdx];

  const syncDetail = (detailKey: string, val: string) => {
    onChange(detailKey, val);
    const num = parseInt(detailKey.replace("detail_", ""), 10);
    const outerBlock = Object.entries(BLOCK_DETAIL).find(([, v]) => v === num)?.[0];
    if (outerBlock !== undefined) onChange(`block_${outerBlock}_0`, val);
  };

  return (
    <div className="grid grid-cols-3 gap-px bg-slate-300">
      {Array.from({ length: 9 }, (_, i) => {
        const isMid = i === 4;
        let key: string;
        let val: string;
        let disabled = readOnly;

        if (isCenter) {
          key = CENTER_RING[i];
          val = v(values, key);
          if (isMid) {
            disabled = readOnly;
          }
        } else if (isMid) {
          key = `detail_${detailNum}`;
          val = v(values, key);
          disabled = true;
        } else {
          key = `block_${blockIdx}_${i}`;
          val = v(values, key);
        }

        return (
          <textarea
            key={i}
            className={`min-h-[32px] resize-none border-0 p-0.5 text-[9px] focus:outline-none sm:min-h-[40px] sm:text-[10px] ${isMid ? "bg-slate-800 font-bold text-white" : "bg-white"}`}
            value={val}
            disabled={disabled}
            placeholder={isMid ? (isCenter ? "주제" : "세부") : ""}
            onChange={(e) => {
              if (isCenter && key.startsWith("detail_")) syncDetail(key, e.target.value);
              else onChange(key, e.target.value);
            }}
          />
        );
      })}
    </div>
  );
}

export function MandalartTemplate({ values, onChange, readOnly }: TemplateProps) {
  return (
    <SectionBox title="만다라트" color="pink">
      <div className="overflow-x-auto">
        <div className="mx-auto grid w-max grid-cols-3 gap-1">
          {Array.from({ length: 9 }, (_, idx) => (
            <MandalartBlock key={idx} blockIdx={idx} values={values} onChange={onChange} readOnly={readOnly} />
          ))}
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-500">중앙 3×3의 세부 주제가 바깥 3×3 중심에 자동 연결됩니다.</p>
    </SectionBox>
  );
}
