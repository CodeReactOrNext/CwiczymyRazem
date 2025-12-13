import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";

export const Logo = () => {
  const { t } = useTranslation("common");
  return (
    <Link href='/'>
      <div className='z-50 flex cursor-pointer items-center gap-3'>
        <Image
          src='/images/logo-optimized.svg'
          alt='Logo'
          width={48}
          height={48}
          className='h-12 w-auto brightness-0 invert'
          priority
        />
        <div className='flex flex-col items-start justify-center leading-none'>
          <p className='font-bold tracking-wider text-white text-lg'>
            {t("slogan.line_1")}
          </p>
          <p className='font-bold tracking-wider text-main-300 text-lg'>
            {t("slogan.line_2")}
          </p>
        </div>
      </div>
    </Link>
  );
};
