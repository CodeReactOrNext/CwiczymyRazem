import { Button } from "assets/components/ui/button";
import { Echo } from "components/Mascot/Echo";
import type { AudioInitFailure } from "hooks/useAudioAnalyzer";
import { useTranslation } from "hooks/useTranslation";
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
          {/* The input would not open: Echo hears nothing, rings silent, puzzled. */}
          <Echo mood="unplugged" className="mx-auto h-24 md:h-32" />
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
