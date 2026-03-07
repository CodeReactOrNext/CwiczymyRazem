import { SummaryView } from "feature/aiSummary/view/SummaryView";
import { PremiumGate } from "feature/premium/components/PremiumGate";
import AppLayout from "layouts/AppLayout/AppLayout";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";

const SummaryPage: NextPageWithLayout = () => {
  return (
    <PremiumGate feature="summary">
      <SummaryView />
    </PremiumGate>
  );
};

SummaryPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId="summary" variant="secondary">
      {page}
    </AppLayout>
  );
};

export default SummaryPage;

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: ["common", "profile", "footer", "achievements", "toast", "skills", "songs", "chat", "my_plans", "exercises"],
});
