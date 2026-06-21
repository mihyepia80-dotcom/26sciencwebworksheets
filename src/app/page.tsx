import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { StudentBadgeBar } from "@/components/student/StudentBadgeBar";
import { StudentTemplateGrid } from "@/components/student/StudentTemplateGrid";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <AppHeader
        title="사고도구 톡톡"
        subtitle="탐구 단계별 사고기법 학습지"
      />

      <main className="page-main">
        <StudentBadgeBar />

        <section className="mb-12">
          <Link
            href="/workspace"
            className="ui-card flex items-center justify-between gap-6 p-6 transition hover:border-violet-200 hover:shadow-md"
          >
            <div>
              <h2 className="ui-section-title text-violet-900">탐구 활동실</h2>
              <p className="ui-section-desc">
                사고 활동지와 탐구보고서를 한 화면에서 작성하세요.
              </p>
            </div>
            <span className="ui-btn-accent ui-btn-sm shrink-0">시작하기</span>
          </Link>
        </section>

        <StudentTemplateGrid />
      </main>
    </div>
  );
}
