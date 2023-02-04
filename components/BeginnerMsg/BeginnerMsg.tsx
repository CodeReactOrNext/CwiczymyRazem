import { selectCurrentUserStats } from "feature/user/store/userSlice";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "store/hooks";

const BeginnerMsg = () => {
  const { t } = useTranslation("toast");
  const userStats = useAppSelector(selectCurrentUserStats);

  return userStats && userStats.points === 0 ? (
    <p className='p-4 text-center font-openSans'>
      {t("info.new_user_tip")}
      <Link href={"/faq"}>
        <a className='text-link'> FAQ</a>
      </Link>
    </p>
  ) : null;
};

export default BeginnerMsg;
