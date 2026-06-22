import Link from "next/link";

export function GuestNotice({ compact }: { compact?: boolean }) {
  return (
    <div
      className={
        compact
          ? "rounded-lg border border-amber-200 bg-amber-50/90 px-4 py-2.5 text-sm leading-relaxed text-amber-950"
          : "ui-banner border-amber-200 bg-amber-50/90 text-amber-950"
      }
    >
      로그인 없이 <strong>체험·작성</strong>만 가능합니다. 내용은 저장되지 않으며 페이지를 나가면 사라집니다.{" "}
      <Link href="/login" className="font-semibold text-blue-700 underline-offset-2 hover:underline">
        학생 로그인
      </Link>
      후 임시 저장·제출·내 활동지 기록을 이용할 수 있습니다.
    </div>
  );
}
