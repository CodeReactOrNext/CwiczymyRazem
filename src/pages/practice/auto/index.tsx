import { AutoPlanGenerator } from "feature/practice/views/AutoPlanGenerator/AutoPlanGenerator";
import AppLayout from "layouts/AppLayout";
import { useRouter } from "next/router";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";

const AutoPlanGeneratorPage: NextPageWithLayout = () => {
    const router = useRouter();
    return <AutoPlanGenerator onBack={() => router.back()} />;
}

AutoPlanGeneratorPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId="exercise" variant="secondary" subtitle="Auto Plan">
      {page}
    </AppLayout>
  );
};

export default AutoPlanGeneratorPage;
