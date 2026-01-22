import { Button } from "assets/components/ui/button";
import { useTranslation } from "hooks/useTranslation";
import type { SetStateAction } from "react";
import { convertMsToHM } from "utils/converter";

interface PopUpProps {
  exceedingTime: number;
  setAcceptExceedingTime: (value: SetStateAction<boolean>) => void;
  setAcceptPopUpVisible: (value: SetStateAction<boolean>) => void;
  onAccept: () => void;
  isFetching: boolean;
}

const AcceptExceedingPopUp = ({
  exceedingTime,
  setAcceptExceedingTime,
  setAcceptPopUpVisible,
  onAccept,
  isFetching,
}: PopUpProps) => {
  const { t } = useTranslation("report");

  const handleAccept = () => {
    setAcceptExceedingTime(true);
    onAccept();
  };

  return (
    <div className=' m-auto mx-2 flex h-1/4 min-h-[300px] flex-col items-center justify-center gap-4 border-2 border-second-400 bg-second p-6 radius-default'>
      <p className='font-openSans text-base'>
        {t("toast.exceeding_time") + convertMsToHM(exceedingTime)}
      </p>
      <p className='font-openSans text-sm'>{t("exceeding_time")}</p>
      <div className='flex gap-4'>
        <Button onClick={handleAccept} disabled={isFetching}>
          {t("report_button")}
        </Button>
        <Button onClick={() => setAcceptPopUpVisible(false)}>
         Back
        </Button>
      </div>
    </div>
  );
};

export default AcceptExceedingPopUp;
