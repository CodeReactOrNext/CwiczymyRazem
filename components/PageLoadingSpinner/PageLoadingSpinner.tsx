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
      <div className='relative flex h-full w-full justify-center'>
        <div className='relative flex w-full -translate-y-[40%] items-start justify-center lg:w-7/12 lg:translate-y-0'>
          <Guitar />
          <p className='absolute bottom-[20%] left-[50%] z-50 -translate-x-[50%] text-center text-8xl lg:bottom-[50%]'>
            {t("loading.loading_text")}
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
export default PageLoadingSpinner;
