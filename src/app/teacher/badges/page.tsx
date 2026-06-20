import Link from "next/link";
import { TeacherBadgeManager } from "@/components/teacher/TeacherBadgeManager";

export default function TeacherBadgesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/teacher" className="text-sm text-blue-600 hover:underline">
        ← 교사 대시보드
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">칭찬 배지 관리</h1>
      <p className="mt-2 text-sm text-slate-600">
        학생에게 디지털 칭찬 배지를 부여하고, 배지 종류를 추가·수정할 수 있습니다.
      </p>
      <div className="mt-8">
        <TeacherBadgeManager />
      </div>
    </div>
  );
}
