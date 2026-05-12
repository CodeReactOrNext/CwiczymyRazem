import { HeroBanner } from "components/UI/HeroBanner";
import { PlanSelector } from "feature/practice/views/PlanSelector/PlanSelector";
import AppLayout from "layouts/AppLayout";
import { useRouter } from "next/router";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";

const PlanSelectorPage: NextPageWithLayout = () => {
    const router = useRouter();
    return (
      <div className="bg-second-600 rounded-xl overflow-visible flex flex-col border-none shadow-sm min-h-screen lg:mt-16">
        <HeroBanner
          title="Exercises"
          subtitle="Build your skills with focused practice exercises"
          eyebrow="Exercise Hub"
          className="w-full !rounded-none !shadow-none min-h-[100px] md:min-h-[90px] lg:min-h-[100px]"
          rightContent={
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors border border-white/10 rounded-lg hover:bg-white/5"
            >
              Back
            </button>
          }
        />
        <PlanSelector />
      </div>
    );
}

PlanSelectorPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId="exercise" variant="secondary">
      {page}
    </AppLayout>
  );
};

export default PlanSelectorPage;
