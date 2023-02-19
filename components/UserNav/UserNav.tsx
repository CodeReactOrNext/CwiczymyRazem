import Link from "next/link";
import { useTranslation } from "react-i18next";

import { useAppDispatch } from "store/hooks";
import { logUserOff } from "feature/user/store/userSlice.asyncThunk";

interface UserNavProps {
  flexDirection?: "row" | "col";
}

const UserNav = ({ flexDirection }: UserNavProps) => {
  const { t } = useTranslation("common");
  const dispatch = useAppDispatch();

  return (
    <div
      className={`relative z-30 flex text-center font-openSans text-[0.6rem] xs:text-xs gap-2 font-bold text-mainText  ${
        flexDirection === "col"
          ? "flex-col items-start justify-center"
          : "flex-row justify-around"
      }`}>
      <Link href='/settings'>
        <button className='active:click-behavior'>{t("button.edit")}</button>
      </Link>
      <button
        className=' active:click-behavior'
        onClick={() => dispatch(logUserOff())}>
        {t("button.logout")}
      </button>
    </div>
  );
};
export default UserNav;
