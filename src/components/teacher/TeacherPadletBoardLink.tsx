"use client";

const INPUT = "ui-input-compact w-full";

interface TeacherPadletBoardLinkProps {
  grade: number;
  classNo: number;
  unitId: string;
  periods: number[];
  title: string;
  onChange: (patch: Partial<{
    grade: number;
    classNo: number;
    unitId: string;
    periods: number[];
    title: string;
  }>) => void;
}

export function TeacherPadletBoardLink({
  grade,
  classNo,
  unitId,
  periods,
  title,
  onChange,
}: TeacherPadletBoardLinkProps) {
  const periodText = periods.join(",");

  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4 space-y-3">
      <h3 className="text-sm font-bold text-teal-950">학급·단원 연결 (F-25)</h3>
      <p className="text-xs text-teal-900/80">
        번호 컬럼 보드를 생성하면 Firestore에 boardId·columnMap이 저장되어 학생 게시에 사용됩니다.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="ui-label" htmlFor="padlet-grade">학년</label>
          <input
            id="padlet-grade"
            type="number"
            min={1}
            max={6}
            className={INPUT}
            value={grade || ""}
            onChange={(e) => onChange({ grade: Number(e.target.value) || 0 })}
          />
        </div>
        <div>
          <label className="ui-label" htmlFor="padlet-class">반</label>
          <input
            id="padlet-class"
            type="number"
            min={1}
            max={20}
            className={INPUT}
            value={classNo || ""}
            onChange={(e) => onChange({ classNo: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="ui-label" htmlFor="padlet-title">보드 제목</label>
          <input
            id="padlet-title"
            type="text"
            className={INPUT}
            value={title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder="용해와 용액 · 5학년 3반"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="ui-label" htmlFor="padlet-periods">연결 차시 (쉼표 구분)</label>
          <input
            id="padlet-periods"
            type="text"
            className={INPUT}
            value={periodText}
            onChange={(e) =>
              onChange({
                periods: e.target.value
                  .split(",")
                  .map((s) => Number(s.trim()))
                  .filter((n) => n > 0),
              })
            }
            placeholder="1,2,3,4,5,6,7,8"
          />
        </div>
      </div>
      <input type="hidden" value={unitId} readOnly />
    </div>
  );
}
