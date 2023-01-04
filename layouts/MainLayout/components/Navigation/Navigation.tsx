import { selectUserAuth } from "feature/user/store/userSlice";
import HamburgerLayout from "layouts/HamburgerLayout";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaBars } from "react-icons/fa";
import { useAppSelector } from "store/hooks";
import NavLink from "./component/NavLink";

const Navigation = ({
  variant,
}: {
  variant: "primary" | "secondary" | "landing";
}) => {
  const [hamburgerVisible, setHamburgerVisible] = useState<boolean>(false);
  const isUserLoggedIn = useAppSelector(selectUserAuth);
  const { t } = useTranslation("common");

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
      <button className='h-8 w-8 lg:hidden' onClick={hamburgerHandler}>
        <FaBars className='h-full w-full' />
      </button>
      {hamburgerVisible && (
        <HamburgerLayout buttonOnClick={hamburgerHandler}>
          <li className='hover:click-behavior active:click-behavior'>
            <Link href='/leaderboard'>{t("nav.profile")}</Link>
          </li>
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

export default Navigation;
