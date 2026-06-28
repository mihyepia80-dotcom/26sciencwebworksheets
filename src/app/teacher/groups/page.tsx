import Link from "next/link";
import { GroupActivityManager } from "@/components/teacher/GroupActivityManager";

export default function TeacherGroupsPage() {
  return (
    <div className="page-main">
      <Link href="/teacher" className="ui-link text-violet-700">
        ← 교사 대시보드
      </Link>

      <header className="ui-panel-soft mt-6">
        <p className="text-base font-semibold uppercase tracking-wide text-violet-600">교사 · 모둠 활동</p>
        <h1 className="ui-page-title mt-2 text-violet-950">모둠 활동 관리</h1>
        <p className="ui-page-desc text-slate-700">
          명렬표·성적 분포·분리 조건·6모둠 편성·주간 역할·모둠 활동 칭찬을 반별로 관리합니다.
        </p>
      </header>

      <div className="mt-10">
        <GroupActivityManager />
      </div>
    </div>
  );
}
