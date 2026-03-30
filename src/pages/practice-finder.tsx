import { HeroBanner } from "components/UI/HeroBanner";
import PracticeFinderView from "feature/aiCoach/view/PracticeFinderView/PracticeFinderView";
import { PremiumGate } from "feature/premium/components/PremiumGate";
import AppLayout from "layouts/AppLayout/AppLayout";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";

const PracticeFinderPage: NextPageWithLayout = () => {
  return (
    <div className="bg-second-600 rounded-xl overflow-visible flex flex-col border-none shadow-sm min-h-screen lg:mt-16">
      <HeroBanner
        title="Practice Finder"
        subtitle="Describe what you want to practice and get matching exercises and lessons"
        eyebrow="AI Search"
        eyebrowClassName="text-cyan-400"
        className="w-full !rounded-none !shadow-none min-h-[100px] md:min-h-[90px] lg:min-h-[100px]"
      />
      <PremiumGate feature="practice-finder" requiredPlan="master">
        <PracticeFinderView />
      </PremiumGate>
    </div>
  );
};

PracticeFinderPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout
      pageId="practice-finder"
      subtitle="Practice Finder"
      variant="secondary"
    >
      {page}
    </AppLayout>
  );
};

export default PracticeFinderPage;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: [
    "common",
    "profile",
    "footer",
    "achievements",
    "toast",
    "skills",
    "songs",
    "chat",
    "my_plans",
    "exercises",
  ],
});
