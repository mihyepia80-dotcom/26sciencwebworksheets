import Link from "next/link";
import { WorksheetContentEditor } from "@/components/teacher/WorksheetContentEditor";

export default function TeacherWorksheetContentPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/teacher" className="text-sm text-blue-600 hover:underline">
        ← 교사 대시보드
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">학습지 고정 텍스트 편집</h1>
      <p className="mt-2 text-sm text-slate-600">
        탐구 리마인더·글쓰기 안내 등 학습지에 고정된 문구를 수정하고 배포하면, 학생 화면에 실시간으로
        반영됩니다.
      </p>
      <div className="mt-8">
        <WorksheetContentEditor />
      </div>
    </div>
  );
}
