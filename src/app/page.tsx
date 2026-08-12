import { AppHeader } from "@/components/AppHeader";
import { HomeGuestNotice } from "@/components/home/HomeGuestSections";
import { HomeConsentWrapper } from "@/components/legal/HomeConsentWrapper";
import { HomeServiceConsentSection } from "@/components/legal/HomeServiceConsentSection";
import { SitePolicyLinks } from "@/components/legal/SitePolicyLinks";
import { SiteLegalFooter } from "@/components/legal/SiteLegalFooter";
import { StudentGroupRoleCard } from "@/components/student/StudentGroupRoleCard";
import { StudentBadgeBar } from "@/components/student/StudentBadgeBar";
import { StudentTemplateGrid } from "@/components/student/StudentTemplateGrid";

export default function HomePage() {
  return (
    <HomeConsentWrapper>
      <div className="min-h-screen">
        <AppHeader
          title="사고도구 톡톡"
          subtitle="탐구 단계별 사고기법 학습지"
        />

        <main className="page-main">
          <HomeServiceConsentSection />
          <HomeGuestNotice />

          <StudentTemplateGrid />

          <aside className="home-secondary-panel mt-12 space-y-6">
            <StudentBadgeBar />
            <StudentGroupRoleCard />
          </aside>

          <SitePolicyLinks />
          <SiteLegalFooter className="mt-10" />
        </main>
      </div>
    </HomeConsentWrapper>
  );
}
