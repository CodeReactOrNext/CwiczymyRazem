import { cn } from "assets/lib/utils";
import { useArsenalLabels } from "feature/arsenal/hooks/useArsenalLabels";
import { ArrowDownToLine, FoldHorizontal, X } from "lucide-react";

import { RIG_BUTTON } from "./RigSection";

/** The one thing to do once there is room: white, like every main CTA. */
const RIG_BUTTON_CTA =
  "flex shrink-0 items-center gap-1.5 rounded bg-white px-3 py-1.5 text-xs font-semibold tracking-wide text-zinc-950 transition-colors duration-fast hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/60";

interface MakeRoomBarProps {
  /** The pedal waiting for room, as the player knows it. */
  name: string;
  imageSrc: string;
  /** There is a gap big enough for it already — one click puts it down. */
  ready: boolean;
  /** How many pedals on the board it could trade places with. */
  swapCount: number;
  /** Pushing the board together would make room for it. */
  canSqueeze: boolean;
  onPlace: () => void;
  onSqueeze: () => void;
  onCancel: () => void;
  /** Floating over a full-screen board rather than sitting in the page. */
  floating?: boolean;
}

/**
 * A pedal in hand that the board has no room for yet.
 *
 * "The board is full" used to be the end of it: a warning, and the pedal went
 * back where it came from. Now it stays picked up, the way a game holds an item
 * over a full inventory, and the board shows what can be done about it — the
 * pedals it could trade places with light up on the deck, and this bar offers
 * the rest: squeeze everything together, or put it down the moment a gap opens.
 * Nothing is ever thrown away; a pedal traded out goes back to the collection.
 */
export const MakeRoomBar = ({
  name,
  imageSrc,
  ready,
  swapCount,
  canSqueeze,
  onPlace,
  onSqueeze,
  onCancel,
  floating = false,
}: MakeRoomBarProps) => {
  const { t } = useArsenalLabels();

  const hint = ready
    ? t("board.make_room_ready_hint")
    : swapCount > 0
      ? t("board.make_room_swap_hint")
      : canSqueeze
        ? t("board.make_room_squeeze_hint")
        : t("board.make_room_too_big");

  return (
    <div
      role='status'
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-3 rounded px-4 py-3",
        floating ? "bg-zinc-950/90 backdrop-blur-sm" : "bg-zinc-900/60",
      )}>
      <img
        src={imageSrc}
        alt=''
        className='h-12 w-auto shrink-0 object-contain'
        draggable={false}
      />
      <div className='flex min-w-0 flex-1 basis-56 flex-col gap-0.5'>
        <p
          className={cn(
            "text-sm font-semibold",
            ready ? "text-emerald-300" : "text-amber-300",
          )}>
          {ready
            ? t("board.make_room_ready", { name })
            : t("board.make_room_title", { name })}
        </p>
        <p className='text-xs leading-relaxed text-zinc-400'>{hint}</p>
      </div>
      <div className='flex flex-wrap items-center gap-2'>
        {ready && (
          <button onClick={onPlace} className={RIG_BUTTON_CTA}>
            <ArrowDownToLine size={12} strokeWidth={2.5} />
            {t("board.place_now")}
          </button>
        )}
        {!ready && canSqueeze && (
          <button
            onClick={onSqueeze}
            className={swapCount > 0 ? RIG_BUTTON : RIG_BUTTON_CTA}
            title={t("board.squeeze_hint")}>
            <FoldHorizontal size={12} strokeWidth={2.5} />
            {t("board.squeeze_in")}
          </button>
        )}
        <button onClick={onCancel} className={RIG_BUTTON}>
          <X size={12} strokeWidth={2.5} />
          {t("board.make_room_cancel")}
        </button>
      </div>
    </div>
  );
};
