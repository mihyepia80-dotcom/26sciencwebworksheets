import { Suspense } from "react";
import { notFound } from "next/navigation";
import { WorksheetViewer } from "@/components/WorksheetViewer";
import { getTemplateById } from "@/lib/templates/registry";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const { getSortedTemplates } = await import("@/lib/templates/registry");
  return getSortedTemplates().map((t) => ({ id: t.id }));
}

export default async function TemplatePage({ params }: PageProps) {
  const { id } = await params;
  const template = getTemplateById(id);
  if (!template) notFound();

  return (
    <Suspense fallback={<div className="px-4 py-16 text-center text-sm text-slate-500">로딩 중...</div>}>
      <WorksheetViewer templateId={id} />
    </Suspense>
  );
}
