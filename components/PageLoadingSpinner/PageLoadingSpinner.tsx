import Guitar from "layouts/HeroLayout/components/Guitar";
import MainLayout from "layouts/MainLayout";
import type { layoutVariant } from "layouts/MainLayout/MainLayout";

function PageLoadingSpinner({
  layoutVariant,
}: {
  layoutVariant: layoutVariant;
}) {
  return (
    <MainLayout subtitle={"Loading..."} variant={layoutVariant}>
      <div className='relative flex h-full w-full justify-center'>
        <div className='relative flex w-full -translate-y-[40%] items-start justify-center lg:w-7/12 lg:translate-y-0'>
          <Guitar />
          <p className='absolute bottom-[20%] left-[50%] z-50 -translate-x-[50%] text-center text-8xl lg:bottom-[50%]'>
            Loading...
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
export default PageLoadingSpinner;
