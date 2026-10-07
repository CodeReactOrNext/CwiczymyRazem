import { useTranslation } from "hooks/useTranslation";
import { Button } from "assets/components/ui/button";
import { Interpolate } from "lib/i18n/Interpolate";
import { AlertTriangle } from "lucide-react";
import type { SetStateAction } from "react";
import { convertMsToHM } from "utils/converter";

interface PopUpProps {
  totalTime: number;
  setAcceptLongTime: (value: SetStateAction<boolean>) => void;
  setLongTimePopUpVisible: (value: SetStateAction<boolean>) => void;
  onAccept: () => void;
  isFetching: boolean;
}

const LongPracticeConfirmPopUp = ({
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
    <div className='m-auto mx-2 flex max-w-md flex-col items-center justify-center gap-4 rounded-lg bg-zinc-900 p-6 text-center shadow-xl'>
      <div className='flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10'>
        <AlertTriangle className='h-6 w-6 text-amber-400' />
      </div>
      <p className='font-sans text-lg font-bold text-zinc-100'>
        {t("long_session.title")}
      </p>
      <p className='font-sans text-sm text-zinc-400'>
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
      </p>
      <p className='font-sans text-xs text-zinc-500'>
        {t("long_session.confirm")}
      </p>
      <div className='flex gap-4'>
        <Button onClick={() => setLongTimePopUpVisible(false)} variant='outline'>
          {t("long_session.back")}
        </Button>
        <Button onClick={handleAccept} disabled={isFetching}>
          {t("long_session.accept")}
        </Button>
      </div>
    </div>
  );
};

export default LongPracticeConfirmPopUp;
