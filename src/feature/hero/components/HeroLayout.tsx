/* eslint-disable @next/next/no-img-element */
import { Button } from "assets/components/ui/button";
import OldEffect from "components/OldEffect";
import Guitar from "feature/hero/components/Guitar";
import { HeroSlogan } from "feature/hero/components/HeroSlogan";
import Link from "next/link";
import FireDoubleSVG from "public/static/images/svg/Fire_double";
import { useTranslation } from "react-i18next";

interface HeroProps {
  children: React.ReactElement;
  buttonOnClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export const HeroLayout = ({ children, buttonOnClick }: HeroProps) => {
  const { t } = useTranslation(["profile", "common"]);

  return (
    <div className='grid h-full w-full grid-cols-1 grid-rows-2 gap-[20%] lg:grid-cols-[4fr_5fr] lg:grid-rows-1'>
      <div className='relative h-full w-full'>
        <div className='absolute bottom-0 top-0 h-full w-full '>
          <FireDoubleSVG className='absolute left-0 right-0 top-[60%] w-[110%] -translate-x-[7%] fill-second-600 sm:top-[50%] md:top-[50%] lg:-bottom-[45%] lg:top-auto lg:h-full xl:-bottom-[50%]' />
        </div>
        <HeroSlogan />
        <OldEffect />
        <Guitar />
      </div>
      <div className='z-30 flex flex-col items-center justify-center gap-6  lg:-mb-24 lg:flex-col xl:pr-8 '>
        <span className='px-4 text-left font-openSans text-xs font-bold text-mainText xs:text-sm sm:text-base lg:text-right '>
          {children}
        </span>
        <Link href='/login'>
          <Button size='lg' onClick={buttonOnClick}>
            {t("profile:cta_button")}
          </Button>
        </Link>
        <div className='flex flex-row gap-6  text-xl'>
          <Link href='/login'>
            <button className='text-mainText' onClick={buttonOnClick}>
              {t("common:button.sign_in")}
            </button>
          </Link>
          <Link href='/signup'>
            <button className='text-mainText' onClick={buttonOnClick}>
              {t("common:button.sign_up")}
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};
