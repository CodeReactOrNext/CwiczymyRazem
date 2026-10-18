import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { cn } from "assets/lib/utils";
import { PatchCable } from "feature/toneStudio/components/ChainRack";
import { RackSlot } from "feature/toneStudio/components/vst/RackSlot";
import { useTranslation } from "hooks/useTranslation";
import type { LucideIcon } from "lucide-react";
import { Guitar, Plus, Speaker } from "lucide-react";
import { Fragment } from "react";
import type { VstRackSlot } from "types/vstHost";

interface RackFlowProps {
  slots: VstRackSlot[];
  openingSlotId: string | null;
  onOpen: (slotId: string) => void;
  onToggleBypass: (slot: VstRackSlot) => void;
  onMove: (slotId: string, toIndex: number) => void;
  onRemove: (slotId: string) => void;
  /** Takes the player to the library to pick something. */
  onAdd: () => void;
}

/** Where the signal enters/leaves the rack — a jack, not a unit. */
const Jack = ({
  Icon,
  label,
  detail,
}: {
  Icon: LucideIcon;
  label: string;
  detail: string;
}) => (
  <div className='flex w-20 shrink-0 flex-col items-center justify-center gap-1.5 rounded-lg bg-zinc-900/40 px-2 py-4 text-center'>
    <Icon size={18} className='text-zinc-400' />
    <span className='text-xs font-medium text-zinc-300'>{label}</span>
    <span className='text-[11px] text-zinc-500'>{detail}</span>
  </div>
);

const Cable = () => (
  <div className='flex shrink-0 items-center self-center'>
    <PatchCable />
  </div>
);

/**
 * The rack as a signal path, left to right: guitar in, every plugin in the
 * order it processes, out to the interface. Units are dragged by their grip
 * (or moved with the keyboard: focus the grip, Space, arrows, Space) and the
 * engine re-chains as they land.
 */
export const RackFlow = ({
  slots,
  openingSlotId,
  onOpen,
  onToggleBypass,
  onMove,
  onRemove,
  onAdd,
}: RackFlowProps) => {
  const { t } = useTranslation("tone_studio");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const to = slots.findIndex((s) => s.id === over.id);
    if (to >= 0) onMove(String(active.id), to);
  };

  return (
    <div className='flex items-stretch overflow-x-auto pb-2'>
      <Jack
        Icon={Guitar}
        label={t("rack_vst.in")}
        detail={t("rack_vst.mono")}
      />
      <Cable />

      {slots.length === 0 ? (
        <button
          type='button'
          onClick={onAdd}
          className={cn(
            "flex min-h-[176px] min-w-[16rem] flex-1 flex-col items-center justify-center gap-2 rounded-lg bg-zinc-900/30 px-6 text-center transition-colors",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-800/40",
          )}>
          <Plus size={18} className='text-zinc-400' />
          <span className='font-display text-sm font-medium text-zinc-200'>
            {t("rack_vst.empty_title")}
          </span>
          <span className='max-w-xs text-xs text-zinc-500'>
            {t("rack_vst.empty_body")}
          </span>
        </button>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}>
          <SortableContext
            items={slots.map((s) => s.id)}
            strategy={horizontalListSortingStrategy}>
            {slots.map((slot, index) => (
              <Fragment key={slot.id}>
                {index > 0 && <Cable />}
                <RackSlot
                  slot={slot}
                  index={index}
                  count={slots.length}
                  opening={openingSlotId === slot.id}
                  onOpen={() => onOpen(slot.id)}
                  onToggleBypass={() => onToggleBypass(slot)}
                  onMove={(to) => onMove(slot.id, to)}
                  onRemove={() => onRemove(slot.id)}
                />
              </Fragment>
            ))}
          </SortableContext>
          <Cable />
          <button
            type='button'
            onClick={onAdd}
            aria-label={t("rack_vst.add")}
            className={cn(
              "flex w-14 shrink-0 items-center justify-center rounded-lg bg-zinc-900/30 text-zinc-500 transition-colors",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300",
            )}>
            <Plus size={18} />
          </button>
        </DndContext>
      )}

      <Cable />
      <Jack
        Icon={Speaker}
        label={t("rack_vst.out")}
        detail={t("rack_vst.stereo")}
      />
    </div>
  );
};
