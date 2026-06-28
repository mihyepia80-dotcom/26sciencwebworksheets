"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { TeacherLoginPanel } from "@/components/TeacherLoginPanel";
import { GroupAssignmentStatusPanel } from "@/components/teacher/GroupAssignmentStatusPanel";
import { GroupRoleStatusPanel } from "@/components/teacher/GroupRoleStatusPanel";
import { SeparationDragPanel } from "@/components/teacher/SeparationDragPanel";
import { RosterScrollTable, RosterStickyHead, RosterStickyRow } from "@/components/teacher/RosterScrollTable";
import {
  ROLE_LABELS,
  buildRosterId,
  type RoleCode,
} from "@/lib/group-activity/constants";
import { assignRolesForAllGroups } from "@/lib/group-activity/assign-roles";
import {
  enrichGroupSlots,
  resolveGroupSlots,
  resolveRoleAssignments,
  syncGroupsFromRoster,
} from "@/lib/group-activity/resolve-groups";
import { GROUP_ACTIVITY_PRD } from "@/lib/group-activity/prd";
import { downloadRosterExcel, parseRosterFile } from "@/lib/group-activity/roster-excel";
import type { AchievementLevel, Gender, GroupSlot, RosterStudent, SeparationRule, StudentRoleAssignment } from "@/lib/group-activity/types";
import { getWeekInfo } from "@/lib/group-activity/week-utils";
import { getFirebaseErrorCode, getTeacherFirebaseErrorMessage } from "@/lib/firebase";
import {
  addGroupActivityPraise,
  buildSeparationStudentStatus,
  bulkUpsertRosterStudents,
  computeGroupAssignmentWithMeta,
  deleteMonthlyAssignment,
  deleteRosterStudent,
  deleteRoleSchedule,
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
  saveRoleScheduleAssignments,
  saveSeparationRule,
  updateAchievementLevel,
  upsertRosterStudent,
} from "@/lib/firebase/group-activity";
import type { ClassRosterMeta, RoleWeekSchedule } from "@/lib/group-activity/types";

const INPUT = "ui-input-compact";
const BTN_PRIMARY = "ui-btn-accent";
const BTN_SECONDARY = "ui-btn-secondary";
const PANEL = "ui-panel";

type ActivitySection = "roster" | "separation" | "assign" | "roles" | "praise";

const ACTIVITY_SECTIONS: { id: ActivitySection; label: string }[] = [
  { id: "roster", label: "1. 명렬표" },
  { id: "separation", label: "2. 분리 조건" },
  { id: "assign", label: "4. 모둠 편성" },
  { id: "roles", label: "5. 역할 부여" },
  { id: "praise", label: "6. 칭찬" },
];

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
  const [roleSchedule, setRoleSchedule] = useState<RoleWeekSchedule | null>(null);
  const [praises, setPraises] = useState<Awaited<ReturnType<typeof listGroupActivityPraises>>>([]);
  const [rosterId, setRosterId] = useState("");
  const [assignmentConfirmed, setAssignmentConfirmed] = useState(false);

  const [rosterTab, setRosterTab] = useState<"list" | "achievement">("list");
  const [activitySection, setActivitySection] = useState<ActivitySection>("roster");
  const [roleDraft, setRoleDraft] = useState<StudentRoleAssignment[]>([]);
  const roleDraftDirtyRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [newStudentNo, setNewStudentNo] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [newGender, setNewGender] = useState<Gender>("male");

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

  const resolvedGroups = useMemo(
    () => resolveGroupSlots(groups, students),
    [groups, students],
  );

  const roleDisplayAssignments = roleDraft;

  const rolesSavedThisWeek = Boolean(
    roleSchedule?.weekIndex === week.weekIndex && roleSchedule.assignments.length > 0,
  );

  useEffect(() => {
    if (roleDraftDirtyRef.current) return;
    try {
      if (resolvedGroups.every((g) => g.memberIds.length === 0)) {
        setRoleDraft([]);
        return;
      }
      if (roleSchedule?.weekIndex === week.weekIndex && roleSchedule.assignments.length > 0) {
        setRoleDraft(resolveRoleAssignments(roleSchedule.assignments, students));
        return;
      }
      setRoleDraft(assignRolesForAllGroups(resolvedGroups, studentsById, week.weekIndex));
    } catch {
      setRoleDraft([]);
    }
  }, [resolvedGroups, students, studentsById, week.weekIndex, roleSchedule]);

  const loadTeacherClasses = useCallback(async () => {
    if (!user || role !== "teacher") return;
    const list = await listTeacherClasses(user.uid, user);
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

    let roster: RosterStudent[] = [];
    let rules: SeparationRule[] = [];

    try {
      roster = await listRosterStudents(user.uid, rid, grade, classNo, user);
      setStudents(roster);
      rules = await listSeparationRules(user.uid, rid, grade, classNo, user);
      setSeparations(rules);
    } catch (e: unknown) {
      setError(getTeacherFirebaseErrorMessage(e, "명단·분리 조건 불러오기 실패"));
      setLoading(false);
      return;
    }

    try {
      const assignment = await getMonthlyAssignment(user.uid, rid, year, month, user);
      const syncedGroups = syncGroupsFromRoster(
        assignment?.groups ?? [],
        roster,
        normalizeSeparationRulesForAssign(rules, roster),
      );
      setGroups(syncedGroups);
      setAssignmentConfirmed(!!assignment?.confirmedAt);
    } catch (e: unknown) {
      if (getFirebaseErrorCode(e) !== "permission-denied") {
        setError(getTeacherFirebaseErrorMessage(e, "모둠 편성 불러오기 실패"));
      }
      setGroups(enrichGroupSlots([], roster));
      setAssignmentConfirmed(false);
    }

    try {
      const praiseList = await listGroupActivityPraises(user.uid, rid, week.weekIndex);
      setPraises(praiseList);
    } catch {
      setPraises([]);
    }

    try {
      const schedule = await getRoleScheduleForClass(grade, classNo, user.uid);
      setRoleSchedule(schedule);
    } catch {
      setRoleSchedule(null);
    }
    setLoading(false);
  }, [user, role, grade, classNo, year, month, week.weekIndex]);

  useEffect(() => {
    void loadTeacherClasses().catch((e: unknown) => {
      setError(getTeacherFirebaseErrorMessage(e, "반 목록 불러오기 실패"));
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
        setError(getTeacherFirebaseErrorMessage(reloadError, "반 목록 새로고침 실패"));
      }
    } catch (e: unknown) {
      setError(getTeacherFirebaseErrorMessage(e, "반 등록 실패"));
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
      const roster = await listRosterStudents(user.uid, rid, grade, classNo, user);
      setStudents(roster);
      setMessage(`${count}명 명단을 반영했습니다.`);
      setActivitySection("assign");
      void loadClassData();
    } catch (e: unknown) {
      setError(getTeacherFirebaseErrorMessage(e, "파일 업로드 실패"));
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
      const roster = await listRosterStudents(user.uid, rid, grade, classNo, user);
      setStudents(roster);
      setNewStudentNo("");
      setNewStudentName("");
      setMessage("학생을 추가했습니다.");
      setActivitySection("assign");
      void loadClassData();
    } catch (e: unknown) {
      setError(getTeacherFirebaseErrorMessage(e, "추가 실패"));
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
      setError(getTeacherFirebaseErrorMessage(e, "삭제 실패"));
    } finally {
      setBusy("");
    }
  };

  const handleAutoAssign = async (seed?: number) => {
    if (!user || !grade || !classNo) return;
    setError("");
    setBusy("assign");
    try {
      const { groups: assigned, notice } = computeGroupAssignmentWithMeta(
        students,
        separationRulesForAssign,
        seed,
      );
      const result = enrichGroupSlots(assigned, students);
      await saveMonthlyAssignment(user.uid, grade, classNo, year, month, result, false);
      setGroups(result);
      setAssignmentConfirmed(false);
      setActivitySection("assign");
      setMessage(
        notice
          ? `모둠을 편성해 저장했습니다. ${notice} 「편성 확정」을 눌러 주세요.`
          : "모둠을 자동 편성해 저장했습니다. 확인 후 「편성 확정」을 눌러 주세요.",
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "편성 실패");
    } finally {
      setBusy("");
    }
  };

  const handleManualGroupsChange = async (nextGroups: GroupSlot[]) => {
    if (!user || !grade || !classNo) return;
    setError("");
    const payload = enrichGroupSlots(nextGroups, students);
    setGroups(payload);
    setAssignmentConfirmed(false);
    setBusy("assign-save");
    try {
      await saveMonthlyAssignment(user.uid, grade, classNo, year, month, payload, false);
      setMessage("모둠 구성을 저장했습니다. 확인 후 「편성 확정」을 눌러 주세요.");
    } catch (e: unknown) {
      setError(getTeacherFirebaseErrorMessage(e, "모둠 구성 저장 실패"));
      void loadClassData();
    } finally {
      setBusy("");
    }
  };

  const handleConfirmAssignment = async () => {
    if (!user || resolvedGroups.every((g) => g.memberIds.length === 0)) return;
    setBusy("confirm");
    try {
      const payload = enrichGroupSlots(resolvedGroups, students);
      await saveMonthlyAssignment(user.uid, grade, classNo, year, month, payload, true);
      setGroups(payload);
      setAssignmentConfirmed(true);
      setMessage(`${year}년 ${month}월 모둠 편성을 확정했습니다.`);
    } catch (e: unknown) {
      setError(getTeacherFirebaseErrorMessage(e, "확정 실패"));
    } finally {
      setBusy("");
    }
  };

  const handleSaveAssignment = async () => {
    if (!user || !grade || !classNo) return;
    setError("");
    setBusy("assign-save");
    try {
      const payload = enrichGroupSlots(resolvedGroups, students);
      await saveMonthlyAssignment(user.uid, grade, classNo, year, month, payload, assignmentConfirmed);
      setGroups(payload);
      setMessage("모둠 편성을 저장했습니다.");
    } catch (e: unknown) {
      setError(getTeacherFirebaseErrorMessage(e, "편성 저장 실패"));
    } finally {
      setBusy("");
    }
  };

  const handleDeleteAssignment = async () => {
    if (!user || !grade || !classNo) return;
    if (!window.confirm(`${year}년 ${month}월 모둠 편성을 삭제할까요?`)) return;
    setError("");
    setBusy("assign-delete");
    try {
      await deleteMonthlyAssignment(user.uid, grade, classNo, year, month);
      const empty = enrichGroupSlots([], students);
      setGroups(empty);
      setAssignmentConfirmed(false);
      setMessage("모둠 편성을 삭제했습니다.");
    } catch (e: unknown) {
      setError(getTeacherFirebaseErrorMessage(e, "편성 삭제 실패"));
    } finally {
      setBusy("");
    }
  };

  const handleAssignRoles = async () => {
    if (!user || resolvedGroups.every((g) => g.memberIds.length === 0) || roleDraft.length === 0) return;
    setBusy("roles");
    setError("");
    try {
      const payload = enrichGroupSlots(resolvedGroups, students);
      const schedule = await saveRoleScheduleAssignments(
        user.uid,
        grade,
        classNo,
        payload,
        roleDraft,
        week.weekIndex,
      );
      setRoleSchedule(schedule);
      roleDraftDirtyRef.current = false;
      setActivitySection("roles");
      setMessage(`${week.weekIndex}주차 역할을 저장했습니다.`);
    } catch (e: unknown) {
      setError(getTeacherFirebaseErrorMessage(e, "역할 저장 실패"));
    } finally {
      setBusy("");
    }
  };

  const handleDeleteRoles = async () => {
    if (!user || !grade || !classNo) return;
    if (!window.confirm("이번 주 역할 배정을 삭제할까요? 학생 화면에서도 사라집니다.")) return;
    setBusy("roles-delete");
    setError("");
    try {
      await deleteRoleSchedule(grade, classNo);
      setRoleSchedule(null);
      roleDraftDirtyRef.current = false;
      setRoleDraft(assignRolesForAllGroups(resolvedGroups, studentsById, week.weekIndex));
      setMessage("역할 배정을 삭제했습니다.");
    } catch (e: unknown) {
      setError(getTeacherFirebaseErrorMessage(e, "역할 삭제 실패"));
    } finally {
      setBusy("");
    }
  };

  const handleAutoRoleAssign = () => {
    roleDraftDirtyRef.current = true;
    setRoleDraft(assignRolesForAllGroups(resolvedGroups, studentsById, week.weekIndex));
    setMessage("자동 역할 배정 미리보기를 적용했습니다. 확인 후 「역할 저장」을 눌러 주세요.");
  };

  const handleRoleAssignmentChange = (
    rosterStudentId: string,
    patch: { primaryRoleCode?: RoleCode; secondaryRoleCode?: RoleCode | null },
  ) => {
    roleDraftDirtyRef.current = true;
    setRoleDraft((prev) =>
      prev.map((a) => (a.rosterStudentId === rosterStudentId ? { ...a, ...patch } : a)),
    );
  };

  const handleSaveSeparationPair = async (
    label: string,
    studentIds: [string, string],
    ruleId?: string,
  ) => {
    if (!user || role !== "teacher") {
      setError("교사 로그인이 필요합니다.");
      return;
    }
    if (!grade || !classNo) {
      setError("반을 먼저 선택하거나 등록해 주세요.");
      return;
    }
    setBusy("sep");
    setError("");
    setMessage("");
    try {
      const rid = buildRosterId(user.uid, grade, classNo);
      const studentNos = studentIds
        .map((id) => studentsById.get(id)?.studentNo)
        .filter((no): no is string => Boolean(no));
      await saveSeparationRule(user.uid, rid, grade, classNo, label, studentIds, studentNos, user, ruleId);
      const rules = await listSeparationRules(user.uid, rid, grade, classNo);
      setSeparations(rules);
      setRosterId(rid);
      setMessage(ruleId ? `「${label}」 분리 쌍을 수정했습니다.` : `「${label}」 분리 쌍을 등록했습니다.`);
    } catch (e: unknown) {
      setError(getTeacherFirebaseErrorMessage(e, "분리 조건 저장 실패"));
    } finally {
      setBusy("");
    }
  };

  const handleDeleteSeparationRule = async (ruleId: string) => {
    if (!user) return;
    if (!window.confirm("이 분리 조건을 삭제할까요?")) return;
    setBusy("sep");
    try {
      await deleteSeparationRule(user.uid, ruleId);
      await loadClassData();
      setMessage("분리 조건을 삭제했습니다.");
    } catch (e: unknown) {
      setError(getTeacherFirebaseErrorMessage(e, "분리 조건 삭제 실패"));
    } finally {
      setBusy("");
    }
  };

  const handlePraise = async () => {
    if (!user || !rosterId || !praiseStudentId) return;
    const student = studentsById.get(praiseStudentId);
    const assignment = roleDisplayAssignments.find((a) => a.rosterStudentId === praiseStudentId);
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
      setError(getTeacherFirebaseErrorMessage(e, "칭찬 실패"));
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
      <section className={PANEL}>
        <h2 className="ui-section-title">반 선택 · 등록</h2>
        <p className="ui-section-desc text-base">여러 반을 등록한 뒤, 선택한 반 단위로 명단·편성·역할을 관리합니다.</p>

        <div className="mt-4 flex flex-wrap items-end gap-4">
          <label className="flex min-w-[12rem] flex-col gap-2 text-base">
            <span className="font-semibold text-slate-700">관리 중인 반</span>
            <select
              className={INPUT}
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setMessage("");
                setError("");
                roleDraftDirtyRef.current = false;
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

          <div className="flex flex-wrap items-end gap-3 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/60 px-5 py-4">
            <label className="flex flex-col gap-2 text-base">
              <span className="font-semibold text-slate-700">학년</span>
              <input className={`${INPUT} w-20`} value={addGrade} onChange={(e) => setAddGrade(e.target.value)} />
            </label>
            <label className="flex flex-col gap-2 text-base">
              <span className="font-semibold text-slate-700">반</span>
              <input className={`${INPUT} w-20`} value={addClassNo} onChange={(e) => setAddClassNo(e.target.value)} />
            </label>
            <button type="button" className={BTN_PRIMARY} disabled={busy === "register"} onClick={() => void handleRegisterClass()}>
              반 추가 등록
            </button>
          </div>
        </div>

        {selectedMeta && (
          <p className="mt-4 text-base text-slate-600">
            현재: <strong>{grade}학년 {classNo}반</strong> · {year}년 {month}월 · {week.schoolWeekLabel}
          </p>
        )}
      </section>

      {message && <p className="ui-message-success">{message}</p>}
      {error && activitySection !== "assign" && <p className="ui-message-error">{error}</p>}

      {!selectedMeta && !loading && (
        <p className="ui-panel text-center text-lg text-slate-500">
          먼저 「반 추가 등록」으로 학년·반을 등록해 주세요.
        </p>
      )}

      {selectedMeta && loading && <p className="text-lg text-slate-500">불러오는 중...</p>}

      {selectedMeta && !loading && (
        <>
          <nav className="ui-tab-nav" aria-label="모둠 활동 메뉴">
            {ACTIVITY_SECTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`ui-tab ${activitySection === item.id ? "ui-tab-active" : "ui-tab-inactive"}`}
                onClick={() => {
                  setActivitySection(item.id);
                  setError("");
                }}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {(activitySection === "roster") && (
          <section className={PANEL}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 className="ui-section-title">1. 명렬표 ({grade}학년 {classNo}반)</h2>
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
          )}

          {(activitySection === "separation") && (
            <SeparationDragPanel
              students={students}
              separations={separations}
              separationStudentStatus={separationStudentStatus}
              busy={busy}
              onSavePair={handleSaveSeparationPair}
              onDeleteRule={handleDeleteSeparationRule}
            />
          )}

          {(activitySection === "assign") && (
            <>
              {error && <p className="ui-message-error">{error}</p>}
              <GroupAssignmentStatusPanel
              year={year}
              month={month}
              grade={grade}
              classNo={classNo}
              students={students}
              groups={resolvedGroups}
              assignmentConfirmed={assignmentConfirmed}
              busy={busy}
              onAutoAssign={handleAutoAssign}
              onConfirm={() => void handleConfirmAssignment()}
              onGroupsChange={(next) => void handleManualGroupsChange(next)}
              onSave={() => void handleSaveAssignment()}
              onDelete={() => void handleDeleteAssignment()}
            />
            </>
          )}

          {(activitySection === "roles") && (
            <GroupRoleStatusPanel
              weekStart={week.weekStart}
              weekEnd={week.weekEnd}
              weekLabel={week.schoolWeekLabel}
              assignments={roleDraft}
              hasGroups={resolvedGroups.some((g) => g.memberIds.length > 0)}
              isSaved={rolesSavedThisWeek}
              busy={busy}
              onAssignmentChange={handleRoleAssignmentChange}
              onAutoAssign={handleAutoRoleAssign}
              onSave={() => void handleAssignRoles()}
              onDelete={() => void handleDeleteRoles()}
            />
          )}

          {(activitySection === "praise") && (
          <section className="ui-panel border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-white">
            <h2 className="ui-section-title text-amber-950">6. 모둠 활동 칭찬</h2>
            <p className="mt-2 text-base text-amber-900/80">학습지 칭찬 배지(<Link href="/teacher/badges" className="font-semibold underline">/teacher/badges</Link>)와 별도입니다.</p>
            <div className="mt-4 flex flex-wrap items-end gap-2">
              <select className={INPUT} value={praiseStudentId} onChange={(e) => setPraiseStudentId(e.target.value)}>
                <option value="">학생 선택</option>
                {roleDisplayAssignments.map((a) => (
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
          )}
        </>
      )}
    </div>
  );
}
