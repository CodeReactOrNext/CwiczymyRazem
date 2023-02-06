import Link from "next/link";
import { useTranslation } from "react-i18next";

const Logo = () => {
  const { t } = useTranslation("common");
  return (
    <Link href='/'>
      <div className='z-50 flex cursor-pointer'>
        <div className='flex flex-col items-end justify-center p-2 leading-4'>
          <p className='font-bold  text-mainText'>{t("slogan.line_1")}</p>
          <p className='font-bold text-tertiary-300'>{t("slogan.line_2")}</p>
        </div>
      </div>
    </Link>
  );
};
export default Logo;
