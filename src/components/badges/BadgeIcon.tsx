import type { BadgeIconKey } from "@/lib/badges/types";

interface ShirtIconProps {
  variant: BadgeIconKey;
  className?: string;
}

const FILL: Record<BadgeIconKey, { body: string; sleeve: string }> = {
  "shirt-green": { body: "#22c55e", sleeve: "#16a34a" },
  "shirt-blue": { body: "#3b82f6", sleeve: "#2563eb" },
  "shirt-purple": { body: "#a855f7", sleeve: "#9333ea" },
  "shirt-amber": { body: "#f59e0b", sleeve: "#d97706" },
  "shirt-rose": { body: "#f43f5e", sleeve: "#e11d48" },
};

/** 둥근 배지 안에 표시할 상의 아이콘 SVG */
export function ShirtBadgeIcon({ variant, className = "h-8 w-8" }: ShirtIconProps) {
  const colors = FILL[variant] ?? FILL["shirt-green"];
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        d="M16 8 L24 14 L32 8 L38 14 L34 20 L34 40 L14 40 L14 20 L10 14 Z"
        fill={colors.body}
      />
      <path d="M16 8 L14 20 L18 18 L24 22 L30 18 L34 20 L32 8" fill={colors.sleeve} opacity="0.85" />
      <circle cx="24" cy="28" r="3" fill="white" opacity="0.35" />
    </svg>
  );
}

interface BadgeCircleProps {
  iconKey: BadgeIconKey;
  label: string;
  size?: "sm" | "md" | "lg";
  title?: string;
}

const SIZE = {
  sm: { outer: "h-10 w-10", icon: "h-5 w-5", text: "text-[9px]" },
  md: { outer: "h-14 w-14", icon: "h-8 w-8", text: "text-[10px]" },
  lg: { outer: "h-16 w-16", icon: "h-9 w-9", text: "text-xs" },
};

export function BadgeCircle({ iconKey, label, size = "md", title }: BadgeCircleProps) {
  const s = SIZE[size];
  return (
    <div className="flex flex-col items-center gap-1" title={title ?? label}>
      <div
        className={`flex items-center justify-center rounded-full border-2 border-white bg-gradient-to-b from-white to-slate-50 shadow-md ring-2 ring-slate-200/80 ${s.outer}`}
      >
        <ShirtBadgeIcon variant={iconKey} className={s.icon} />
      </div>
      <span className={`max-w-[4.5rem] text-center font-medium leading-tight text-slate-700 ${s.text}`}>
        {label}
      </span>
    </div>
  );
}
