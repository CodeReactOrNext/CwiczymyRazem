import { useTranslation } from "hooks/useTranslation";
import HamburgerLayout from "layouts/HamburgerLayout";
import type { layoutVariant } from "layouts/MainLayout/MainLayout";
import Link from "next/link";
import { useState } from "react";
import { FaBars } from "react-icons/fa";

import NavLink from "./component/NavLink";

interface MainNavigationProps {
  variant: layoutVariant;
}

const MainNavigation = ({ variant }: MainNavigationProps) => {
  const [hamburgerVisible, setHamburgerVisible] = useState<boolean>(false);

  const { t } = useTranslation("common");

  const hamburgerHandler = () => {
    setHamburgerVisible(!hamburgerVisible);
  };

  return (
    <nav
      className={`lg:clip-nav right-0 top-0 z-50 flex h-full items-center justify-center pr-8  ${
        variant === "landing"
          ? "lg:!w-1/2 xl:!w-[55%]"
          : "lg:w-[76%] xl:w-[85%]"
      }  ${
        variant === "secondary" ? "lg:bg-main-opposed-500" : "lg:bg-second-500"
      }  lg:pl-16`}>
      <ul className='mr-11 hidden w-full items-center justify-evenly text-3xl lg:flex'>
      <NavLink url='/songs' title={t("nav.songs")} />

        <NavLink url='/leaderboard' title={t("nav.leadboard")} />

        <NavLink url='/faq' title={t("nav.faq")} />
      </ul>

      <button
        aria-label='hamburger menu button'
        name='hamburger-menu-button'
        className='h-8 w-8 lg:hidden'
        onClick={hamburgerHandler}>
        <FaBars className='h-full w-full' />
      </button>
      {hamburgerVisible && (
        <HamburgerLayout buttonOnClick={hamburgerHandler}>
          <li className='hover:click-behavior active:click-behavior'>
            <Link href='/leaderboard'>{t("nav.leadboard")}</Link>
          </li>
          <li className='active:click-behavior'>
            <Link
              href='https://discord.gg/6yJmsZW2Ne'
              target='_blank'
              rel='noreferrer'>
              {t("nav.discord")}
            </Link>
          </li>
          <li className=' active:click-behavior'>
            <Link href='/faq'>{t("nav.faq")}</Link>
          </li>

        </HamburgerLayout>
      )}

    </nav>
  );
};

export default MainNavigation;
