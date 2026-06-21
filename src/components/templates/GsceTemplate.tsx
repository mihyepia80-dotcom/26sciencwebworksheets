"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TemplateProps } from "@/lib/types";
import { SectionBox, TextAreaField } from "@/components/common/Fields";
import { fieldValue as v } from "@/components/templates/utils";
import {
  addConnection,
  addCustomChip,
  createInitialBoardState,
  findChipZone,
  GSCE_ELABORATE_SECTIONS,
  moveChip,
  parseBoardState,
  removeConnection,
  serializeBoardState,
  type GsceBoardState,
  type GsceConnection,
  type GsceZone,
} from "@/lib/templates/gsce";

const ZONE_META: Record<GsceZone, { title: string; subtitle?: string; className: string }> = {
  pool: {
    title: "단어 보관함",
    subtitle: "아래 칩을 드래그하여 분류 영역으로 옮기세요",
    className: "border-slate-200 bg-slate-50",
  },
  cause: {
    title: "[원인 / 실험 조건]",
    className: "border-violet-200 bg-violet-50/60",
  },
  result: {
    title: "[결과 / 관찰 현상]",
    className: "border-sky-200 bg-sky-50/60",
  },
};

function Chip({
  chipId,
  text,
  zone,
  readOnly,
  connectMode,
  connectFrom,
  onDragStart,
  onClickConnect,
}: {
  chipId: string;
  text: string;
  zone: GsceZone;
  readOnly?: boolean;
  connectMode: boolean;
  connectFrom: string | null;
  onDragStart: (id: string) => void;
  onClickConnect: (id: string, zone: GsceZone) => void;
}) {
  const isSelected = connectFrom === chipId;
  return (
    <div
      data-chip-id={chipId}
      data-zone={zone}
      draggable={!readOnly && !connectMode}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", chipId);
        onDragStart(chipId);
      }}
      onClick={() => connectMode && onClickConnect(chipId, zone)}
      className={`cursor-grab select-none rounded-lg border px-3 py-1.5 text-sm shadow-sm active:cursor-grabbing ${
        isSelected
          ? "border-amber-400 bg-amber-100 ring-2 ring-amber-300"
          : zone === "pool"
            ? "border-blue-200 bg-white text-slate-800 hover:border-blue-300"
            : zone === "cause"
              ? "border-violet-300 bg-white text-violet-900 hover:border-violet-400"
              : "border-sky-300 bg-white text-sky-900 hover:border-sky-400"
      } ${connectMode ? "cursor-pointer" : ""}`}
    >
      {text}
    </div>
  );
}

function DropZone({
  zone,
  chipIds,
  chips,
  readOnly,
  connectMode,
  connectFrom,
  onDrop,
  onDragStart,
  onClickConnect,
}: {
  zone: GsceZone;
  chipIds: string[];
  chips: GsceBoardState["chips"];
  readOnly?: boolean;
  connectMode: boolean;
  connectFrom: string | null;
  onDrop: (zone: GsceZone, chipId: string) => void;
  onDragStart: (id: string) => void;
  onClickConnect: (id: string, zone: GsceZone) => void;
}) {
  const meta = ZONE_META[zone];

  return (
    <div
      className={`min-h-[120px] rounded-xl border-2 border-dashed p-3 ${meta.className}`}
      onDragOver={(e) => {
        if (!readOnly) e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (readOnly) return;
        const chipId = e.dataTransfer.getData("text/plain");
        if (chipId) onDrop(zone, chipId);
      }}
    >
      <p className="mb-1 text-xs font-bold text-slate-700">{meta.title}</p>
      {meta.subtitle && <p className="mb-2 text-[11px] text-slate-500">{meta.subtitle}</p>}
      <div className="flex min-h-[72px] flex-wrap gap-2">
        {chipIds.map((id) => {
          const chip = chips.find((c) => c.id === id);
          if (!chip) return null;
          return (
            <Chip
              key={id}
              chipId={id}
              text={chip.text}
              zone={zone}
              readOnly={readOnly}
              connectMode={connectMode}
              connectFrom={connectFrom}
              onDragStart={onDragStart}
              onClickConnect={onClickConnect}
            />
          );
        })}
        {chipIds.length === 0 && (
          <span className="self-center text-xs text-slate-400">
            {zone === "pool" ? "단어 칩이 여기에 표시됩니다" : "여기로 단어를 놓으세요"}
          </span>
        )}
      </div>
    </div>
  );
}

function ConnectionCanvas({
  connections,
  chips,
  boardRef,
  onRemove,
  readOnly,
}: {
  connections: GsceConnection[];
  chips: GsceBoardState["chips"];
  boardRef: React.RefObject<HTMLDivElement | null>;
  onRemove: (id: string) => void;
  readOnly?: boolean;
}) {
  const [lines, setLines] = useState<
    { id: string; x1: number; y1: number; x2: number; y2: number; label: string; midX: number; midY: number }[]
  >([]);

  const redraw = useCallback(() => {
    const board = boardRef.current;
    if (!board) return;
    const rect = board.getBoundingClientRect();
    const next = connections
      .map((conn) => {
        const fromEl = board.querySelector(`[data-chip-id="${conn.fromId}"]`);
        const toEl = board.querySelector(`[data-chip-id="${conn.toId}"]`);
        if (!fromEl || !toEl) return null;
        const fr = fromEl.getBoundingClientRect();
        const tr = toEl.getBoundingClientRect();
        const x1 = fr.left + fr.width / 2 - rect.left;
        const y1 = fr.top + fr.height / 2 - rect.top;
        const x2 = tr.left + tr.width / 2 - rect.left;
        const y2 = tr.top + tr.height / 2 - rect.top;
        return {
          id: conn.id,
          x1,
          y1,
          x2,
          y2,
          label: conn.label,
          midX: (x1 + x2) / 2,
          midY: (y1 + y2) / 2,
        };
      })
      .filter(Boolean) as typeof lines;
    setLines(next);
  }, [connections, boardRef]);

  useEffect(() => {
    redraw();
    window.addEventListener("resize", redraw);
    return () => window.removeEventListener("resize", redraw);
  }, [redraw, connections, chips]);

  if (connections.length === 0) return null;

  const chipLabel = (id: string) => chips.find((c) => c.id === id)?.text ?? id;

  return (
    <div className="relative mt-3">
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        {lines.map((l) => (
          <g key={l.id}>
            <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#6366f1" strokeWidth={2} markerEnd="url(#arrow)" />
            {l.label && (
              <text x={l.midX} y={l.midY - 6} textAnchor="middle" className="fill-indigo-700 text-[10px] font-medium">
                {l.label}
              </text>
            )}
          </g>
        ))}
        <defs>
          <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="#6366f1" />
          </marker>
        </defs>
      </svg>
      <ul className="space-y-1 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3 text-xs">
        {connections.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center gap-2 text-slate-700">
            <span className="font-medium text-violet-800">{chipLabel(c.fromId)}</span>
            <span className="text-indigo-500">→</span>
            <span className="font-medium text-sky-800">{chipLabel(c.toId)}</span>
            {c.label && <span className="text-slate-600">({c.label})</span>}
            {!readOnly && (
              <button
                type="button"
                className="ml-auto text-red-500 hover:underline print:hidden"
                onClick={() => onRemove(c.id)}
              >
                삭제
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GsceTemplate({ values, onChange, readOnly }: TemplateProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [board, setBoard] = useState<GsceBoardState>(() => parseBoardState(v(values, "gsceBoard")));
  const [newWord, setNewWord] = useState("");
  const [connectMode, setConnectMode] = useState(false);
  const [connectFrom, setConnectFrom] = useState<{ id: string; zone: GsceZone } | null>(null);
  const [relationInput, setRelationInput] = useState("");
  const [pendingConnect, setPendingConnect] = useState<{ fromId: string; toId: string } | null>(null);

  const syncBoard = useCallback(
    (next: GsceBoardState) => {
      setBoard(next);
      onChange("gsceBoard", serializeBoardState(next));
    },
    [onChange],
  );

  useEffect(() => {
    setBoard(parseBoardState(v(values, "gsceBoard")));
  }, [values.gsceBoard]);

  const handleDrop = (target: GsceZone, chipId: string) => {
    const current = findChipZone(board, chipId);
    if (current === target) return;
    syncBoard(moveChip(board, chipId, target));
  };

  const handleAddWord = () => {
    const next = addCustomChip(board, newWord);
    if (!next) return;
    syncBoard(next);
    setNewWord("");
  };

  const handleConnectClick = (chipId: string, zone: GsceZone) => {
    if (zone === "pool") return;
    if (!connectFrom) {
      setConnectFrom({ id: chipId, zone });
      return;
    }
    if (connectFrom.id === chipId) {
      setConnectFrom(null);
      return;
    }
    if (connectFrom.zone === zone) {
      setConnectFrom({ id: chipId, zone });
      return;
    }
    setPendingConnect({ fromId: connectFrom.id, toId: chipId });
    setRelationInput("");
  };

  const confirmConnection = () => {
    if (!pendingConnect) return;
    syncBoard(addConnection(board, pendingConnect.fromId, pendingConnect.toId, relationInput));
    setPendingConnect(null);
    setConnectFrom(null);
    setConnectMode(false);
    setRelationInput("");
  };

  return (
    <div className="gsce-worksheet space-y-6 print:space-y-4">
      <SectionBox title="생성·분류·연결·정교화 — 용해와 용액" color="blue">
        <p className="mb-4 text-sm leading-relaxed text-slate-600">
          오늘 수행한 실험 과정과 결과를 떠올리며, 단어를 생성하고 분류·연결한 뒤 과학적 문장으로 정교화해 봅시다.
        </p>

        {/* 1단계: 생성 */}
        <section className="mb-6 rounded-xl border border-blue-200 bg-blue-50/40 p-4">
          <h3 className="mb-1 text-base font-bold text-blue-900">1단계 — 생성하기</h3>
          <p className="mb-3 text-base text-slate-600">기본 과학 단어를 확인하고, 필요하면 새 포스트잇 단어를 추가하세요.</p>
          {!readOnly && (
            <div className="mb-3 flex flex-wrap gap-2 print:hidden">
              <input
                type="text"
                className="min-w-[160px] flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                placeholder="새 단어 입력"
                value={newWord}
                onChange={(e) => setNewWord(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddWord()}
              />
              <button
                type="button"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                onClick={handleAddWord}
              >
                새 포스트잇 추가
              </button>
            </div>
          )}
          <DropZone
            zone="pool"
            chipIds={board.pool}
            chips={board.chips}
            readOnly={readOnly}
            connectMode={false}
            connectFrom={null}
            onDrop={handleDrop}
            onDragStart={() => {}}
            onClickConnect={() => {}}
          />
        </section>

        {/* 2~3단계: 분류·연결 */}
        <section className="mb-6 rounded-xl border border-purple-200 bg-purple-50/30 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-purple-900">2~3단계 — 분류·연결하기</h3>
              <p className="mt-1 text-base text-slate-600">
                단어를 원인/조건과 결과/관찰 영역으로 드래그한 뒤, 연결 모드에서 두 칩을 클릭해 관계를 적으세요.
              </p>
            </div>
            {!readOnly && (
              <button
                type="button"
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold print:hidden ${
                  connectMode ? "bg-amber-500 text-white" : "border border-purple-300 bg-white text-purple-800"
                }`}
                onClick={() => {
                  setConnectMode((m) => !m);
                  setConnectFrom(null);
                }}
              >
                {connectMode ? "연결 모드 종료" : "연결 모드 시작"}
              </button>
            )}
          </div>

          <div ref={boardRef} className="relative grid gap-4 md:grid-cols-2">
            <DropZone
              zone="cause"
              chipIds={board.cause}
              chips={board.chips}
              readOnly={readOnly}
              connectMode={connectMode}
              connectFrom={connectFrom?.id ?? null}
              onDrop={handleDrop}
              onDragStart={() => {}}
              onClickConnect={handleConnectClick}
            />
            <DropZone
              zone="result"
              chipIds={board.result}
              chips={board.chips}
              readOnly={readOnly}
              connectMode={connectMode}
              connectFrom={connectFrom?.id ?? null}
              onDrop={handleDrop}
              onDragStart={() => {}}
              onClickConnect={handleConnectClick}
            />
          </div>

          <ConnectionCanvas
            connections={board.connections}
            chips={board.chips}
            boardRef={boardRef}
            readOnly={readOnly}
            onRemove={(id) => syncBoard(removeConnection(board, id))}
          />

          {pendingConnect && !readOnly && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 print:hidden">
              <p className="mb-2 text-base font-semibold text-amber-900">두 단어 사이의 관계를 입력하세요</p>
              <input
                type="text"
                className="ui-input mb-2"
                placeholder="예: 온도가 높을수록 더 많이 녹는다"
                value={relationInput}
                onChange={(e) => setRelationInput(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded bg-amber-600 px-3 py-1.5 text-xs text-white hover:bg-amber-700"
                  onClick={confirmConnection}
                >
                  연결 저장
                </button>
                <button
                  type="button"
                  className="rounded border border-slate-300 px-3 py-1.5 text-xs"
                  onClick={() => {
                    setPendingConnect(null);
                    setConnectFrom(null);
                  }}
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 4단계: 정교화 */}
        <section className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/30 p-4">
          <h3 className="mb-3 text-base font-bold text-emerald-900">4단계 — 정교화하기</h3>
          <div className="space-y-4">
            {GSCE_ELABORATE_SECTIONS.map(({ key, title, guide }) => (
              <TextAreaField
                key={key}
                label={title}
                value={v(values, key)}
                onChange={(val) => onChange(key, val)}
                rows={6}
                readOnly={readOnly}
                placeholder={guide}
              />
            ))}
          </div>
        </section>
      </SectionBox>
    </div>
  );
}
