import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaBars } from "react-icons/fa";

import Avatar from "components/Avatar";
import UserNav from "components/UserNav";
import NavLink from "./component/NavLink";
import HamburgerLayout from "layouts/HamburgerLayout";
import { layoutVariant } from "layouts/MainLayout/MainLayout";

import { useAppSelector } from "store/hooks";
import {
  selectCurrentUserStats,
  selectUserAuth,
  selectUserAvatar,
  selectUserName,
} from "feature/user/store/userSlice";

interface MainNavigationProps {
  variant: layoutVariant;
}

const MainNavigation = ({ variant }: MainNavigationProps) => {
  const [hamburgerVisible, setHamburgerVisible] = useState<boolean>(false);

  const { t } = useTranslation("common");

  const isUserLoggedIn = useAppSelector(selectUserAuth);
  const avatar = useAppSelector(selectUserAvatar);
  const userName = useAppSelector(selectUserName);
  const userStats = useAppSelector(selectCurrentUserStats);

  const hamburgerHandler = () => {
    setHamburgerVisible(!hamburgerVisible);
  };

  return (
    <nav
      className={`lg:clip-nav right-0 top-0 z-50 flex h-full items-center justify-center pr-8 ${
        variant === "landing"
          ? "lg:!w-1/2 xl:!w-[55%]"
          : "lg:w-[76%] xl:w-[85%]"
      }  ${
        variant === "secondary" ? "lg:bg-main-opposed-500" : "lg:bg-second-500"
      }  lg:pl-16`}>
      <ul className='hidden w-full items-center justify-evenly gap-8 text-3xl lg:flex'>
        {isUserLoggedIn && <NavLink url='/' title={t("nav.profile")} />}
        <NavLink url='/leaderboard' title={t("nav.leadboard")} />
        <NavLink url='/discord' title={t("nav.discord")} />
        <NavLink url='/faq' title={t("nav.faq")} />
      </ul>
      {isUserLoggedIn && (
        <div className=' hidden flex-row lg:flex'>
          <UserNav flexDirection={"col"} />
          <div className='scale-75 '>
            <Avatar lvl={userStats!.lvl} name={userName!} avatarURL={avatar} />
          </div>
        </div>
      )}
      <button className='h-8 w-8 lg:hidden' onClick={hamburgerHandler}>
        <FaBars className='h-full w-full' />
      </button>
      {hamburgerVisible && (
        <HamburgerLayout buttonOnClick={hamburgerHandler}>
          {isUserLoggedIn && (
            <li className='hover:click-behavior active:click-behavior'>
              <Link href='/leaderboard'>{t("nav.profile")}</Link>
            </li>
          )}
          <li className='hover:click-behavior active:click-behavior'>
            <Link href='/leaderboard'>{t("nav.leadboard")}</Link>
          </li>
          <li className='active:click-behavior'>
            <Link href='/discord'>{t("nav.discord")}</Link>
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
