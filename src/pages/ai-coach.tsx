import { HeroBanner } from "components/UI/HeroBanner";
import AiCoachView from "feature/aiCoach/view/AiCoachView";
import { PremiumGate } from "feature/premium/components/PremiumGate";
import { selectUserInfo } from "feature/user/store/userSlice";
import { useAppSelector } from "store/hooks";
import AppLayout from "layouts/AppLayout/AppLayout";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";

const AiCoachPage: NextPageWithLayout = () => {
  const userInfo = useAppSelector(selectUserInfo);
  const isPremium = userInfo?.role === "pro" || userInfo?.role === "master" || userInfo?.role === "admin";

  return (
    <div className="bg-second-600 rounded-xl overflow-visible flex flex-col border-none shadow-sm min-h-screen lg:mt-16">
      {!isPremium && userInfo !== null && (
        <HeroBanner
          title="Roadmap"
          subtitle="Get personalized guidance for your practice"
          eyebrow="Generate your path"
          className="w-full !rounded-none !shadow-none min-h-[100px] md:min-h-[90px] lg:min-h-[100px]"
        />
      )}
      <PremiumGate feature="ai-coach">
        <AiCoachView />
      </PremiumGate>
    </div>
  );
};

AiCoachPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout
      pageId="ai-coach"
      subtitle="Roadmap"
      variant="secondary"
    >
      {page}
    </AppLayout>
  );
};

export default AiCoachPage;

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
