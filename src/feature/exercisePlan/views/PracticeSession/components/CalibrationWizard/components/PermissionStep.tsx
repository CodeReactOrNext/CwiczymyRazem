import { Button } from "assets/components/ui/button";
import { Kostek } from "components/Mascot/Kostek";
import { useTranslation } from "hooks/useTranslation";
import { ArrowLeft } from "lucide-react";

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
        <Button
          type='button'
          variant='ghost'
          size='icon'
          aria-label={t("back")}
          onClick={onBack}>
          <ArrowLeft />
        </Button>
        <CloseButton onClick={onCancel} label={t("close")} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 shortwide:gap-3">
        {/* Kostek holds the mic out: the screen asks to be heard. */}
        <Kostek mood='micReady' arrive className='h-32 sm:h-36 shortwide:h-20' />

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
            size="lg"
            className="w-full"
          >
            {isLoading ? t("permission.allowing") : t("permission.allow")}
          </Button>
          <p className="text-xs font-medium text-zinc-400">
            {t("permission.prompt")}
          </p>
        </div>
      </div>

      <button onClick={onCancel} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors text-center py-2 mt-4">
        {t("permission.skip")}
      </button>
    </div>
  );
};
