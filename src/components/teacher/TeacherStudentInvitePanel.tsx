"use client";

import { useMemo, useState } from "react";
import { TeacherInviteShareButton } from "@/components/teacher/TeacherInviteShareButton";
import { getSortedTemplates } from "@/lib/templates/registry";
import { formatTemplateTitle } from "@/lib/templates/curriculum";

interface TeacherStudentInvitePanelProps {
  teacherUid: string;
}

export function TeacherStudentInvitePanel({ teacherUid }: TeacherStudentInvitePanelProps) {
  const templates = useMemo(() => getSortedTemplates(), []);
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");

  return (
    <section className="ui-card mt-8 border-violet-100 bg-violet-50/30 p-6">
      <h2 className="text-lg font-bold text-violet-950">학생 작성 공유 링크</h2>
      <p className="mt-2 text-sm leading-relaxed text-violet-900/80">
        링크를 복사해 학생에게 전달하세요. 학생은 링크에서 <strong>학년·반·번호·이름·암호(2600)</strong>를 입력한 뒤
        바로 작성할 수 있습니다.
      </p>

      <div className="mt-5">
        <label className="block">
          <span className="ui-label">활동지 유형 (활동지·2분할 공유 시)</span>
          <select
            className="ui-input mt-1"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
          >
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {formatTemplateTitle(t)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <TeacherInviteShareButton teacherUid={teacherUid} mode="worksheet" templateId={templateId} />
        <TeacherInviteShareButton teacherUid={teacherUid} mode="report" />
        <TeacherInviteShareButton
          teacherUid={teacherUid}
          mode="workspace"
          templateId={templateId}
          className="ui-btn-accent ui-btn-sm"
        />
      </div>
    </section>
  );
}
