import { Button } from "assets/components/ui/button";
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
        That&apos;s a long session!
      </p>
      <p className='font-sans text-sm text-zinc-400'>
        You&apos;re about to report{" "}
        <span className='font-bold text-amber-400'>
          {convertMsToHM(totalTime)}
        </span>{" "}
        of practice. We know that&apos;s a lot — please double-check it&apos;s not a
        mistake before submitting.
      </p>
      <p className='font-sans text-xs text-zinc-500'>
        Are you sure you want to report this time?
      </p>
      <div className='flex gap-4'>
        <Button onClick={() => setLongTimePopUpVisible(false)} variant='outline'>
          Back to edit
        </Button>
        <Button onClick={handleAccept} disabled={isFetching}>
          Yes, report it
        </Button>
      </div>
    </div>
  );
};

export default LongPracticeConfirmPopUp;
