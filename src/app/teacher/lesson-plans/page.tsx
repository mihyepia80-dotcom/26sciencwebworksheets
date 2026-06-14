"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { LessonPlanManager } from "@/components/teacher/LessonPlanManager";

function LessonPlansPageInner() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan");
  return <LessonPlanManager initialPlanId={planId} />;
}

export default function LessonPlansPage() {
  return (
    <Suspense fallback={<p className="py-20 text-center text-sm text-slate-500">로딩 중...</p>}>
      <LessonPlansPageInner />
    </Suspense>
  );
}
