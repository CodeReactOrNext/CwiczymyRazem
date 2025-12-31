import { PlanSelector } from "feature/practice/views/PlanSelector/PlanSelector";

import { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import AppLayout from "layouts/AppLayout";
import { useRouter } from "next/router";

const PlanSelectorPage: NextPageWithLayout = () => {
    const router = useRouter();
    return <PlanSelector onBack={() => router.back()} />;
}

PlanSelectorPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId="exercise" variant="secondary" subtitle="Plans">
      {page}
    </AppLayout>
  );
};

export default PlanSelectorPage;
