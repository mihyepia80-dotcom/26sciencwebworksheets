"use client";

import { GuestNotice } from "@/components/common/GuestNotice";
import { StudentBadgeBar } from "@/components/student/StudentBadgeBar";
import { useAuth } from "@/components/AuthProvider";
import { isGuest } from "@/lib/auth/access";

export function HomeGuestNotice() {
  const { user, role } = useAuth();
  if (!isGuest(user, role)) return null;
  return (
    <div className="mb-8">
      <GuestNotice />
    </div>
  );
}

export function HomeStudentBadgeBar() {
  return <StudentBadgeBar />;
}
