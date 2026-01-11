import { ReactElement } from "react";
import AppLayout from "layouts/AppLayout";
import { withAuth } from "utils/auth/serverAuth";
import type { NextPageWithLayout } from "types/page";
import { ChallengesView } from "feature/challenges/frontend/infrastructure/ui/ChallengesView";

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
