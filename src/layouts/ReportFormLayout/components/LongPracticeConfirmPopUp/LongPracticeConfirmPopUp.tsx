import { ConfirmDialog } from "components/ConfirmDialog/ConfirmDialog";
import { useTranslation } from "hooks/useTranslation";
import { Interpolate } from "lib/i18n/Interpolate";
import { AlertTriangle } from "lucide-react";
import type { SetStateAction } from "react";
import { convertMsToHM } from "utils/converter";

interface PopUpProps {
  open: boolean;
  totalTime: number;
  setAcceptLongTime: (value: SetStateAction<boolean>) => void;
  setLongTimePopUpVisible: (value: SetStateAction<boolean>) => void;
  onAccept: () => void;
  isFetching: boolean;
}

const LongPracticeConfirmPopUp = ({
  open,
  totalTime,
  setAcceptLongTime,
  setLongTimePopUpVisible,
  onAccept,
  isFetching,
}: PopUpProps) => {
  const { t } = useTranslation("report");
  const handleAccept = () => {
    setAcceptLongTime(true);
    onAccept();
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={setLongTimePopUpVisible}
      title={
        <span className='flex items-center gap-2'>
          <AlertTriangle className='h-5 w-5 shrink-0 text-amber-400' aria-hidden />
          {t("long_session.title")}
        </span>
      }
      description={
        <Interpolate
          text={t("long_session.body")}
          values={{
            time: (
              <span className='font-bold text-amber-400'>
                {convertMsToHM(totalTime)}
              </span>
            ),
          }}
        />
      }
      cancelLabel={t("long_session.back")}
      confirmLabel={t("long_session.accept")}
      loading={isFetching}
      onConfirm={handleAccept}>
      <p className='text-sm text-zinc-400'>{t("long_session.confirm")}</p>
    </ConfirmDialog>
  );
};

export default LongPracticeConfirmPopUp;
