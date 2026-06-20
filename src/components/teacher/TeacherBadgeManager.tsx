"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { BadgeCircle, ShirtBadgeIcon } from "@/components/badges/BadgeIcon";
import {
  awardStudentBadge,
  deleteBadgeDefinition,
  listAllBadgeDefinitionsForTeacher,
  listAllStudentBadges,
  revokeStudentBadge,
  saveBadgeDefinition,
  seedDefaultBadgeDefinitions,
} from "@/lib/firebase/badges";
import { getFirebaseErrorMessage, listSubmissions } from "@/lib/firebase";
import type { WorksheetSubmission } from "@/lib/firebase/submissions";
import {
  DEFAULT_BADGE_DEFINITIONS,
  type BadgeDefinition,
  type BadgeIconKey,
  type StudentBadgeAward,
} from "@/lib/badges/types";

const ICON_OPTIONS: { key: BadgeIconKey; label: string }[] = [
  { key: "shirt-green", label: "초록 상의" },
  { key: "shirt-blue", label: "파랑 상의" },
  { key: "shirt-purple", label: "보라 상의" },
  { key: "shirt-amber", label: "노랑 상의" },
  { key: "shirt-rose", label: "분홍 상의" },
];

const INPUT = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";

function studentKey(sub: WorksheetSubmission): string {
  return sub.studentUid;
}

function studentDisplay(sub: WorksheetSubmission): string {
  const m = sub.meta;
  return `${m.grade}학년 ${m.classNo}반 ${m.studentNo}번 ${m.studentName}`;
}

export function TeacherBadgeManager() {
  const { user, role } = useAuth();
  const [definitions, setDefinitions] = useState<BadgeDefinition[]>([]);
  const [awards, setAwards] = useState<StudentBadgeAward[]>([]);
  const [submissions, setSubmissions] = useState<WorksheetSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [selectedStudentUid, setSelectedStudentUid] = useState("");
  const [selectedBadgeId, setSelectedBadgeId] = useState("");
  const [awardNote, setAwardNote] = useState("");
  const [awarding, setAwarding] = useState(false);

  const [editLabel, setEditLabel] = useState("");
  const [editIcon, setEditIcon] = useState<BadgeIconKey>("shirt-green");
  const [editOrder, setEditOrder] = useState(10);
  const [savingDef, setSavingDef] = useState(false);

  const loadAll = useCallback(async () => {
    if (!user || role !== "teacher") return;
    setLoading(true);
    setError("");
    try {
      const [defs, awardList, subs] = await Promise.all([
        listAllBadgeDefinitionsForTeacher(),
        listAllStudentBadges(),
        listSubmissions(200),
      ]);
      setDefinitions(defs.length ? defs : [...DEFAULT_BADGE_DEFINITIONS]);
      setAwards(awardList);
      setSubmissions(subs);
      if (!selectedBadgeId && defs[0]?.id) setSelectedBadgeId(defs[0].id!);
    } catch (e: unknown) {
      setError(getFirebaseErrorMessage(e, "불러오기 실패"));
    } finally {
      setLoading(false);
    }
  }, [user, role, selectedBadgeId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const uniqueStudents = [...new Map(submissions.map((s) => [studentKey(s), s])).values()].sort(
    (a, b) =>
      `${a.meta.grade}${a.meta.classNo}${a.meta.studentNo}`.localeCompare(
        `${b.meta.grade}${b.meta.classNo}${b.meta.studentNo}`,
      ),
  );

  const handleSeed = async () => {
    if (!user) return;
    setError("");
    try {
      await seedDefaultBadgeDefinitions(user.uid);
      setMessage("기본 칭찬 배지 3종을 등록했습니다.");
      await loadAll();
    } catch (e: unknown) {
      setError(getFirebaseErrorMessage(e, "기본 배지 등록 실패"));
    }
  };

  const handleAward = async () => {
    if (!user || !selectedStudentUid || !selectedBadgeId) {
      setError("학생과 배지를 선택하세요.");
      return;
    }
    const student = uniqueStudents.find((s) => s.studentUid === selectedStudentUid);
    const badge = definitions.find((d) => d.id === selectedBadgeId);
    if (!student || !badge) return;

    setAwarding(true);
    setError("");
    try {
      await awardStudentBadge({
        studentUid: student.studentUid,
        studentName: student.meta.studentName,
        grade: student.meta.grade,
        classNo: student.meta.classNo,
        studentNo: student.meta.studentNo,
        badgeId: badge.id ?? selectedBadgeId,
        badgeLabel: badge.label,
        iconKey: badge.iconKey,
        awardedBy: user.uid,
        note: awardNote.trim() || undefined,
      });
      setMessage(`${studentDisplay(student)}에게 「${badge.label}」 배지를 부여했습니다.`);
      setAwardNote("");
      await loadAll();
    } catch (e: unknown) {
      setError(getFirebaseErrorMessage(e, "배지 부여 실패"));
    } finally {
      setAwarding(false);
    }
  };

  const handleAddDefinition = async () => {
    if (!user || !editLabel.trim()) {
      setError("배지 이름을 입력하세요.");
      return;
    }
    setSavingDef(true);
    setError("");
    try {
      await saveBadgeDefinition(
        { label: editLabel.trim(), iconKey: editIcon, active: true, order: editOrder },
        user.uid,
      );
      setMessage("새 칭찬 배지를 추가했습니다.");
      setEditLabel("");
      await loadAll();
    } catch (e: unknown) {
      setError(getFirebaseErrorMessage(e, "배지 저장 실패"));
    } finally {
      setSavingDef(false);
    }
  };

  const handleUpdateDefinition = async (def: BadgeDefinition) => {
    if (!user || !def.id) return;
    const label = window.prompt("배지 이름", def.label);
    if (label === null || !label.trim()) return;
    try {
      await saveBadgeDefinition({ ...def, label: label.trim() }, user.uid);
      setMessage("배지를 수정했습니다.");
      await loadAll();
    } catch (e: unknown) {
      setError(getFirebaseErrorMessage(e, "수정 실패"));
    }
  };

  const handleDeleteDefinition = async (def: BadgeDefinition) => {
    if (!def.id || def.isDefault) {
      setError("기본 배지는 삭제할 수 없습니다. 비활성화만 가능합니다.");
      return;
    }
    if (!window.confirm(`「${def.label}」 배지 정의를 삭제할까요?`)) return;
    try {
      await deleteBadgeDefinition(def.id);
      setMessage("배지를 삭제했습니다.");
      await loadAll();
    } catch (e: unknown) {
      setError(getFirebaseErrorMessage(e, "삭제 실패"));
    }
  };

  const handleRevoke = async (award: StudentBadgeAward) => {
    if (!award.id) return;
    if (!window.confirm(`${award.studentName}의 「${award.badgeLabel}」 배지를 회수할까요?`)) return;
    try {
      await revokeStudentBadge(award.id);
      setMessage("배지를 회수했습니다.");
      await loadAll();
    } catch (e: unknown) {
      setError(getFirebaseErrorMessage(e, "회수 실패"));
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
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void handleSeed()}
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900 hover:bg-amber-100"
        >
          기본 배지 3종 등록
        </button>
      </div>

      {loading && <p className="text-sm text-slate-500">불러오는 중…</p>}
      {message && <p className="text-sm text-emerald-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-800">칭찬 배지 부여</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">학생 선택</label>
            <select
              className={INPUT}
              value={selectedStudentUid}
              onChange={(e) => setSelectedStudentUid(e.target.value)}
            >
              <option value="">— 선택 —</option>
              {uniqueStudents.map((s) => (
                <option key={s.studentUid} value={s.studentUid}>
                  {studentDisplay(s)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">배지 선택</label>
            <select
              className={INPUT}
              value={selectedBadgeId}
              onChange={(e) => setSelectedBadgeId(e.target.value)}
            >
              {definitions.filter((d) => d.active).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium text-slate-500">메모 (선택)</label>
          <input
            type="text"
            className={INPUT}
            value={awardNote}
            placeholder="예: CSI 글쓰기에서 특히 성실했어요"
            onChange={(e) => setAwardNote(e.target.value)}
          />
        </div>
        {selectedBadgeId && (
          <div className="mt-4">
            {definitions
              .filter((d) => d.id === selectedBadgeId)
              .map((d) => (
                <BadgeCircle key={d.id} iconKey={d.iconKey} label={d.label} size="md" />
              ))}
          </div>
        )}
        <button
          type="button"
          disabled={awarding}
          onClick={() => void handleAward()}
          className="mt-4 rounded-lg bg-amber-600 px-5 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {awarding ? "부여 중…" : "배지 부여하기"}
        </button>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-800">배지 종류 관리</h2>
        <div className="mb-6 flex flex-wrap gap-4">
          {definitions.map((d) => (
            <div key={d.id} className="relative">
              <BadgeCircle iconKey={d.iconKey} label={d.label} size="sm" />
              <div className="mt-2 flex gap-1">
                <button
                  type="button"
                  className="text-[10px] text-blue-600 hover:underline"
                  onClick={() => void handleUpdateDefinition(d)}
                >
                  수정
                </button>
                {!d.isDefault && (
                  <button
                    type="button"
                    className="text-[10px] text-red-600 hover:underline"
                    onClick={() => void handleDeleteDefinition(d)}
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">새 배지 추가</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            type="text"
            className={INPUT}
            placeholder="배지 이름"
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
          />
          <select className={INPUT} value={editIcon} onChange={(e) => setEditIcon(e.target.value as BadgeIconKey)}>
            {ICON_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            className={INPUT}
            value={editOrder}
            min={1}
            onChange={(e) => setEditOrder(Number(e.target.value))}
          />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <ShirtBadgeIcon variant={editIcon} className="h-8 w-8" />
          <button
            type="button"
            disabled={savingDef}
            onClick={() => void handleAddDefinition()}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
          >
            배지 추가
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-slate-800">부여 내역</h2>
        {awards.length === 0 ? (
          <p className="text-sm text-slate-500">아직 부여된 배지가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {awards.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <BadgeCircle iconKey={a.iconKey} label={a.badgeLabel} size="sm" />
                  <div className="text-sm">
                    <p className="font-medium text-slate-800">
                      {a.grade}학년 {a.classNo}반 {a.studentNo}번 {a.studentName}
                    </p>
                    {a.note && <p className="text-xs text-slate-500">{a.note}</p>}
                    {a.awardedAt && (
                      <p className="text-[10px] text-slate-400">{a.awardedAt.toLocaleString("ko-KR")}</p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="text-xs text-red-600 hover:underline"
                  onClick={() => void handleRevoke(a)}
                >
                  회수
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
