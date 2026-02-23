import AiCoachView from "feature/aiCoach/view/AiCoachView";
import AppLayout from "layouts/AppLayout/AppLayout";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";

const AiCoachPage: NextPageWithLayout = () => {
  return <AiCoachView />;
};

AiCoachPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout
      pageId="ai-coach"
      subtitle="AI Coach"
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
