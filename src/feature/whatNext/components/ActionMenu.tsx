import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";
import { cn } from "assets/lib/utils";
import { useNextMessage } from "feature/whatNext/hooks/useNextMessage";
import { useWhatNextStore } from "feature/whatNext/store/whatNext.store";
import type { NextAction } from "feature/whatNext/types/whatNext.types";
import { CalendarX2, EyeOff, MoreHorizontal } from "lucide-react";
import posthog from "posthog-js";
import { toast } from "sonner";
import { getLocalDayEnd } from "utils/gameLogic/resetSchedule";

/** "Not today" / "hide for a week" — the only way to argue with the road. */
export const ActionMenu = ({
  action,
  className,
}: {
  action: NextAction;
  className?: string;
}) => {
  const { t } = useNextMessage();
  const snoozeForToday = useWhatNextStore((state) => state.snoozeForToday);
  const snoozeForWeek = useWhatNextStore((state) => state.snoozeForWeek);

  const snooze = (duration: "today" | "week") => {
    if (duration === "today") snoozeForToday(action.id, getLocalDayEnd());
    else snoozeForWeek(action.id);
    posthog.capture("what_next_snoozed", {
      source: action.source,
      kind: action.kind,
      duration,
    });
    toast(t("menu.snoozed"));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type='button'
          aria-label={t("menu.label")}
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded text-zinc-500 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 data-[state=open]:bg-zinc-800/60 hover:bg-zinc-800/60 hover:text-zinc-200",
            className,
          )}>
          <MoreHorizontal size={16} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='end'
        className='w-48 border-0 bg-zinc-900 p-1.5 text-zinc-200'>
        <DropdownMenuItem onSelect={() => snooze("today")} className='gap-2'>
          <CalendarX2 size={14} className='text-zinc-400' />
          {t("menu.today")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => snooze("week")} className='gap-2'>
          <EyeOff size={14} className='text-zinc-400' />
          {t("menu.week")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
