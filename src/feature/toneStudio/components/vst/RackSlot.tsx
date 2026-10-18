import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";
import {
  AppWindow,
  ArrowLeft,
  ArrowRight,
  GripVertical,
  Loader2,
  MoreHorizontal,
  Power,
  Trash2,
} from "lucide-react";
import type { VstRackSlot } from "types/vstHost";

interface RackSlotProps {
  slot: VstRackSlot;
  index: number;
  count: number;
  opening: boolean;
  onOpen: () => void;
  onToggleBypass: () => void;
  onMove: (toIndex: number) => void;
  onRemove: () => void;
}

const iconButton =
  "flex h-8 w-8 items-center justify-center rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400";

/** Status lamp: playing (emerald = it's working), loading, failed, or off. */
const Lamp = ({ slot }: { slot: VstRackSlot }) => (
  <span
    aria-hidden
    className={cn(
      "h-2 w-2 shrink-0 rounded-full",
      slot.status === "error"
        ? "bg-red-400"
        : slot.status === "loading"
          ? "animate-pulse bg-zinc-400"
          : slot.bypass || slot.status !== "ready"
            ? "bg-zinc-700"
            : "bg-emerald-400",
    )}
  />
);

/**
 * One unit in the rack. Numbered like the units in a real rack, because order
 * is the whole point of a chain: what goes into the amp sound different from
 * what comes after it. The plugin's own controls live in its window — the
 * card only holds what you need to arrange the rack.
 */
export const RackSlot = ({
  slot,
  index,
  count,
  opening,
  onOpen,
  onToggleBypass,
  onMove,
  onRemove,
}: RackSlotProps) => {
  const { t } = useTranslation("tone_studio");
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slot.id });

  const muted = slot.bypass || slot.status === "error";
  const statusLine =
    slot.status === "loading"
      ? t("rack_vst.loading")
      : slot.status === "error"
        ? (slot.error ?? t("rack_vst.failed"))
        : slot.bypass
          ? t("rack_vst.bypassed")
          : slot.editorOpen
            ? t("rack_vst.window_open")
            : slot.latencyMs > 0.05
              ? t("rack_vst.latency", { ms: slot.latencyMs.toFixed(1) })
              : t("rack_vst.playing");

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "relative flex w-52 shrink-0 flex-col gap-3 rounded-lg p-3.5 transition-colors",
        isDragging ? "z-10 bg-zinc-700/80" : "bg-zinc-900/80",
      )}>
      <div className='flex items-center gap-2'>
        <span
          className={cn(
            "font-teko text-2xl leading-none",
            muted ? "text-zinc-600" : "text-zinc-300",
          )}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <Lamp slot={slot} />
        <button
          ref={setActivatorNodeRef}
          type='button'
          aria-label={t("rack_vst.drag", { name: slot.name })}
          className={cn(
            iconButton,
            "ml-auto h-7 w-7 cursor-grab text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 active:cursor-grabbing",
          )}
          {...attributes}
          {...listeners}>
          <GripVertical size={15} />
        </button>
      </div>

      <div
        className={cn("flex min-w-0 flex-col gap-0.5", muted && "opacity-60")}>
        <span className='line-clamp-2 font-display text-sm font-medium leading-snug text-zinc-100'>
          {slot.name}
        </span>
        <span className='truncate text-xs text-zinc-500'>{slot.vendor}</span>
      </div>

      <p
        className={cn(
          "mt-auto line-clamp-2 text-xs",
          slot.status === "error" ? "text-red-400" : "text-zinc-500",
        )}>
        {statusLine}
      </p>

      <div className='flex items-center gap-1'>
        <button
          type='button'
          onClick={onOpen}
          disabled={opening || slot.status === "error"}
          className={cn(
            "flex h-8 flex-1 items-center justify-center gap-1.5 rounded text-xs font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:opacity-50",
            slot.editorOpen
              ? "bg-zinc-700/80 text-zinc-100 hover:bg-zinc-600/80"
              : "bg-zinc-800/80 text-zinc-200 hover:bg-zinc-700/80",
          )}>
          {opening ? (
            <Loader2 size={13} className='animate-spin' />
          ) : (
            <AppWindow size={13} />
          )}
          {slot.editorOpen ? t("rack_vst.show") : t("rack_vst.open")}
        </button>
        <button
          type='button'
          onClick={onToggleBypass}
          aria-pressed={!slot.bypass}
          aria-label={
            slot.bypass
              ? t("rack_vst.engage", { name: slot.name })
              : t("rack_vst.bypass", { name: slot.name })
          }
          className={cn(
            iconButton,
            slot.bypass
              ? "bg-zinc-800/80 text-zinc-500 hover:text-zinc-300"
              : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
          )}>
          <Power size={14} />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type='button'
              aria-label={t("rack_vst.more", { name: slot.name })}
              className={cn(
                iconButton,
                "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300",
              )}>
              <MoreHorizontal size={15} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align='end'
            className='w-48 rounded-lg border-0 bg-zinc-900 p-1 text-zinc-200 shadow-none'>
            <DropdownMenuItem
              disabled={index === 0}
              onSelect={() => onMove(index - 1)}
              className='rounded focus:bg-zinc-800 focus:text-zinc-100'>
              <ArrowLeft className='text-zinc-400' />
              {t("rack_vst.move_earlier")}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={index === count - 1}
              onSelect={() => onMove(index + 1)}
              className='rounded focus:bg-zinc-800 focus:text-zinc-100'>
              <ArrowRight className='text-zinc-400' />
              {t("rack_vst.move_later")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={onRemove}
              className='rounded text-red-400 focus:bg-red-500/10 focus:text-red-300'>
              <Trash2 />
              {t("rack_vst.remove")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
