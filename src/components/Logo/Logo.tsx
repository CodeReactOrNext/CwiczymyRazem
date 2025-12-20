import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";

interface LogoProps {
  large?: boolean;
}

export const Logo = ({ large }: LogoProps) => {
  const { t } = useTranslation("common");
  return (
    <Link href='/'>
      <div className='z-50 flex cursor-pointer items-center'>
        <Image
          src='/images/longlightlogo.svg'
          alt='Riff Quest'
          width={large ? 320 : 220}
          height={large ? 58 : 40}
          className={`${large ? "h-14" : "h-10"} w-auto`}
          priority
        />
      </div>
    </Link>
  );
};
