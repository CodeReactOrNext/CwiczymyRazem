import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "assets/components/ui/dialog";
import { useState } from "react";

import { useCalendarDisplay } from "../hooks/useCalendarDisplay";
import type { CalendarItem } from "../types/calendar.types";
import { MAX_SLOT_MINUTES, MIN_SLOT_MINUTES } from "../utils/calendarItems";
import { MinutesInput } from "./PlannerControls";

interface ItemLengthDialogProps {
  item: CalendarItem;
  onSave: (minutes: number) => void;
  onClose: () => void;
}

/** Sets how long one slot runs, to the minute. */
export const ItemLengthDialog = ({
  item,
  onSave,
  onClose,
}: ItemLengthDialogProps) => {
  const { describe, t } = useCalendarDisplay();
  const [minutes, setMinutes] = useState(item.minutes);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='flex flex-col gap-6 border-0 bg-zinc-900 shadow-none sm:max-w-sm sm:p-8'>
        <div className='space-y-2 pr-10'>
          <DialogTitle className='text-xl font-bold text-zinc-100'>
            {t("length.title")}
          </DialogTitle>
          <DialogDescription className='line-clamp-2 text-sm text-zinc-400'>
            {describe(item).title}
          </DialogDescription>
        </div>
        <form
          className='space-y-6'
          onSubmit={(event) => {
            event.preventDefault();
            onSave(minutes);
          }}>
          <div className='flex items-center justify-between gap-4'>
            <span className='text-sm text-zinc-400'>
              {t("add.length_minutes")}
            </span>
            <MinutesInput
              value={minutes}
              min={MIN_SLOT_MINUTES}
              max={MAX_SLOT_MINUTES}
              onChange={setMinutes}
              label={t("add.length_minutes")}
            />
          </div>
          <Button
            type='submit'
            className='h-11 w-full rounded-lg border-b-black/25 bg-white font-bold text-zinc-950 focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-200'>
            {t("length.save")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
