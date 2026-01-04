import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "assets/components/ui/dialog";
import { AchievementPhysicalCard } from "./AchievementPhysicalCard";
import { useTranslation } from "react-i18next";
import { IconType } from "react-icons/lib";

interface AchievementCardMobileProps {
  Icon: IconType;
  rarity: "common" | "rare" | "veryRare" | "epic";
  name: string;
  description: string;
  children: React.ReactNode;
  progress?: { current: number; max: number };
}

export const AchievementCardMobile = ({ Icon, rarity, name, description, children, progress }: AchievementCardMobileProps) => {
  const { t } = useTranslation("achievements");

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className='border-none bg-main-900/95 text-white backdrop-blur-md max-w-[90vw] rounded-[2rem]'>
        <DialogHeader className='flex flex-col items-center gap-6 py-4'>
          <AchievementPhysicalCard
            Icon={Icon}
            rarity={rarity}
            isMobileView
            cardSize="lg"
            className="h-32 w-32 rounded-[2rem] shadow-2xl"
            customStyle={{
              "--card-opacity": "0.6",
              "--pointer-x": "50%",
              "--pointer-y": "50%",
              "--background-x": "50%",
              "--background-y": "50%",
            } as React.CSSProperties}
          />
          <div className='text-center'>
            <DialogTitle className='mb-1 text-xl font-bold'>{t(name as any)}</DialogTitle>
            <DialogDescription className='text-main-100 text-sm'>
              <span className='mb-2 block text-[10px] uppercase tracking-widest opacity-70 font-bold'>
                {t(rarity as any)}
              </span>
              {t(description as any)}
              
              {progress && (
                <div className="mt-4 bg-white/10 rounded-lg p-2 max-w-[200px] mx-auto">
                    <div className="flex justify-center gap-2 text-xs font-bold opacity-80">
                        <span className="uppercase text-[10px] tracking-wider">Progress</span>
                        <span className="text-green-400">{progress.current} / {progress.max}</span>
                    </div>
                </div>
              )}
            </DialogDescription>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
