/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useTranslation } from "react-i18next";

import { Button } from "components/UI";
import OldEffect from "components/OldEffect";
import Guitar from "./components/Guitar";
import HeroSlogan from "./components/HeroSlogan";

import FireDoubleSVG from "public/static/images/svg/Fire_double";

interface HeroProps {
  children: React.ReactElement;
  buttonOnClick?: React.MouseEventHandler<HTMLButtonElement>;
}

const HeroLayout = ({ children, buttonOnClick }: HeroProps) => {
  const { t } = useTranslation(["profile", "common"]);

  return (
    <div className='grid h-full w-full grid-cols-1 grid-rows-2 gap-[20%] lg:grid-cols-[4fr_5fr] lg:grid-rows-1'>
      <div className='relative h-full w-full'>
        <div className='absolute top-0 bottom-0 h-full w-full'>
          <FireDoubleSVG className='absolute top-[60%] left-0 right-0 w-[110%] -translate-x-[7%] fill-second-500 sm:top-[50%] md:top-[50%] lg:-bottom-[45%] lg:top-auto lg:h-full xl:-bottom-[50%]' />
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
          <a>
            <Button onClick={buttonOnClick}>{t("profile:cta_button")}</Button>
          </a>
        </Link>
        <div className='flex flex-row gap-6  text-xl'>
          <Link href='/login'>
            <a>
              <button className='text-mainText' onClick={buttonOnClick}>
                {t("common:button.sign_in")}
              </button>
            </a>
          </Link>
          <Link href='/signup'>
            <a>
              <button className='text-mainText' onClick={buttonOnClick}>
                {t("common:button.sign_up")}
              </button>
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HeroLayout;
