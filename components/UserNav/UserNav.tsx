import { logOut } from "feature/user/store/userSlice";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useAppDispatch } from "store/hooks";
import { text } from "stream/consumers";

const UserNav = () => {
  const { t } = useTranslation("common");
  const dispatch = useAppDispatch();
  return (
    <div className='mt-3 text-base text-mainText'>
      <Link href='/settings'>
        <button>{t("button.edit")}</button>
      </Link>
      <button onClick={() => dispatch(logOut())} className='ml-3'>
        {t("button.logout")}
      </button>
    </div>
  );
};
export default UserNav;
