import router from "next/router";
import { ChangeEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

function LanguageSwitch() {
  type Languages = "en" | "pl";
  const { i18n } = useTranslation("common");
  const [currentLang, setCurrentLang] = useState<Languages>(
    i18n?.language as Languages
  );

  const changeLocale = (event: ChangeEvent<HTMLInputElement>) => {
    const locale = event.target.dataset.lang;

    router.push(
      {
        query: router.query,
      },
      router.asPath,
      { locale }
    );
  };

  useEffect(() => {
    setCurrentLang(i18n?.language as Languages);
  }, [i18n?.language]);

  return (
    <div className='flex overflow-hidden font-openSans text-xs font-bold text-main-opposed-900'>
      <div
        className={`flex rounded-l-sm py-1 px-1 ${
          currentLang === "pl"
            ? "bg-main-opposed-500/80 text-mainText"
            : "bg-tertiary-500"
        }`}>
        <input
          className='hidden'
          data-lang='pl'
          onChange={changeLocale}
          type='radio'
          name='language-switch'
          id='language-1'
          checked={currentLang === "pl"}
        />
        <label
          className='flex cursor-pointer items-center gap-1'
          htmlFor='language-1'>
          <svg
            className='w-4'
            xmlns='http://www.w3.org/2000/svg'
            id='flag-icons-pl'
            viewBox='0 0 640 480'>
            <g fillRule='evenodd'>
              <path fill='#fff' d='M640 480H0V0h640z' />
              <path fill='#dc143c' d='M640 480H0V240h640z' />
            </g>
          </svg>
          PL
          <span className='hidden'> Polski</span>
        </label>
      </div>
      <div
        className={`flex rounded-r-sm py-1 px-1 ${
          currentLang === "en"
            ? "bg-main-opposed-500/80 text-mainText"
            : "bg-tertiary-500"
        }`}>
        <input
          className='hidden'
          data-lang='en'
          onChange={changeLocale}
          type='radio'
          id='language-2'
          name='language-switch'
          checked={currentLang === "en"}
        />
        <label
          className='flex cursor-pointer items-center gap-1'
          htmlFor='language-2'>
          <svg
            className='w-4'
            xmlns='http://www.w3.org/2000/svg'
            id='flag-icons-gb'
            viewBox='0 0 640 480'>
            <path fill='#012169' d='M0 0h640v480H0z' />
            <path
              fill='#FFF'
              d='m75 0 244 181L562 0h78v62L400 241l240 178v61h-80L320 301 81 480H0v-60l239-178L0 64V0h75z'
            />
            <path
              fill='#C8102E'
              d='m424 281 216 159v40L369 281h55zm-184 20 6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z'
            />
            <path fill='#FFF' d='M241 0v480h160V0H241zM0 160v160h640V160H0z' />
            <path fill='#C8102E' d='M0 193v96h640v-96H0zM273 0v480h96V0h-96z' />
          </svg>
          EN
          <span className='hidden'> English</span>
        </label>
      </div>
    </div>
  );
}
export default LanguageSwitch;
