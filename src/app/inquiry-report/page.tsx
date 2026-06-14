"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { InquiryReportEditor } from "@/components/inquiry-report/InquiryReportEditor";

function InquiryReportPageInner() {
  const searchParams = useSearchParams();
  const reportId = searchParams.get("report");

  return <InquiryReportEditor initialReportId={reportId} />;
}

export default function InquiryReportPage() {
  return (
    <Suspense fallback={<p className="py-20 text-center text-sm text-slate-500">로딩 중...</p>}>
      <InquiryReportPageInner />
    </Suspense>
  );
}
