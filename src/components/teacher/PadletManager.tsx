"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { TeacherLoginPanel } from "@/components/TeacherLoginPanel";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  createPadletBoard,
  createPadletPost,
  fetchPadletStatus,
  getPadletBoardStatus,
} from "@/lib/padlet/client";
import {
  buildColumnLabels,
  PADLET_SANDBOX_OPTIONS,
  type PadletBulletinColumnMode,
  type PadletSandboxType,
} from "@/lib/padlet/presets";
import { TeacherPadletBoardLink } from "@/components/teacher/TeacherPadletBoardLink";
import { TeacherPadletPublishMatrix } from "@/components/teacher/TeacherPadletPublishMatrix";
import type { PadletBoardSummary, PadletCreateBoardRequest } from "@/lib/padlet/types";

const INPUT = "w-full rounded border border-slate-200 px-3 py-2 text-sm";

type CreateMode = PadletCreateBoardRequest["mode"];

function BoardCard({
  board,
  columnLabels,
}: {
  board: PadletBoardSummary;
  columnLabels?: string[];
}) {
  return (
    <article className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
      <h3 className="font-semibold text-emerald-950">{board.title || "제목 없음"}</h3>
      {board.description && <p className="mt-1 text-sm text-emerald-900/90">{board.description}</p>}
      <dl className="mt-3 space-y-1 text-xs text-slate-600">
        <div>
          <dt className="inline font-semibold">ID: </dt>
          <dd className="inline font-mono">{board.id}</dd>
        </div>
      </dl>
      {columnLabels && columnLabels.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold text-emerald-800">컬럼 ({columnLabels.length}개)</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {columnLabels.map((label) => (
              <span
                key={label}
                className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-emerald-900 ring-1 ring-emerald-200"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {board.webUrl && (
          <a
            href={board.webUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            패들렛 열기
          </a>
        )}
        {board.qrCodeUrl && (
          <a
            href={board.qrCodeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-emerald-300 px-3 py-2 text-sm text-emerald-800 hover:bg-emerald-100"
          >
            QR 코드
          </a>
        )}
      </div>
    </article>
  );
}

export function PadletManager() {
  const { user, role, loading: authLoading } = useAuth();
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [mode, setMode] = useState<CreateMode>("sandbox");
  const [sandboxType, setSandboxType] = useState<PadletSandboxType>("wall");
  const [columnMode, setColumnMode] = useState<PadletBulletinColumnMode>("groups");
  const [topic, setTopic] = useState("");
  const [instructions, setInstructions] = useState("");
  const [creating, setCreating] = useState(false);
  const [polling, setPolling] = useState(false);
  const [statusKey, setStatusKey] = useState<string | null>(null);
  const [board, setBoard] = useState<PadletBoardSummary | null>(null);
  const [columnLabels, setColumnLabels] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [postBoardId, setPostBoardId] = useState("");
  const [postSubject, setPostSubject] = useState("");
  const [postBody, setPostBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [boardScope, setBoardScope] = useState({
    grade: 5,
    classNo: 3,
    unitId: "dissolution-solution",
    periods: [1, 2, 3, 4, 5, 6, 7, 8],
    title: "용해와 용액 · 5학년 3반",
  });
  const [boardDocId, setBoardDocId] = useState<string | null>(null);
  const [matrixToken, setMatrixToken] = useState<string | null>(null);

  const previewColumns = useMemo(() => buildColumnLabels(columnMode), [columnMode]);

  const loadStatus = useCallback(async () => {
    if (!user || role !== "teacher") return;
    try {
      const token = await user.getIdToken();
      const result = await fetchPadletStatus(token);
      setConfigured(result.configured);
    } catch (e: unknown) {
      setConfigured(false);
      setError(e instanceof Error ? e.message : "Padlet 상태 확인 실패");
    }
  }, [user, role]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const handleCreate = async () => {
    if (!user || role !== "teacher") return;
    setCreating(true);
    setError("");
    setMessage("");
    setBoard(null);
    setStatusKey(null);
    setColumnLabels([]);

    try {
      const token = await user.getIdToken();
      const input: PadletCreateBoardRequest = { mode, wait: true, seedColumns: true };

      if (mode === "sandbox") {
        input.sandboxType = sandboxType;
      }
      if (mode === "bulletin") {
        input.topic = topic.trim() || "자유 주제";
        input.columnMode = columnMode;
        input.registerBoard = columnMode === "numbers";
        input.scope = {
          grade: boardScope.grade,
          classNo: boardScope.classNo,
          unitId: boardScope.unitId,
          periods: boardScope.periods,
          title: boardScope.title,
        };
      }
      if (mode === "custom") {
        input.instructions = instructions.trim();
        input.seedColumns = false;
      }

      const sandboxLabel = PADLET_SANDBOX_OPTIONS.find((o) => o.id === sandboxType)?.label ?? "";
      setMessage(
        mode === "sandbox"
          ? `「${sandboxLabel}」 샌드박스를 생성하는 중입니다. (30초~2분)`
          : mode === "bulletin"
            ? `컬럼 ${previewColumns.length}개(파스텔 톤) 게시판을 생성하는 중입니다. (30초~2분)`
            : "패들렛을 생성하는 중입니다. (30초~2분)",
      );

      const result = await createPadletBoard(token, input);
      setStatusKey(result.statusKey);

      if (result.board) {
        setBoard(result.board);
        setPostBoardId(result.board.id);
        if (result.columnLabels?.length) setColumnLabels(result.columnLabels);
        if (result.boardDocId) {
          setBoardDocId(result.boardDocId);
          setMatrixToken(token);
        }
        const colMsg =
          result.columnsApplied != null && result.columnsApplied > 0
            ? ` 컬럼 ${result.columnsApplied}개에 안내 카드를 반영했습니다.`
            : "";
        const regMsg = result.boardDocId
          ? ` Firestore 레지스트리 저장됨 (columnMap ${result.columnMapSize ?? 0}건).`
          : "";
        setMessage(`패들렛이 생성되었습니다.${colMsg}${regMsg}`);
      } else if (result.status === "in_progress") {
        setMessage("생성이 진행 중입니다. 아래에서 상태를 확인하세요.");
      } else if (result.status === "failed") {
        setError("패들렛 AI 생성에 실패했습니다.");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "패들렛 생성 실패");
    } finally {
      setCreating(false);
    }
  };

  const handlePollStatus = async () => {
    if (!user || !statusKey) return;
    setPolling(true);
    setError("");
    try {
      const token = await user.getIdToken();
      const result = await getPadletBoardStatus(token, statusKey);
      if (result.board) {
        setBoard(result.board);
        setPostBoardId(result.board.id);
        setMessage("패들렛 생성이 완료되었습니다.");
      } else if (result.status === "in_progress") {
        setMessage("아직 생성 중입니다. 잠시 후 다시 확인해 주세요.");
      } else if (result.status === "failed") {
        setError("패들렛 AI 생성에 실패했습니다.");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "상태 조회 실패");
    } finally {
      setPolling(false);
    }
  };

  const handleCreatePost = async () => {
    if (!user || !postBoardId.trim()) {
      setError("게시판 ID를 입력하세요.");
      return;
    }
    if (!postSubject.trim() && !postBody.trim()) {
      setError("제목 또는 본문을 입력하세요.");
      return;
    }

    setPosting(true);
    setError("");
    setMessage("");
    try {
      const token = await user.getIdToken();
      const post = await createPadletPost(token, postBoardId.trim(), {
        subject: postSubject.trim() || undefined,
        body: postBody.trim() || undefined,
        color: "blue",
      });
      setMessage(`게시글을 작성했습니다. (ID: ${post.id})`);
      setPostSubject("");
      setPostBody("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "게시글 작성 실패");
    } finally {
      setPosting(false);
    }
  };

  if (!isFirebaseConfigured()) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-xl font-bold text-slate-900">Firebase 설정 필요</h1>
        <p className="mt-3 text-sm text-slate-600">Vercel 환경 변수에 Firebase 설정을 입력하세요.</p>
      </div>
    );
  }

  if (authLoading) {
    return <p className="py-16 text-center text-sm text-slate-500">로딩 중...</p>;
  }

  if (!user || role !== "teacher") {
    return (
      <div>
        <Link href="/login" className="text-sm text-blue-600 hover:underline">
          ← 로그인
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">교사 로그인</h1>
        <div className="mt-8">
          <TeacherLoginPanel />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link href="/teacher" className="ui-link text-emerald-700">
        ← 교사 대시보드
      </Link>

      <header className="ui-panel-soft mt-6">
        <p className="text-base font-semibold uppercase tracking-wide text-emerald-600">교사 · Padlet</p>
        <h1 className="ui-page-title mt-2 text-emerald-950">패들렛 생성</h1>
        <p className="ui-page-desc text-slate-700">
          샌드박스 유형을 고르거나, 컬럼형 게시판(모둠·번호)을 파스텔 톤으로 자동 생성합니다.
        </p>
      </header>

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
            configured ? "bg-emerald-100 text-emerald-800" : configured === false ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
          }`}
        >
          {configured === null ? "API 상태 확인 중…" : configured ? "Padlet API 연결됨" : "PADLET_API_KEY 미설정"}
        </span>
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">1. 만들기 방식</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {(
            [
              { id: "sandbox" as const, label: "샌드박스", desc: "유형별 테스트 보드" },
              { id: "bulletin" as const, label: "게시판", desc: "컬럼형 · 모둠/번호" },
              { id: "custom" as const, label: "맞춤", desc: "직접 지시문" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              className={`rounded-xl border p-4 text-left transition ${
                mode === item.id
                  ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200"
                  : "border-slate-200 hover:border-emerald-200"
              }`}
            >
              <p className="font-semibold text-slate-900">{item.label}</p>
              <p className="mt-1 text-xs text-slate-600">{item.desc}</p>
            </button>
          ))}
        </div>

        {mode === "sandbox" && (
          <div className="mt-6">
            <h3 className="text-sm font-bold text-slate-800">샌드박스 유형 선택</h3>
            <p className="mt-1 text-xs text-slate-600">Padlet 레이아웃 종류를 고른 뒤 생성하세요. 기본 색상은 파스텔 톤입니다.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {PADLET_SANDBOX_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSandboxType(option.id)}
                  className={`rounded-lg border p-3 text-left text-sm transition ${
                    sandboxType === option.id
                      ? "border-violet-400 bg-violet-50 ring-2 ring-violet-200"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <p className="font-semibold text-slate-900">{option.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">{option.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === "bulletin" && (
          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">게시판 주제</span>
              <input
                className={`${INPUT} mt-1`}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="예: 용해와 용액 탐구 아이디어"
              />
            </label>

            <div>
              <span className="text-sm font-medium text-slate-700">컬럼 자동 생성</span>
              <p className="mt-1 text-xs text-slate-500">컬럼(Shelf) 형식 · 파스텔 톤 기본 적용</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setColumnMode("groups")}
                  className={`rounded-lg border p-3 text-left text-sm ${
                    columnMode === "groups"
                      ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200"
                      : "border-slate-200"
                  }`}
                >
                  <p className="font-semibold">1모둠 ~ 6모둠</p>
                  <p className="mt-1 text-xs text-slate-600">6개 컬럼 · 모둠 활동용</p>
                </button>
                <button
                  type="button"
                  onClick={() => setColumnMode("numbers")}
                  className={`rounded-lg border p-3 text-left text-sm ${
                    columnMode === "numbers"
                      ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200"
                      : "border-slate-200"
                  }`}
                >
                  <p className="font-semibold">1번 ~ 25번</p>
                  <p className="mt-1 text-xs text-slate-600">25개 컬럼 · 번호별 게시</p>
                </button>
              </div>
            </div>

            <div className="rounded-lg bg-gradient-to-r from-pink-50 via-sky-50 to-violet-50 p-3 ring-1 ring-slate-200">
              <p className="text-xs font-semibold text-slate-700">
                컬럼 미리보기 ({previewColumns.length}개)
              </p>
              <div className="mt-2 flex max-h-24 flex-wrap gap-1 overflow-y-auto">
                {previewColumns.map((label) => (
                  <span
                    key={label}
                    className="rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-slate-700 shadow-sm"
                  >
                    {label}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                생성 후 각 컬럼에 안내 카드가 자동으로 추가됩니다.
              </p>
            </div>

            {columnMode === "numbers" && (
              <TeacherPadletBoardLink
                grade={boardScope.grade}
                classNo={boardScope.classNo}
                unitId={boardScope.unitId}
                periods={boardScope.periods}
                title={boardScope.title}
                onChange={(patch) => setBoardScope((prev) => ({ ...prev, ...patch }))}
              />
            )}
          </div>
        )}

        {mode === "custom" && (
          <label className="mt-6 block">
            <span className="text-sm font-medium text-slate-700">생성 지시문</span>
            <textarea
              className={`${INPUT} mt-1 min-h-[100px]`}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Padlet AI에 전달할 영문/한글 지시문"
            />
          </label>
        )}

        <button
          type="button"
          disabled={creating || !configured}
          onClick={() => void handleCreate()}
          className="mt-6 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {creating ? "생성 중… (최대 2분)" : "패들렛 생성"}
        </button>
      </section>

      {message && (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{message}</p>
      )}
      {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {statusKey && !board && (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <button
            type="button"
            disabled={polling}
            onClick={() => void handlePollStatus()}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50"
          >
            {polling ? "조회 중…" : "생성 상태 다시 확인"}
          </button>
        </section>
      )}

      {board && (
        <section className="mt-6">
          <h2 className="text-lg font-bold text-slate-900">생성된 패들렛</h2>
          <div className="mt-3">
            <BoardCard board={board} columnLabels={columnLabels.length ? columnLabels : undefined} />
          </div>
        </section>
      )}

      {boardDocId && matrixToken && (
        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">2. 게시 현황 (번호×차시)</h2>
          <div className="mt-4">
            <TeacherPadletPublishMatrix boardDocId={boardDocId} idToken={matrixToken} />
          </div>
        </section>
      )}

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">게시글 추가 (선택)</h2>
        <label className="mt-4 block">
          <span className="text-sm font-medium text-slate-700">게시판 ID</span>
          <input className={`${INPUT} mt-1 font-mono text-xs`} value={postBoardId} onChange={(e) => setPostBoardId(e.target.value)} />
        </label>
        <label className="mt-3 block">
          <span className="text-sm font-medium text-slate-700">제목</span>
          <input className={`${INPUT} mt-1`} value={postSubject} onChange={(e) => setPostSubject(e.target.value)} />
        </label>
        <label className="mt-3 block">
          <span className="text-sm font-medium text-slate-700">본문</span>
          <textarea className={`${INPUT} mt-1 min-h-[80px]`} value={postBody} onChange={(e) => setPostBody(e.target.value)} />
        </label>
        <button
          type="button"
          disabled={posting || !configured}
          onClick={() => void handleCreatePost()}
          className="mt-4 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
        >
          {posting ? "작성 중…" : "게시글 작성"}
        </button>
      </section>
    </div>
  );
}
