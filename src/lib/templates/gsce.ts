export const DEFAULT_GSCE_WORDS = [
  "용질의 종류",
  "물의 온도",
  "변인 통제",
  "설탕",
  "백반",
  "50 mL",
  "따뜻한 물",
  "차가운 물",
  "용해량",
] as const;

export interface GsceChip {
  id: string;
  text: string;
  custom: boolean;
}

export interface GsceConnection {
  id: string;
  fromId: string;
  toId: string;
  label: string;
}

export type GsceZone = "pool" | "cause" | "result";

export interface GsceBoardState {
  chips: GsceChip[];
  pool: string[];
  cause: string[];
  result: string[];
  connections: GsceConnection[];
}

export function createInitialBoardState(): GsceBoardState {
  const chips: GsceChip[] = DEFAULT_GSCE_WORDS.map((text, i) => ({
    id: `default-${i}`,
    text,
    custom: false,
  }));
  return {
    chips,
    pool: chips.map((c) => c.id),
    cause: [],
    result: [],
    connections: [],
  };
}

export function parseBoardState(raw: string | undefined): GsceBoardState {
  if (!raw?.trim()) return createInitialBoardState();
  try {
    const parsed = JSON.parse(raw) as GsceBoardState;
    if (!Array.isArray(parsed.chips) || !Array.isArray(parsed.pool)) {
      return createInitialBoardState();
    }
    return parsed;
  } catch {
    return createInitialBoardState();
  }
}

export function serializeBoardState(state: GsceBoardState): string {
  return JSON.stringify(state);
}

export function findChipZone(state: GsceBoardState, chipId: string): GsceZone | null {
  if (state.pool.includes(chipId)) return "pool";
  if (state.cause.includes(chipId)) return "cause";
  if (state.result.includes(chipId)) return "result";
  return null;
}

export function moveChip(state: GsceBoardState, chipId: string, target: GsceZone): GsceBoardState {
  const next: GsceBoardState = {
    ...state,
    pool: state.pool.filter((id) => id !== chipId),
    cause: state.cause.filter((id) => id !== chipId),
    result: state.result.filter((id) => id !== chipId),
    connections: state.connections.filter((c) => c.fromId !== chipId && c.toId !== chipId),
  };
  next[target] = [...next[target], chipId];
  return next;
}

export function addCustomChip(state: GsceBoardState, text: string): GsceBoardState | null {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const id = `custom-${Date.now()}`;
  const chip: GsceChip = { id, text: trimmed, custom: true };
  return {
    ...state,
    chips: [...state.chips, chip],
    pool: [...state.pool, id],
  };
}

export function addConnection(
  state: GsceBoardState,
  fromId: string,
  toId: string,
  label: string,
): GsceBoardState {
  const id = `conn-${Date.now()}`;
  return {
    ...state,
    connections: [...state.connections, { id, fromId, toId, label: label.trim() }],
  };
}

export function removeConnection(state: GsceBoardState, connectionId: string): GsceBoardState {
  return {
    ...state,
    connections: state.connections.filter((c) => c.id !== connectionId),
  };
}

export const GSCE_ELABORATE_SECTIONS = [
  {
    key: "elaborateA",
    title: "메모 A — 용질의 종류 측면",
    guide: "설탕과 소금(백반) 실험 결과를 비교하며, 용질의 종류가 용해량에 미치는 영향을 서술하세요.",
  },
  {
    key: "elaborateB",
    title: "메모 B — 물의 온도 측면",
    guide: "따뜻한 물과 차가운 물 실험 결과를 바탕으로, 물의 온도가 용해량에 미치는 영향을 서술하세요.",
  },
  {
    key: "elaborateC",
    title: "메모 C — 변인 통제 측면",
    guide: "공정한 실험을 위해 같게 유지한 조건과 달리 한 조건을 명확히 구분하여 서술하세요.",
  },
] as const;

export const GSCE_CHECKLIST = [
  { key: "checkTerms", label: "용질, 용매, 용해, 용액 등 과학적 용어를 정확하게 사용하였는가?" },
  { key: "checkVariable", label: "다르게 한 조건과 같게 한 조건이 명확히 드러나게 썼는가?" },
  { key: "checkCausal", label: "문장이 \"~이다\", \"~때문이다\"와 같이 논리적인 인과 관계를 갖추고 있는가?" },
] as const;
