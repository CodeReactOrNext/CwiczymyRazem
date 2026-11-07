import { HeroBanner, HeroPattern } from "components/UI/HeroBanner";
import { WhatNextView } from "feature/whatNext/components/WhatNextView";
import { useTranslation } from "hooks/useTranslation";
import AppLayout from "layouts/AppLayout";
import type { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";
import { withAuthInitialProps } from "utils/auth/authInitialProps";

const WhatNextPage: NextPageWithLayout = () => {
  const { t } = useTranslation("what_next");

  return (
    <div className='flex min-h-screen flex-col overflow-visible rounded-lg'>
      <HeroBanner
        title={t("page.title")}
        subtitle={t("page.subtitle")}
        eyebrow={t("page.eyebrow")}
        eyebrowClassName='text-cyan-400/80'
        backgroundContent={<HeroPattern />}
        className='mb-8 min-h-[100px] w-full !rounded-none !shadow-none md:min-h-[90px] lg:min-h-[100px]'
      />
      <WhatNextView />
    </div>
  );
};

WhatNextPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId='what-next' variant='secondary' wide>
      {page}
    </AppLayout>
  );
};

WhatNextPage.getInitialProps = withAuthInitialProps();

export default WhatNextPage;
