import { Button, buttonVariants } from "assets/components/ui/button";
import { logUserOff } from "feature/user/store/userSlice.asyncThunk";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useAppDispatch } from "store/hooks";
import { LogOut } from "lucide-react";
import { cn } from "assets/lib/utils";

interface UserNavProps {
  flexDirection?: "row" | "col";
  showOnlyLogout?: boolean;
}

const UserNav = ({ flexDirection, showOnlyLogout }: UserNavProps) => {
  const { t } = useTranslation("common");
  const dispatch = useAppDispatch();

  return (
    <div
      className={`relative z-30 flex gap-2 text-center font-openSans text-[0.6rem] font-bold text-mainText xs:text-xs  ${
        flexDirection === "col"
          ? "flex-col items-start justify-center"
          : "flex-row justify-around"
      }`}>
      {!showOnlyLogout && (
        <Link href='/settings' className={buttonVariants({ size: "sm" })}>
          {t("button.edit")}
        </Link>
      )}

      <Button
        size={showOnlyLogout ? 'icon' : 'sm'}
        variant='outline'
        className={cn(showOnlyLogout && "h-8 w-8 border-white/10 bg-zinc-800/40")}
        onClick={() => dispatch(logUserOff())}>
        {showOnlyLogout ? <LogOut size={14} className="text-zinc-400" /> : t("button.logout")}
      </Button>
    </div>
  );
};
export default UserNav;
