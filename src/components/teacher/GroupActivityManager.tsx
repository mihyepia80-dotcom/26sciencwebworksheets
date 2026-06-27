"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { TeacherLoginPanel } from "@/components/TeacherLoginPanel";
import { RosterScrollTable, RosterStickyHead, RosterStickyRow } from "@/components/teacher/RosterScrollTable";
import {
  ACHIEVEMENT_LABELS,
  ROLE_DESCRIPTIONS,
  ROLE_LABELS,
  buildRosterId,
} from "@/lib/group-activity/constants";
import { GROUP_ACTIVITY_PRD } from "@/lib/group-activity/prd";
import { downloadRosterExcel, parseRosterFile } from "@/lib/group-activity/roster-excel";
import type { AchievementLevel, Gender, GroupSlot, RosterStudent, SeparationRule } from "@/lib/group-activity/types";
import { formatWeekRange, getWeekInfo } from "@/lib/group-activity/week-utils";
import { getFirebaseErrorMessage } from "@/lib/firebase";
import {
  addGroupActivityPraise,
  buildSeparationStudentStatus,
  bulkUpsertRosterStudents,
  computeGroupAssignment,
  deleteRosterStudent,
  deleteSeparationRule,
  getMonthlyAssignment,
  getRoleScheduleForClass,
  listGroupActivityPraises,
  listRosterStudents,
  listSeparationRules,
  listTeacherClasses,
  normalizeSeparationRulesForAssign,
  registerTeacherClass,
  saveMonthlyAssignment,
  saveRoleSchedule,
  saveSeparationRule,
  updateAchievementLevel,
  upsertRosterStudent,
  resolveSeparationStudentEntries,
} from "@/lib/firebase/group-activity";
import type { ClassRosterMeta } from "@/lib/group-activity/types";

const INPUT = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm";
const BTN = "rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-60";
const BTN_PRIMARY = `${BTN} bg-violet-600 text-white hover:bg-violet-700`;
const BTN_SECONDARY = `${BTN} border border-slate-300 text-slate-700 hover:bg-slate-50`;

function classKey(grade: string, classNo: string): string {
  return `${grade}::${classNo}`;
}

function genderLabel(g: Gender): string {
  return g === "male" ? "남" : "여";
}

export function GroupActivityManager() {
  const { user, role } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [classes, setClasses] = useState<ClassRosterMeta[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [addGrade, setAddGrade] = useState("5");
  const [addClassNo, setAddClassNo] = useState("2");

  const [students, setStudents] = useState<RosterStudent[]>([]);
  const [separations, setSeparations] = useState<SeparationRule[]>([]);
  const [groups, setGroups] = useState<GroupSlot[]>([]);
  const [roleSchedule, setRoleSchedule] = useState<Awaited<ReturnType<typeof saveRoleSchedule>> | null>(null);
  const [praises, setPraises] = useState<Awaited<ReturnType<typeof listGroupActivityPraises>>>([]);
  const [rosterId, setRosterId] = useState("");
  const [assignmentConfirmed, setAssignmentConfirmed] = useState(false);

  const [rosterTab, setRosterTab] = useState<"list" | "achievement">("list");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [newStudentNo, setNewStudentNo] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newGender, setNewGender] = useState<Gender>("male");

  const [sepLabel, setSepLabel] = useState("떠듬");
  const [sepStudentIds, setSepStudentIds] = useState<string[]>([]);

  const [praiseStudentId, setPraiseStudentId] = useState("");
  const [praiseNote, setPraiseNote] = useState("");

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const week = getWeekInfo(now);

  const selectedMeta = useMemo(
    () => classes.find((c) => classKey(c.grade, c.classNo) === selectedClass),
    [classes, selectedClass],
  );
  const grade = selectedMeta?.grade ?? "";
  const classNo = selectedMeta?.classNo ?? "";

  const studentsById = useMemo(() => new Map(students.map((s) => [s.id, s])), [students]);

  const separationStudentStatus = useMemo(
    () => buildSeparationStudentStatus(students, separations),
    [students, separations],
  );

  const separationRulesForAssign = useMemo(
    () => normalizeSeparationRulesForAssign(separations, students),
    [separations, students],
  );

  const loadTeacherClasses = useCallback(async () => {
    if (!user || role !== "teacher") return;
    const list = await listTeacherClasses(user.uid);
    setClasses(list);
    if (list.length > 0) {
      const key = classKey(list[0].grade, list[0].classNo);
      setSelectedClass((prev) => (prev && list.some((c) => classKey(c.grade, c.classNo) === prev) ? prev : key));
    } else {
      setSelectedClass("");
    }
  }, [user, role]);

  const loadClassData = useCallback(async () => {
    if (!user || role !== "teacher" || !grade || !classNo) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    const rid = buildRosterId(user.uid, grade, classNo);
    setRosterId(rid);

    try {
      const roster = await listRosterStudents(user.uid, rid, grade, classNo);
      setStudents(roster);
    } catch (e: unknown) {
      setError(getFirebaseErrorMessage(e, "명단 불러오기 실패"));
      setLoading(false);
      return;
    }

    try {
      const [rules, assignment, praiseList, schedule] = await Promise.all([
        listSeparationRules(user.uid, rid),
        getMonthlyAssignment(user.uid, rid, year, month),
        listGroupActivityPraises(user.uid, rid, week.weekIndex),
        getRoleScheduleForClass(grade, classNo),
      ]);

      setSeparations(rules);
      setGroups(assignment?.groups ?? []);
      setAssignmentConfirmed(!!assignment?.confirmedAt);
      setPraises(praiseList);
      setRoleSchedule(schedule);
    } catch (e: unknown) {
      setError(getFirebaseErrorMessage(e, "편성·역할 정보 불러오기 실패"));
    } finally {
      setLoading(false);
    }
  }, [user, role, grade, classNo, year, month, week.weekIndex]);

  useEffect(() => {
    void loadTeacherClasses().catch((e: unknown) => {
      setError(getFirebaseErrorMessage(e, "반 목록 불러오기 실패"));
    });
  }, [loadTeacherClasses]);

  useEffect(() => {
    void loadClassData();
  }, [loadClassData]);

  const handleRegisterClass = async () => {
    if (!user || role !== "teacher") {
      setError("교사 로그인이 필요합니다.");
      return;
    }
    if (!addGrade.trim() || !addClassNo.trim()) {
      setError("학년과 반 번호를 입력해 주세요.");
      return;
    }
    setBusy("register");
    setError("");
    setMessage("");
    try {
      const meta = await registerTeacherClass(user.uid, addGrade.trim(), addClassNo.trim(), user);
      const key = classKey(meta.grade, meta.classNo);
      setClasses((prev) => {
        if (prev.some((c) => c.rosterId === meta.rosterId)) return prev;
        return [...prev, meta].sort((a, b) => {
          const g = a.grade.localeCompare(b.grade, "ko");
          if (g !== 0) return g;
          return a.classNo.localeCompare(b.classNo, "ko", { numeric: true });
        });
      });
      setSelectedClass(key);
      setMessage(`${meta.grade}학년 ${meta.classNo}반을 등록했습니다.`);
      try {
        await loadTeacherClasses();
        setSelectedClass(key);
      } catch (reloadError: unknown) {
        setError(getFirebaseErrorMessage(reloadError, "반 목록 새로고침 실패"));
      }
    } catch (e: unknown) {
      setError(getFirebaseErrorMessage(e, "반 등록 실패"));
    } finally {
      setBusy("");
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!user || role !== "teacher") {
      setError("교사 로그인이 필요합니다.");
      return;
    }
    if (!grade || !classNo) {
      setError("반을 먼저 선택하거나 등록해 주세요.");
      return;
    }
    setBusy("upload");
    setError("");
    setMessage("");
    try {
      const rows = await parseRosterFile(file, grade, classNo);
      if (rows.length === 0) throw new Error("업로드할 학생 데이터가 없습니다.");
      const count = await bulkUpsertRosterStudents(user.uid, grade, classNo, rows, user);
      const rid = buildRosterId(user.uid, grade, classNo);
      const roster = await listRosterStudents(user.uid, rid, grade, classNo);
      setStudents(roster);
      setMessage(`${count}명 명단을 반영했습니다.`);
      void loadClassData();
    } catch (e: unknown) {
      setError(getFirebaseErrorMessage(e, "파일 업로드 실패"));
    } finally {
      setBusy("");
    }
  };

  const handleAddStudent = async () => {
    if (!user || role !== "teacher") {
      setError("교사 로그인이 필요합니다.");
      return;
    }
    if (!grade || !classNo) {
      setError("반을 먼저 선택하거나 등록해 주세요.");
      return;
    }
    if (!newStudentNo.trim() || !newStudentName.trim()) {
      setError("번호와 이름을 입력해 주세요.");
      return;
    }
    setBusy("add");
    setError("");
    try {
      await upsertRosterStudent(user.uid, grade, classNo, {
        studentNo: newStudentNo.trim(),
        studentName: newStudentName.trim(),
        gender: newGender,
        achievementLevel: 2,
        active: true,
      }, user);
      const rid = buildRosterId(user.uid, grade, classNo);
      const roster = await listRosterStudents(user.uid, rid, grade, classNo);
      setStudents(roster);
      setNewStudentNo("");
      setNewStudentName("");
      setMessage("학생을 추가했습니다.");
      void loadClassData();
    } catch (e: unknown) {
      setError(getFirebaseErrorMessage(e, "추가 실패"));
    } finally {
      setBusy("");
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!user) return;
    if (!window.confirm("이 학생을 명단에서 삭제할까요?")) return;
    setBusy(`del-${id}`);
    try {
      await deleteRosterStudent(user.uid, id);
      await loadClassData();
    } catch (e: unknown) {
      setError(getFirebaseErrorMessage(e, "삭제 실패"));
    } finally {
      setBusy("");
    }
  };

  const handleAutoAssign = (seed?: number) => {
    setError("");
    try {
      const result = computeGroupAssignment(students, separationRulesForAssign, seed);
      setGroups(result);
      setMessage("모둠을 자동 편성했습니다. 확인 후 「편성 확정」을 눌러 주세요.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "편성 실패");
    }
  };

  const handleConfirmAssignment = async () => {
    if (!user || groups.length === 0) return;
    setBusy("confirm");
    try {
      await saveMonthlyAssignment(user.uid, grade, classNo, year, month, groups, true);
      setAssignmentConfirmed(true);
      setMessage(`${year}년 ${month}월 모둠 편성을 확정했습니다.`);
    } catch (e: unknown) {
      setError(getFirebaseErrorMessage(e, "확정 실패"));
    } finally {
      setBusy("");
    }
  };

  const handleAssignRoles = async () => {
    if (!user || groups.length === 0) return;
    setBusy("roles");
    try {
      const schedule = await saveRoleSchedule(user.uid, grade, classNo, groups, students);
      setRoleSchedule(schedule);
      setMessage(`${week.weekIndex}주차 역할을 배정했습니다.`);
    } catch (e: unknown) {
      setError(getFirebaseErrorMessage(e, "역할 배정 실패"));
    } finally {
      setBusy("");
    }
  };

  const handleSaveSeparation = async () => {
    if (!user || !rosterId) return;
    if (sepStudentIds.length < 2) {
      setError("분리 조건에는 학생을 2명 이상 선택해 주세요.");
      return;
    }
    setBusy("sep");
    setError("");
    try {
      const studentNos = sepStudentIds
        .map((id) => studentsById.get(id)?.studentNo)
        .filter((no): no is string => Boolean(no));
      await saveSeparationRule(user.uid, rosterId, sepLabel.trim() || "분리", sepStudentIds, studentNos);
      setSepStudentIds([]);
      await loadClassData();
      setMessage("분리 조건을 저장했습니다.");
    } catch (e: unknown) {
      setError(getFirebaseErrorMessage(e, "저장 실패"));
    } finally {
      setBusy("");
    }
  };

  const handlePraise = async () => {
    if (!user || !rosterId || !praiseStudentId || !roleSchedule) return;
    const student = studentsById.get(praiseStudentId);
    const assignment = roleSchedule.assignments.find((a) => a.rosterStudentId === praiseStudentId);
    if (!student || !assignment) return;

    setBusy("praise");
    try {
      await addGroupActivityPraise(
        user.uid,
        rosterId,
        grade,
        classNo,
        student,
        assignment.groupNo,
        week.weekIndex,
        week.weekStart,
        assignment.primaryRoleCode,
        praiseNote,
      );
      setPraiseNote("");
      setMessage("모둠 활동 칭찬을 부여했습니다.");
      const list = await listGroupActivityPraises(user.uid, rosterId, week.weekIndex);
      setPraises(list);
    } catch (e: unknown) {
      setError(getFirebaseErrorMessage(e, "칭찬 실패"));
    } finally {
      setBusy("");
    }
  };

  if (!user || role !== "teacher") {
    return (
      <div className="mx-auto max-w-md">
        <p className="text-sm text-slate-600">모둠 활동을 관리하려면 교사 로그인이 필요합니다.</p>
        <div className="mt-6">
          <TeacherLoginPanel />
        </div>
      </div>
    );
  }

  const acceptFormats = GROUP_ACTIVITY_PRD.rosterImport.formats.map((f) => `.${f}`).join(",");

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">반 선택 · 등록</h2>
        <p className="mt-1 text-xs text-slate-500">여러 반을 등록한 뒤, 선택한 반 단위로 명단·편성·역할을 관리합니다.</p>

        <div className="mt-4 flex flex-wrap items-end gap-4">
          <label className="flex min-w-[12rem] flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">관리 중인 반</span>
            <select
              className={INPUT}
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setMessage("");
                setError("");
              }}
            >
              {classes.length === 0 && <option value="">등록된 반이 없습니다</option>}
              {classes.map((c) => (
                <option key={c.rosterId} value={classKey(c.grade, c.classNo)}>
                  {c.grade}학년 {c.classNo}반
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-violet-200 bg-violet-50/50 px-3 py-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-600">학년</span>
              <input className={`${INPUT} w-20`} value={addGrade} onChange={(e) => setAddGrade(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-600">반</span>
              <input className={`${INPUT} w-20`} value={addClassNo} onChange={(e) => setAddClassNo(e.target.value)} />
            </label>
            <button type="button" className={BTN_PRIMARY} disabled={busy === "register"} onClick={() => void handleRegisterClass()}>
              반 추가 등록
            </button>
          </div>
        </div>

        {selectedMeta && (
          <p className="mt-2 text-xs text-slate-500">
            현재: {grade}학년 {classNo}반 · {year}년 {month}월 · {week.schoolWeekLabel}
          </p>
        )}
      </section>

      {message && <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>}
      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {!selectedMeta && !loading && (
        <p className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          먼저 「반 추가 등록」으로 학년·반을 등록해 주세요.
        </p>
      )}

      {selectedMeta && loading && <p className="text-sm text-slate-500">불러오는 중...</p>}

      {selectedMeta && !loading && (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">1. 명렬표 ({grade}학년 {classNo}반)</h2>
              <div className="flex gap-2">
                <button type="button" className={rosterTab === "list" ? BTN_PRIMARY : BTN_SECONDARY} onClick={() => setRosterTab("list")}>
                  명단
                </button>
                <button type="button" className={rosterTab === "achievement" ? BTN_PRIMARY : BTN_SECONDARY} onClick={() => setRosterTab("achievement")}>
                  성적 분포
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                className={BTN_SECONDARY}
                onClick={() => downloadRosterExcel(grade, classNo, students)}
              >
                엑셀 양식 다운로드
              </button>
              <input
                ref={fileRef}
                type="file"
                accept={acceptFormats}
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleFileUpload(f);
                  e.target.value = "";
                }}
              />
              <button type="button" className={BTN_PRIMARY} disabled={busy === "upload"} onClick={() => fileRef.current?.click()}>
                엑셀·CSV 업로드
              </button>
              <span className="self-center text-xs text-slate-500">
                학년, 반, 번호, 이름, 성별, 성적분포 · {GROUP_ACTIVITY_PRD.rosterImport.formats.join(" / ")}
              </span>
            </div>

            {rosterTab === "list" && (
              <>
                <div className="mt-4 flex flex-wrap gap-2">
                  <input className={`${INPUT} w-20`} placeholder="번호" value={newStudentNo} onChange={(e) => setNewStudentNo(e.target.value)} />
                  <input className={`${INPUT} w-32`} placeholder="이름" value={newStudentName} onChange={(e) => setNewStudentName(e.target.value)} />
                  <select className={`${INPUT} w-24`} value={newGender} onChange={(e) => setNewGender(e.target.value as Gender)}>
                    <option value="male">남</option>
                    <option value="female">여</option>
                  </select>
                  <button type="button" className={BTN_PRIMARY} disabled={busy === "add"} onClick={() => void handleAddStudent()}>
                    학생 추가
                  </button>
                </div>
                <RosterScrollTable>
                  <RosterStickyHead
                    extraHeaders={
                      <>
                        <th className="px-3 py-2">성별</th>
                        <th className="px-3 py-2">삭제</th>
                      </>
                    }
                  />
                  <tbody>
                    {students.map((s) => (
                      <RosterStickyRow
                        key={s.id}
                        studentNo={s.studentNo}
                        studentName={s.studentName}
                        cells={
                          <>
                            <td className="px-3 py-2">{genderLabel(s.gender)}</td>
                            <td className="px-3 py-2">
                              <button type="button" className="text-red-600 hover:underline" disabled={busy === `del-${s.id}`} onClick={() => void handleDeleteStudent(s.id)}>
                                삭제
                              </button>
                            </td>
                          </>
                        }
                      />
                    ))}
                    {students.length === 0 && (
                      <tr><td colSpan={4} className="py-6 text-center text-slate-400">명단이 비어 있습니다. 엑셀 양식을 다운로드해 입력 후 업로드하세요.</td></tr>
                    )}
                  </tbody>
                </RosterScrollTable>
              </>
            )}

            {rosterTab === "achievement" && (
              <>
                <p className="mt-4 text-xs text-slate-500">100점 점수 없음 — 상(1)·중(2)·하(3) 코드만 관리합니다. 번호·이름 열은 스크롤 시 고정됩니다.</p>
                <RosterScrollTable>
                  <RosterStickyHead
                    extraHeaders={<th className="min-w-[8rem] px-3 py-2">성적 분포</th>}
                  />
                  <tbody>
                    {students.map((s) => (
                      <RosterStickyRow
                        key={s.id}
                        studentNo={s.studentNo}
                        studentName={s.studentName}
                        cells={
                          <td className="px-3 py-2">
                            <select
                              className={INPUT}
                              value={s.achievementLevel}
                              onChange={(e) => {
                                const level = Number(e.target.value) as AchievementLevel;
                                void updateAchievementLevel(user.uid, s.id, level).then(loadClassData);
                              }}
                            >
                              <option value={1}>상(1)</option>
                              <option value={2}>중(2)</option>
                              <option value={3}>하(3)</option>
                            </select>
                          </td>
                        }
                      />
                    ))}
                  </tbody>
                </RosterScrollTable>
              </>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">2. 분리 조건</h2>
            <p className="mt-1 text-xs text-slate-500">같은 모둠에 배치하지 않을 학생을 유형별로 지정합니다.</p>

            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                등록 조건 {separations.length}건
              </span>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900">
                등록 학생 {separationStudentStatus.length}명
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-2">
              <input className={`${INPUT} w-28`} value={sepLabel} onChange={(e) => setSepLabel(e.target.value)} placeholder="유형" />
              <select
                className={`${INPUT} max-w-xs`}
                multiple
                size={4}
                value={sepStudentIds}
                onChange={(e) => setSepStudentIds(Array.from(e.target.selectedOptions, (o) => o.value))}
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.studentNo} {s.studentName}</option>
                ))}
              </select>
              <button type="button" className={BTN_PRIMARY} disabled={busy === "sep"} onClick={() => void handleSaveSeparation()}>
                쌍 추가
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500">Ctrl(⌘) + 클릭으로 여러 학생을 선택하세요.</p>

            {separationStudentStatus.length > 0 && (
              <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50/60 p-4">
                <h3 className="text-sm font-bold text-amber-950">분리 조건 등록 학생 현황</h3>
                <p className="mt-1 text-xs text-amber-900/80">아래 학생들은 지정한 유형끼리 같은 모둠에 배치되지 않습니다.</p>
                <div className="mt-3">
                  <RosterScrollTable>
                  <RosterStickyHead
                    extraHeaders={<th className="min-w-[10rem] px-3 py-2">분리 유형</th>}
                  />
                  <tbody>
                    {separationStudentStatus.map(({ student, labels }) => (
                      <RosterStickyRow
                        key={student.id}
                        studentNo={student.studentNo}
                        studentName={student.studentName}
                        cells={
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-1">
                              {labels.map((label) => (
                                <span
                                  key={label}
                                  className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-amber-200"
                                >
                                  {label}
                                </span>
                              ))}
                            </div>
                          </td>
                        }
                      />
                    ))}
                  </tbody>
                  </RosterScrollTable>
                </div>
              </div>
            )}

            <ul className="mt-5 space-y-2">
              {separations.length === 0 && (
                <li className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-sm text-slate-400">
                  등록된 분리 조건이 없습니다.
                </li>
              )}
              {separations.map((rule) => {
                const members = resolveSeparationStudentEntries(rule, students);
                return (
                  <li key={rule.id} className="rounded-lg bg-slate-50 px-3 py-3 text-sm">
                    <div className="flex flex-wrap items-start gap-2">
                      <span className="font-medium text-slate-800">{rule.typeLabel}</span>
                      <span className="text-xs text-slate-500">({members.length}명)</span>
                      <button
                        type="button"
                        className="ml-auto text-red-600 hover:underline"
                        onClick={() => user && void deleteSeparationRule(user.uid, rule.id).then(loadClassData)}
                      >
                        삭제
                      </button>
                    </div>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {members.map((s) => (
                        <li
                          key={s.id}
                          className="rounded-md bg-white px-2 py-1 text-xs text-slate-700 ring-1 ring-slate-200"
                        >
                          {s.studentNo}번 {s.studentName}
                        </li>
                      ))}
                      {members.length === 0 && (
                        <li className="text-xs text-red-600">명단과 연결되지 않은 조건입니다. 삭제 후 다시 등록해 주세요.</li>
                      )}
                    </ul>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">3. 모둠 편성 ({year}년 {month}월 · {grade}학년 {classNo}반)</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" className={BTN_PRIMARY} onClick={() => handleAutoAssign()}>자동 편성</button>
              <button type="button" className={BTN_SECONDARY} onClick={() => handleAutoAssign(Date.now())}>재구성</button>
              <button type="button" className={BTN_SECONDARY} disabled={busy === "confirm" || groups.length === 0} onClick={() => void handleConfirmAssignment()}>
                편성 확정
              </button>
              {assignmentConfirmed && <span className="self-center text-sm text-emerald-700">✓ 확정됨</span>}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((g) => (
                <div key={g.groupNo} className="rounded-lg border border-violet-100 bg-violet-50/50 p-4">
                  <p className="font-bold text-violet-900">{g.groupNo}모둠 ({g.memberIds.length}명)</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {g.memberIds.map((id) => {
                      const s = studentsById.get(id);
                      if (!s) return null;
                      return (
                        <li key={id}>
                          {s.studentNo} {s.studentName} · {genderLabel(s.gender)} · {ACHIEVEMENT_LABELS[s.achievementLevel]}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
              {groups.length === 0 && <p className="text-sm text-slate-400">「자동 편성」을 눌러 6모둠을 만드세요. (학생 {students.length}명)</p>}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">4. 역할 부여</h2>
            <p className="mt-1 text-sm text-slate-600">
              {formatWeekRange(week.weekStart, week.weekEnd)} · 매주 월요일 갱신 (월~금)
            </p>
            <button type="button" className={`mt-4 ${BTN_PRIMARY}`} disabled={busy === "roles" || groups.length === 0} onClick={() => void handleAssignRoles()}>
              역할 배정 (이번 주)
            </button>
            {roleSchedule && roleSchedule.assignments.length > 0 && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((groupNo) => {
                  const members = roleSchedule.assignments.filter((a) => a.groupNo === groupNo);
                  if (members.length === 0) return null;
                  return (
                    <div key={groupNo} className="rounded-lg border border-slate-200 p-4">
                      <p className="font-bold">{groupNo}모둠</p>
                      <ul className="mt-2 space-y-2 text-sm">
                        {members.map((a) => (
                          <li key={a.rosterStudentId}>
                            <span className="font-medium">{a.studentName}</span>
                            <br />
                            주: {ROLE_LABELS[a.primaryRoleCode]} — {ROLE_DESCRIPTIONS[a.primaryRoleCode]}
                            {a.secondaryRoleCode && (
                              <>
                                <br />
                                보조: {ROLE_LABELS[a.secondaryRoleCode]}
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-amber-200 bg-amber-50/40 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-amber-900">5. 모둠 활동 칭찬</h2>
            <p className="mt-1 text-xs text-amber-800">학습지 칭찬 배지(<Link href="/teacher/badges" className="underline">/teacher/badges</Link>)와 별도입니다.</p>
            <div className="mt-4 flex flex-wrap items-end gap-2">
              <select className={INPUT} value={praiseStudentId} onChange={(e) => setPraiseStudentId(e.target.value)}>
                <option value="">학생 선택</option>
                {(roleSchedule?.assignments ?? []).map((a) => (
                  <option key={a.rosterStudentId} value={a.rosterStudentId}>
                    {a.groupNo}모둠 · {a.studentName} · {ROLE_LABELS[a.primaryRoleCode]}
                  </option>
                ))}
              </select>
              <input className={`${INPUT} max-w-xs`} placeholder="메모(선택)" value={praiseNote} onChange={(e) => setPraiseNote(e.target.value)} />
              <button type="button" className={BTN_PRIMARY} disabled={busy === "praise" || !praiseStudentId} onClick={() => void handlePraise()}>
                칭찬 부여
              </button>
            </div>
            {praises.length > 0 && (
              <ul className="mt-4 space-y-2 text-sm">
                {praises.map((p) => (
                  <li key={p.id} className="rounded-lg bg-white px-3 py-2">
                    {p.groupNo}모둠 · {p.studentName} · {ROLE_LABELS[p.primaryRoleCode]}
                    {p.note && <span className="text-slate-500"> — {p.note}</span>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
