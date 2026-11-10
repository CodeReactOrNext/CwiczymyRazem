import { Button } from "assets/components/ui/button";
import { useTranslation } from "hooks/useTranslation";
import { ChevronLeft, Mic } from "lucide-react";

import { CloseButton } from "./CloseButton";

interface PermissionStepProps {
  isLoading: boolean;
  onGrant:   () => void;
  onBack:    () => void;
  onCancel:  () => void;
}

export const PermissionStep = ({ isLoading, onGrant, onBack, onCancel }: PermissionStepProps) => {
  const { t } = useTranslation("calibration");
  return (
    <div className="flex flex-1 flex-col px-5 py-5 text-white sm:px-12 sm:py-10 shortwide:px-8 shortwide:py-4">
      <div className="flex items-center justify-between mb-8 shortwide:mb-2">
        <button
          onClick={onBack}
          className="rounded-full p-1.5 text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <CloseButton onClick={onCancel} label={t("close")} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 shortwide:gap-3">
        <div className="relative w-40 h-40 shortwide:w-24 shortwide:h-24 rounded-lg overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.15)] bg-zinc-900/60 flex items-center justify-center">
          <Mic size='1em' className="text-6xl text-emerald-400/80" />
        </div>

        <div className="space-y-3 max-w-[280px]">
          <h2 className="text-xl font-bold tracking-tight">{t("permission.title")}</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            {t("permission.body")}
          </p>
        </div>

        <div className="w-full space-y-3 pt-4 shortwide:mx-auto shortwide:max-w-sm shortwide:pt-1">
          <Button
            onClick={onGrant}
            disabled={isLoading}
            className="w-full h-12"
          >
            {isLoading ? t("permission.allowing") : t("permission.allow")}
          </Button>
          <p className="text-[10px] text-zinc-600 font-bold tracking-widest">
            {t("permission.prompt")}
          </p>
        </div>
      </div>

      <button onClick={onCancel} className="text-xs text-zinc-700 hover:text-zinc-500 transition-colors text-center py-2 mt-4">
        {t("permission.skip")}
      </button>
    </div>
  );
};
