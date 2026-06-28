"use client";

import type { ReactNode } from "react";
import { ROSTER_TABLE_MAX_HEIGHT } from "@/lib/group-activity/prd";

interface RosterScrollTableProps {
  stickyNoLabel?: string;
  stickyNameLabel?: string;
  children: ReactNode;
}

/** 번호·이름 열 고정 + 세로 스크롤 (엑셀 틀 고정과 유사) */
export function RosterScrollTable({
  stickyNoLabel = "번호",
  stickyNameLabel = "이름",
  children,
}: RosterScrollTableProps) {
  return (
    <div className="ui-table-wrap" style={{ maxHeight: ROSTER_TABLE_MAX_HEIGHT }}>
      <table className="ui-table">{children}</table>
    </div>
  );
}

export function RosterStickyHead({
  noLabel = "번호",
  nameLabel = "이름",
  extraHeaders,
}: {
  noLabel?: string;
  nameLabel?: string;
  extraHeaders: ReactNode;
}) {
  return (
    <thead className="ui-table-head">
      <tr className="border-b text-left">
        <th className="ui-table-cell sticky left-0 z-40 min-w-[5rem] border-r border-slate-200 bg-slate-100/95">
          {noLabel}
        </th>
        <th className="ui-table-cell sticky left-[5rem] z-40 min-w-[8rem] border-r border-slate-200 bg-slate-100/95">
          {nameLabel}
        </th>
        {extraHeaders}
      </tr>
    </thead>
  );
}

export function RosterStickyRow({
  studentNo,
  studentName,
  cells,
}: {
  studentNo: string;
  studentName: string;
  cells: ReactNode;
}) {
  return (
    <tr className="border-b border-slate-100 hover:bg-violet-50/40">
      <td className="ui-table-cell sticky left-0 z-20 min-w-[5rem] border-r border-slate-100 bg-white font-semibold">
        {studentNo}
      </td>
      <td className="ui-table-cell sticky left-[5rem] z-20 min-w-[8rem] border-r border-slate-100 bg-white">
        {studentName}
      </td>
      {cells}
    </tr>
  );
}
