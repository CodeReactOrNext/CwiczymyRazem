import { Button, buttonVariants } from "assets/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import { logUserOff } from "feature/user/store/userSlice.asyncThunk";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch } from "store/hooks";

interface UserNavProps {
  flexDirection?: "row" | "col";
  showOnlyLogout?: boolean;
}

const UserNav = ({ flexDirection, showOnlyLogout }: UserNavProps) => {
  const { t } = useTranslation("common");
  const dispatch = useAppDispatch();

  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

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

      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogTrigger asChild>
          <Button
            size={showOnlyLogout ? 'icon' : 'sm'}
            variant='outline'
            className={cn(showOnlyLogout && "h-8 w-8 border-white/10 bg-zinc-800/40")}
          >
            {showOnlyLogout ? <LogOut size={14} className="text-zinc-400" /> : t("button.logout")}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md border-white/10 bg-zinc-950 text-white">
           <DialogHeader>
              <DialogTitle>Sign out</DialogTitle>
              <DialogDescription className="text-zinc-400">
                 Are you sure you want to sign out?
              </DialogDescription>
           </DialogHeader>
           <DialogFooter className="gap-2 sm:gap-0">
               <DialogClose asChild>
                  <Button variant="ghost" className="hover:bg-white/10 hover:text-white">Cancel</Button>
               </DialogClose>
               <Button 
                  variant="destructive" 
                  onClick={() => {
                     dispatch(logUserOff());
                     setIsLogoutDialogOpen(false);
                  }}
                  className="bg-red-500 hover:bg-red-600 border-none"
               >
                  Sign out
               </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default UserNav;
