import Guitar from "layouts/HeroLayout/components/Guitar";
import MainLayout from "layouts/MainLayout";
import type { layoutVariant } from "layouts/MainLayout/MainLayout";
import { useTranslation } from "react-i18next";

function PageLoadingSpinner({
  layoutVariant,
}: {
  layoutVariant: layoutVariant;
}) {
  const { t } = useTranslation("common");
  return (
    <MainLayout subtitle={t("loading.subtitle")} variant={layoutVariant}>
      <div className='relative flex h-1/2 w-full items-start justify-center lg:items-center'>
        <div className='relative flex aspect-square  w-2/5 max-w-[150px] -translate-y-[40%] items-start justify-center lg:w-1/5 lg:translate-y-0'>
          <Guitar />
          <p className='absolute bottom-[50%] left-[50%] z-50 -translate-x-[50%] text-center text-xl lg:bottom-[60%] lg:text-3xl'>
            {t("loading.loading_text")}
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
export default PageLoadingSpinner;
