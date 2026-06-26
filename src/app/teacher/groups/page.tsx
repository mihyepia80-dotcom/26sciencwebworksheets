import Link from "next/link";
import { GroupActivityManager } from "@/components/teacher/GroupActivityManager";

export default function TeacherGroupsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/teacher" className="text-sm text-blue-600 hover:underline">
        ← 교사 대시보드
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">모둠 활동</h1>
            <p className="mt-2 text-sm text-slate-600">
        명렬표·성적 분포·분리 조건·6모둠 편성·주간 역할·모둠 활동 칭찬을 반별로 관리합니다. 엑셀 양식 다운로드·업로드를 지원합니다.
      </p>
      <div className="mt-8">
        <GroupActivityManager />
      </div>
    </div>
  );
}
