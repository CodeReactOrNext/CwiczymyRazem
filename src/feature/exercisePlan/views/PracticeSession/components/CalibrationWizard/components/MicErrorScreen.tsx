import { Button } from "assets/components/ui/button";
import { useTranslation } from "hooks/useTranslation";
import React from "react";
import { FaMicrophone } from "react-icons/fa";

import { ModalWrapper } from "../../ModalWrapper";

interface MicErrorScreenProps {
  onRetry:  () => void;
  onCancel: () => void;
}

export function MicErrorScreen({ onRetry, onCancel }: MicErrorScreenProps) {
  const { t } = useTranslation("calibration");
  return (
    <ModalWrapper zIndex="z-[99999999]">
      <div className="flex h-full items-center justify-center px-6 text-white">
        <div className="max-w-xs w-full text-center space-y-5">
          <div className="mx-auto h-16 w-16 rounded-lg bg-red-500/10 flex items-center justify-center">
            <FaMicrophone className="h-7 w-7 text-red-400" />
          </div>
          <div className="space-y-1.5">
            <p className="font-bold">{t("error.title")}</p>
            <p className="text-sm text-zinc-400">
              {t("error.body")}
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button onClick={onRetry}>{t("error.retry")}</Button>
            <Button variant="ghost" onClick={onCancel} className="text-zinc-500 hover:text-zinc-300">{t("error.cancel")}</Button>
          </div>
        </div>
      </div>
    </ModalWrapper>
  );
}
