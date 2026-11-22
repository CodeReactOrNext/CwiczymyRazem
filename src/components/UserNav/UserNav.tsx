import { Button } from "assets/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";
import { LogoutDialog } from "components/LogoutDialog/LogoutDialog";
import Avatar from "components/UI/Avatar";
import {
  selectUserAuth,
  selectUserAvatar,
  selectUserName,
} from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAppSelector } from "store/hooks";

/**
 * Account menu in the header. Log out is a rare action, so it lives in here
 * behind the avatar instead of as a bordered button next to the profile.
 */
const UserNav = () => {
  const { t } = useTranslation("nav");
  const userId = useAppSelector(selectUserAuth);
  const userName = useAppSelector(selectUserName);
  const avatar = useAppSelector(selectUserAvatar);

  // The confirm dialog sits outside the menu: the menu closes on select, and a
  // dialog mounted inside its content would unmount with it.
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type='button'
            variant='subtle'
            size='touch'
            aria-label={t("account_menu")}
            className='z-30 min-w-11 gap-1.5 px-1.5 data-[state=open]:bg-white/15 [&_svg]:size-3.5'>
            {avatar || userName ? (
              <Avatar
                size='xs'
                name={userName ?? ""}
                avatarURL={avatar || undefined}
              />
            ) : (
              <span className='flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700 text-zinc-200'>
                <User />
              </span>
            )}
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align='end'
          sideOffset={8}
          className='w-52'>
          {userName && (
            <div className='truncate px-2.5 pb-2 pt-1.5 text-xs font-semibold text-zinc-500'>
              {userName}
            </div>
          )}
          <DropdownMenuItem asChild>
            <Link href={`/user/${userId}`} className='flex items-center gap-2'>
              <User size={14} />
              {t("see_your_profile")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href='/settings' className='flex items-center gap-2'>
              <Settings size={14} />
              {t("settings")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setIsLogoutDialogOpen(true)}
            className='mt-1 flex items-center gap-2 text-zinc-400'>
            <LogOut size={14} />
            {t("log_out")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <LogoutDialog
        open={isLogoutDialogOpen}
        onOpenChange={setIsLogoutDialogOpen}
      />
    </>
  );
};

export default UserNav;
