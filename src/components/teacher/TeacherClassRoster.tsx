"use client";

import { useEffect, useMemo, useState } from "react";
import { getFirebaseErrorMessage, listStudentsForTeacher } from "@/lib/firebase";
import type { StudentRecord } from "@/lib/firebase/student-auth";
import type { WorksheetSubmission } from "@/lib/firebase/submissions";

type SubmissionStatus = "submitted" | "draft" | "none";

interface StudentRow {
  student: StudentRecord;
  status: SubmissionStatus;
  submittedCount: number;
  draftCount: number;
}

function classKey(grade: string, classNo: string): string {
  return `${grade}::${classNo}`;
}

function classLabel(grade: string, classNo: string): string {
  return `${grade}학년 ${classNo}반`;
}

function summarizeStudent(uid: string, submissions: WorksheetSubmission[]): Omit<StudentRow, "student"> {
  const mine = submissions.filter((s) => s.studentUid === uid);
  const submittedCount = mine.filter((s) => s.status === "submitted").length;
  const draftCount = mine.filter((s) => s.status === "draft").length;

  if (submittedCount > 0) {
    return { status: "submitted", submittedCount, draftCount };
  }
  if (draftCount > 0) {
    return { status: "draft", submittedCount, draftCount };
  }
  return { status: "none", submittedCount: 0, draftCount: 0 };
}

function statusBadge(status: SubmissionStatus): { label: string; className: string } {
  if (status === "submitted") {
    return { label: "제출", className: "bg-emerald-100 text-emerald-800" };
  }
  if (status === "draft") {
    return { label: "작성 중", className: "bg-amber-100 text-amber-800" };
  }
  return { label: "미작성", className: "bg-slate-100 text-slate-600" };
}

interface TeacherClassRosterProps {
  submissions: WorksheetSubmission[];
  teacherUid: string;
}

export function TeacherClassRoster({ submissions, teacherUid }: TeacherClassRosterProps) {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [nameSearch, setNameSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    listStudentsForTeacher(teacherUid)
      .then((items) => {
        if (!cancelled) setStudents(items);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(getFirebaseErrorMessage(err, "학생 명단을 불러오지 못했습니다."));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [teacherUid]);

  const classes = useMemo(() => {
    const map = new Map<string, { grade: string; classNo: string; count: number }>();
    for (const s of students) {
      const key = classKey(s.grade, s.classNo);
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, { grade: s.grade, classNo: s.classNo, count: 1 });
      }
    }
    return Array.from(map.entries())
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => {
        const g = a.grade.localeCompare(b.grade, "ko");
        if (g !== 0) return g;
        return a.classNo.localeCompare(b.classNo, "ko", { numeric: true });
      });
  }, [students]);

  useEffect(() => {
    if (classes.length === 0) {
      setSelectedClass("");
      return;
    }
    if (!selectedClass || !classes.some((c) => c.key === selectedClass)) {
      setSelectedClass(classes[0].key);
    }
  }, [classes, selectedClass]);

  const rows = useMemo(() => {
    if (!selectedClass) return [];

    const [grade, classNo] = selectedClass.split("::");
    const query = nameSearch.trim().toLowerCase();

    return students
      .filter((s) => s.grade === grade && s.classNo === classNo)
      .filter((s) => !query || s.studentName.toLowerCase().includes(query) || s.studentNo.includes(query))
      .map((student) => ({
        student,
        ...summarizeStudent(student.uid, submissions),
      }));
  }, [students, selectedClass, nameSearch, submissions]);

  const stats = useMemo(() => {
    const submitted = rows.filter((r) => r.status === "submitted").length;
    const draft = rows.filter((r) => r.status === "draft").length;
    const none = rows.filter((r) => r.status === "none").length;
    return { submitted, draft, none, total: rows.length };
  }, [rows]);

  const selectedClassInfo = classes.find((c) => c.key === selectedClass);

  if (loading) {
    return (
      <section className="mt-8">
        <h2 className="text-lg font-bold text-slate-800">반별 제출 현황</h2>
        <p className="mt-3 text-sm text-slate-500">학생 명단 불러오는 중...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-8">
        <h2 className="text-lg font-bold text-slate-800">반별 제출 현황</h2>
        <p className="mt-3 text-sm text-red-600">{error}</p>
      </section>
    );
  }

  if (students.length === 0) {
    return (
      <section className="mt-8">
        <h2 className="text-lg font-bold text-slate-800">반별 제출 현황</h2>
        <p className="mt-3 rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
          등록된 학생이 없습니다. 학생이 로그인하면 명단에 표시됩니다.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800">반별 제출 현황</h2>
          <p className="mt-1 text-sm text-slate-600">반을 선택하고 이름으로 검색해 제출 여부를 확인하세요.</p>
        </div>
        <label className="flex min-w-[12rem] flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">학생 이름 검색</span>
          <input
            type="search"
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            placeholder="이름 또는 번호"
            className="ui-input"
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {classes.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setSelectedClass(c.key)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
              selectedClass === c.key
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {classLabel(c.grade, c.classNo)} ({c.count}명)
          </button>
        ))}
      </div>

      {selectedClassInfo && (
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">제출 {stats.submitted}명</span>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-800">작성 중 {stats.draft}명</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">미작성 {stats.none}명</span>
          <span className="text-slate-500">총 {stats.total}명</span>
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold">번호</th>
              <th className="px-4 py-3 font-semibold">이름</th>
              <th className="px-4 py-3 font-semibold">제출 상태</th>
              <th className="px-4 py-3 font-semibold">제출 건수</th>
              <th className="px-4 py-3 font-semibold">작성 중</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  {nameSearch.trim() ? "검색 결과가 없습니다." : "표시할 학생이 없습니다."}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const badge = statusBadge(row.status);
                return (
                  <tr key={row.student.uid} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 text-slate-600">{row.student.studentNo || "-"}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{row.student.studentName}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{row.submittedCount}</td>
                    <td className="px-4 py-3 text-slate-700">{row.draftCount}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
