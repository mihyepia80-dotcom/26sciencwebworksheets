import { Suspense } from "react";
import { InquiryWorkspace } from "@/components/inquiry-workspace/InquiryWorkspace";

export default function WorkspacePage() {
  return (
    <Suspense fallback={<p className="py-20 text-center text-sm text-slate-500">로딩 중…</p>}>
      <InquiryWorkspace />
    </Suspense>
  );
}
