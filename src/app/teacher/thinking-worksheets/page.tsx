import { Suspense } from "react";
import Link from "next/link";
import { ThinkingWorksheetDesign } from "@/components/teacher/ThinkingWorksheetDesign";

export default function ThinkingWorksheetsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/teacher" className="text-sm text-blue-600 hover:underline">
        ← 교사 대시보드
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">사고 활동지</h1>
      <p className="mt-2 text-sm text-slate-600">
        단원·차시·학습 주제에 맞는 사고 활동지(사고도구)를 선택합니다. 선택 내용은 수업지도안·학습지 텍스트
        편집과 연결됩니다.
      </p>
      <div className="mt-8">
        <Suspense fallback={<p className="text-sm text-slate-500">불러오는 중…</p>}>
          <ThinkingWorksheetDesign />
        </Suspense>
      </div>
    </div>
  );
}
