import { ConfirmDialog } from "components/ConfirmDialog/ConfirmDialog";
import { useTranslation } from "hooks/useTranslation";
import type { SetStateAction } from "react";
import { convertMsToHM } from "utils/converter";

interface PopUpProps {
  open: boolean;
  exceedingTime: number;
  setAcceptExceedingTime: (value: SetStateAction<boolean>) => void;
  setAcceptPopUpVisible: (value: SetStateAction<boolean>) => void;
  onAccept: () => void;
  isFetching: boolean;
}

const AcceptExceedingPopUp = ({
  open,
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
    <ConfirmDialog
      open={open}
      onOpenChange={setAcceptPopUpVisible}
      title={t("toast.exceeding_time") + convertMsToHM(exceedingTime)}
      description={t("exceeding_time")}
      cancelLabel={t("back")}
      confirmLabel={t("report_button")}
      loading={isFetching}
      onConfirm={handleAccept}
    />
  );
};

export default AcceptExceedingPopUp;
