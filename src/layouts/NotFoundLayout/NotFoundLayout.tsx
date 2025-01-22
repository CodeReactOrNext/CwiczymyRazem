/* eslint-disable @next/next/no-img-element */
import OldEffect from "components/OldEffect";
import Fire_double from "public/static/images/svg/Fire_double";
import { useTranslation } from "react-i18next";

const NotFoundLayout = () => {
  const { t } = useTranslation("404");

  return (
    <>
      <OldEffect />
      <div className='relative z-40 -mb-16 flex h-full w-full flex-col justify-center lg:flex-row'>
        <div className='absolute bottom-0 left-0 z-0 my-auto w-full overflow-hidden'>
          <Fire_double className='h-full w-full translate-y-[76%] fill-main-500' />
        </div>
        <div className='absolute top-0 left-0 flex h-[40%] w-full flex-col items-center justify-start gap-6 lg:h-full'>
          <p className='text-center text-6xl  md:text-9xl  lg:text-9xl'>404</p>
          <p className='text-center text-6xl  md:text-8xl lg:text-9xl'>
            {t("page_not_found")}
          </p>
        </div>
        <div className='absolute bottom-0 z-10 flex aspect-square h-4/5 justify-center overflow-hidden'>
          <img
            className='aspect-square h-full'
            src={"/static/images/404_not_found.webp"}
            alt='not found'
          />
        </div>
      </div>
    </>
  );
};
export default NotFoundLayout;
