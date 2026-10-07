import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";
import {
  selectUserAuth,
  selectUserAvatar,
  selectUserName,
} from "feature/user/store/userSlice";
import { logUserOff } from "feature/user/store/userSlice.asyncThunk";
import { useTranslation } from "hooks/useTranslation";
import { ChevronDown, LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";

/**
 * Account menu in the header. Log out is a rare action, so it lives in here
 * behind the avatar instead of as a bordered button next to the profile.
 */
const UserNav = () => {
  const { t } = useTranslation("nav");
  const dispatch = useAppDispatch();
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
          <button
            type='button'
            aria-label={t("account_menu")}
            className='relative z-30 flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-lg px-1.5 text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring data-[state=open]:bg-zinc-800/60'>
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt=''
                className='h-7 w-7 rounded-full object-cover'
              />
            ) : (
              <span className='flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300'>
                {userName?.[0]?.toUpperCase() ?? <User size={14} />}
              </span>
            )}
            <ChevronDown size={14} />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align='end'
          sideOffset={8}
          className='w-52 border-white/10 bg-zinc-900 p-1.5 text-zinc-100 shadow-none'>
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

      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className='border-white/10 bg-zinc-950 text-white sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>{t("sign_out")}</DialogTitle>
            <DialogDescription className='text-zinc-400'>
              {t("sign_out_confirm")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='gap-2 sm:gap-0'>
            <DialogClose asChild>
              <Button
                variant='ghost'
                className='hover:bg-white/10 hover:text-white'>
                {t("cancel")}
              </Button>
            </DialogClose>
            <Button
              variant='destructive'
              onClick={() => {
                dispatch(logUserOff());
                setIsLogoutDialogOpen(false);
              }}>
              {t("sign_out")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserNav;
