"use client";

import type { ReactNode } from "react";

interface MemoPadProps {
  children: ReactNode;
  /** 짧은 한 줄·소형 입력용 — 테이프 크기 축소 */
  inline?: boolean;
  className?: string;
}

/** 학습지 답안 영역을 포스트잇(메모지) 형태로 감싸는 래퍼 */
export function MemoPad({ children, inline = false, className = "" }: MemoPadProps) {
  return (
    <div className={`ui-memo-wrap ${inline ? "ui-memo-wrap--inline" : ""} ${className}`.trim()}>
      <div className="ui-memo-tape" aria-hidden />
      {children}
    </div>
  );
}
