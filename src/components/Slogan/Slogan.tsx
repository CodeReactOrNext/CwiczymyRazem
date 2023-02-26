import { useTranslation } from "react-i18next";

const Slogan = () => {
  const { t } = useTranslation("common");
  return (
    <div className='mr-24 w-full scale-50 xs:scale-[65%] sm:scale-90 lg:mr-8 lg:scale-100'>
      <p className='text-8xl font-medium uppercase text-tertiary '>
        {t("slogan.line_1")}
      </p>
      <p className='relative bottom-[50px]	left-[240px] text-7xl font-bold uppercase text-main-opposed'>
        {t("slogan.line_2")}
      </p>
    </div>
  );
};

export default Slogan;
