import Button from "components/UI/Button";
import { SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { convertMsToHM } from "utils/converter/timeConverter";

interface PopUpProps {
  exceedingTime: number;
  setAcceptExceedingTime: (value: SetStateAction<boolean>) => void;
  setAcceptPopUpVisible: (value: SetStateAction<boolean>) => void;
  handleSubmit: () => void;
  isFetching: boolean;
}

const AcceptExceedingPopUp = ({
  exceedingTime,
  setAcceptExceedingTime,
  setAcceptPopUpVisible,
  handleSubmit,
  isFetching,
}: PopUpProps) => {
  const { t } = useTranslation("report");
  return (
    <div className=' m-auto mx-2 flex h-1/4 min-h-[300px] flex-col items-center justify-center gap-4 border-2 border-second-400 bg-second p-6 radius-default'>
      <p className='font-openSans text-base'>
        {t("toast.exceeding_time") + convertMsToHM(exceedingTime)}
      </p>
      <p className='font-openSans text-sm'>{t("exceeding_time")}</p>
      <div className='flex gap-4'>
        <Button
          type='button'
          variant='small'
          onClick={() => {
            setAcceptExceedingTime(true);
            handleSubmit();
          }}
          loading={isFetching}>
          {t("report_button")}
        </Button>
        <Button
          type='button'
          variant='small'
          onClick={() => setAcceptPopUpVisible(false)}>
          {t("rating_popup.back")}
        </Button>
      </div>
    </div>
  );
};

export default AcceptExceedingPopUp;
