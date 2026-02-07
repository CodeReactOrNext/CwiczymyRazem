import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import { FaGuitar } from "react-icons/fa";

interface CalibrationChoiceDialogProps {
  isOpen: boolean;
  calibrationTimestamp: number;
  onReuse: () => void;
  onRecalibrate: () => void;
  onCancel: () => void;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const CalibrationChoiceDialog = ({
  isOpen,
  calibrationTimestamp,
  onReuse,
  onRecalibrate,
  onCancel,
}: CalibrationChoiceDialogProps) => {
  const formattedDate = calibrationTimestamp
    ? new Date(calibrationTimestamp).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  const isOld = calibrationTimestamp > 0 && Date.now() - calibrationTimestamp > THIRTY_DAYS_MS;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onCancel(); }}>
      <DialogContent className="sm:max-w-md z-[99999999]">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <FaGuitar className="h-6 w-6 text-emerald-400" />
          </div>
          <DialogTitle className="text-center text-xl">Existing Calibration</DialogTitle>
          <DialogDescription className="text-center text-zinc-400 leading-relaxed pt-2">
            You have calibration data from <span className="text-zinc-200 font-medium">{formattedDate}</span>.
          </DialogDescription>
          {isOld && (
            <p className="text-center text-xs text-amber-400/80 mt-2">
              This calibration is over 30 days old — consider recalibrating for best accuracy.
            </p>
          )}
        </DialogHeader>
        <DialogFooter className="flex flex-col gap-2 sm:flex-col sm:gap-2 pt-4">
          <Button onClick={onReuse} className="w-full bg-emerald-500 text-black hover:bg-emerald-400 font-bold">
            Use Existing
          </Button>
          <Button variant="secondary" onClick={onRecalibrate} className="w-full">
            Recalibrate
          </Button>
          <Button variant="ghost" onClick={onCancel} className="w-full text-zinc-500 hover:text-zinc-300">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
