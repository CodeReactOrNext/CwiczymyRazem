import { HeroBanner } from "components/UI/HeroBanner";
import PracticeFinderView from "feature/aiCoach/view/PracticeFinderView/PracticeFinderView";
import { PremiumFeaturePreview } from "feature/premium/components/PremiumFeaturePreview";
import { PremiumGate } from "feature/premium/components/PremiumGate";
import { selectUserInfo } from "feature/user/store/userSlice";
import AppLayout from "layouts/AppLayout/AppLayout";
import { BookOpen, Lightbulb, Search, Zap } from "lucide-react";
import type { ReactElement } from "react";
import { useAppSelector } from "store/hooks";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";

const PracticeFinderPage: NextPageWithLayout = () => {
  const userInfo = useAppSelector(selectUserInfo);
  const isMaster = userInfo?.role === "master" || userInfo?.role === "admin";

  // Show premium preview for non-master users
  if (!isMaster && userInfo !== null) {
    return (
      <PremiumFeaturePreview
        eyebrow="AI Search"
        title="Practice Finder"
        description="Describe what you want to practice in your own words and get AI-powered recommendations for matching exercises and lessons tailored to your skill level."
        features={[
          {
            icon: <Search className="h-5 w-5" />,
            label: "Natural Language Search",
            description: "Ask what you want to practice using conversational language",
          },
          {
            icon: <Lightbulb className="h-5 w-5" />,
            label: "Smart Recommendations",
            description: "Get AI-curated exercises and lessons matching your request",
          },
          {
            icon: <BookOpen className="h-5 w-5" />,
            label: "Custom Results",
            description: "Results tailored to your current skill level and goals",
          },
          {
            icon: <Zap className="h-5 w-5" />,
            label: "Instant Discovery",
            description: "Find practice materials without endless browsing",
          },
        ]}
        availableIn="master"
      />
    );
  }

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
