import { ChallengesView } from "feature/challenges/frontend/infrastructure/ui/ChallengesView";
import AppLayout from "layouts/AppLayout";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";

const ChallengesPage: NextPageWithLayout = () => {
  return <ChallengesView />;
};

ChallengesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId={"challenges"} subtitle='Challenges' variant='secondary'>
      {page}
    </AppLayout>
  );
};

export default ChallengesPage;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: ["common", "timer", "toast", "exercises", "report",'rating_popup'],
});
