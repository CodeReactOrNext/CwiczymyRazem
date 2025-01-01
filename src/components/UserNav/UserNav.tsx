import Link from "next/link";
import { useTranslation } from "react-i18next";

import { useAppDispatch } from "store/hooks";
import { logUserOff } from "feature/user/store/userSlice.asyncThunk";
import { Button, buttonVariants } from "assets/components/ui/button";

interface UserNavProps {
  flexDirection?: "row" | "col";
}

const UserNav = ({ flexDirection }: UserNavProps) => {
  const { t } = useTranslation("common");
  const dispatch = useAppDispatch();

  return (
    <div
      className={`relative z-30 flex gap-2 text-center font-openSans text-[0.6rem] font-bold text-mainText xs:text-xs  ${
        flexDirection === "col"
          ? "flex-col items-start justify-center"
          : "flex-row justify-around"
      }`}>
      <Link
        href='/settings'
        className={buttonVariants({ variant: "outline", size: "sm" })}>
        {t("button.edit")}
      </Link>

      <Button
        variant='outline'
        size='sm'
        onClick={() => dispatch(logUserOff())}>
        {t("button.logout")}
      </Button>
    </div>
  );
};
export default UserNav;
