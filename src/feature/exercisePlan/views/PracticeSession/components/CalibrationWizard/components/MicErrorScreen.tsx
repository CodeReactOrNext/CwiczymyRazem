import { Button } from "assets/components/ui/button";
import type { AudioInitFailure } from "hooks/useAudioAnalyzer";
import { useTranslation } from "hooks/useTranslation";
import { Mic } from "lucide-react";
import React from "react";

import { ModalWrapper } from "../../ModalWrapper";

interface MicErrorScreenProps {
  /** Why the input didn't open — each reason has its own way out. */
  reason:   AudioInitFailure;
  onRetry:  () => void;
  onCancel: () => void;
}

export function MicErrorScreen({ reason, onRetry, onCancel }: MicErrorScreenProps) {
  const { t } = useTranslation("calibration");
  return (
    <ModalWrapper zIndex="z-[99999999]">
      <div className="flex h-full items-center justify-center px-6 text-white">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="mx-auto h-16 w-16 rounded-lg bg-red-500/10 flex items-center justify-center">
            <Mic size='1em' className="h-7 w-7 text-red-400" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold">{t(`error.reasons.${reason}.title`)}</p>
            <p className="text-sm leading-relaxed text-zinc-300">
              {t(`error.reasons.${reason}.body`)}
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button onClick={onRetry}>{t("error.retry")}</Button>
            <Button variant="ghost" onClick={onCancel} className="text-zinc-400 hover:text-zinc-200">{t("error.cancel")}</Button>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}
