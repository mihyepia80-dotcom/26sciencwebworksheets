import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { StudentTemplateGrid } from "@/components/student/StudentTemplateGrid";
import { getSortedTemplates } from "@/lib/templates/registry";

export default function HomePage() {
  const templates = getSortedTemplates();

  return (
    <div className="min-h-screen">
      <AppHeader
        title="사고도구 톡톡"
        subtitle={`과학 탐구 글쓰기 학습지 · ${templates.length}개 사고도구`}
      />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <section className="mb-10">
          <Link
            href="/inquiry-report"
            className="block rounded-xl border-2 border-violet-200 bg-gradient-to-r from-violet-50 to-blue-50 p-6 shadow-sm transition hover:border-violet-300 hover:shadow-md"
          >
            <h2 className="text-xl font-bold text-violet-900">학생용 탐구보고서</h2>
            <p className="mt-2 text-sm text-slate-600">
              실험 제목·준비물·과정·결과·결론을 작성해 제출하세요.
            </p>
          </Link>
        </section>

        <StudentTemplateGrid />
      </main>
    </div>
  );
}
