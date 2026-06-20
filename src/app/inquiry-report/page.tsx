"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { InquiryReportEditor } from "@/components/inquiry-report/InquiryReportEditor";
import { useAuth } from "@/components/AuthProvider";

function InquiryReportRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { role } = useAuth();
  const report = searchParams.get("report");

  useEffect(() => {
    if (role === "student") {
      const q = report ? `?report=${report}` : "";
      router.replace(`/workspace${q}`);
    }
  }, [report, role, router]);

  if (role === "student") {
    return <p className="py-20 text-center text-sm text-slate-500">탐구 활동실로 이동 중…</p>;
  }

  return <InquiryReportEditor initialReportId={report} />;
}

export default function InquiryReportPage() {
  return (
    <Suspense fallback={<p className="py-20 text-center text-sm text-slate-500">로딩 중...</p>}>
      <InquiryReportRedirectInner />
    </Suspense>
  );
}
