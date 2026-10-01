import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "assets/lib/utils";
import type { WidgetSize } from "feature/dashboard/types/dashboard.types";
import type { ProfileSectionDefinition } from "feature/profile/data/profileSectionCatalog";
import type { ProfileSectionPlacement } from "feature/profile/types/profileLayout.types";
import {
  ArrowDown,
  ArrowUp,
  Columns2,
  EyeOff,
  GripVertical,
  RectangleHorizontal,
} from "lucide-react";
import type { ReactNode } from "react";

interface SectionTileProps {
  placement: ProfileSectionPlacement;
  definition: ProfileSectionDefinition;
  isEditing: boolean;
  canResize: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMove: (delta: -1 | 1) => void;
  onRemove: () => void;
  onResize: (size: WidgetSize) => void;
  children: ReactNode;
}

const controlButton =
  "rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-700/60 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 disabled:pointer-events-none disabled:opacity-30";

/**
 * One profile section. While reading, just the section. While customising,
 * the section folds into a short tile: the real sections are hundreds of
 * pixels tall (heatmap, pedalboard), and dragging one of those past its
 * neighbour meant dragging it off screen before the sort noticed. Short tiles
 * of one height sort the way a list should, and the arrows cover touch and
 * anyone who would rather click than drag.
 */
export const SectionTile = ({
  placement,
  definition,
  isEditing,
  canResize,
  isFirst,
  isLast,
  onMove,
  onRemove,
  onResize,
  children,
}: SectionTileProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: placement.id, disabled: !isEditing });

  const colSpan = placement.size === "full" ? "lg:col-span-2" : undefined;

  if (!isEditing) {
    // `empty:hidden` — a section with nothing to show must not leave a gap.
    return <div className={cn(colSpan, "empty:hidden")}>{children}</div>;
  }

  const Icon = definition.icon;
  const isFull = placement.size === "full";

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        colSpan,
        "flex items-center gap-3 rounded-xl bg-zinc-800/40 px-3 py-4",
        isDragging && "relative z-20 bg-zinc-700/60",
      )}>
      <button
        ref={setActivatorNodeRef}
        type='button'
        {...attributes}
        {...listeners}
        aria-label={`Move ${definition.title}`}
        title='Drag to move'
        className={cn(controlButton, "cursor-grab touch-none active:cursor-grabbing")}>
        <GripVertical size={18} />
      </button>
      <Icon size={18} className='shrink-0 text-zinc-500' />
      <div className='min-w-0 flex-1'>
        <p className='truncate text-sm font-semibold text-zinc-100'>
          {definition.title}
        </p>
        <p className='truncate text-xs text-zinc-500'>{definition.description}</p>
      </div>
      <div className='flex shrink-0 items-center'>
        <button
          type='button'
          disabled={isFirst}
          onClick={() => onMove(-1)}
          aria-label={`Move ${definition.title} up`}
          title='Move up'
          className={controlButton}>
          <ArrowUp size={16} />
        </button>
        <button
          type='button'
          disabled={isLast}
          onClick={() => onMove(1)}
          aria-label={`Move ${definition.title} down`}
          title='Move down'
          className={controlButton}>
          <ArrowDown size={16} />
        </button>
        {canResize && (
          <button
            type='button'
            onClick={() => onResize(isFull ? "half" : "full")}
            aria-label={
              isFull
                ? `Make ${definition.title} half width`
                : `Make ${definition.title} full width`
            }
            title={isFull ? "Half width" : "Full width"}
            className={controlButton}>
            {isFull ? <Columns2 size={16} /> : <RectangleHorizontal size={16} />}
          </button>
        )}
        <button
          type='button'
          onClick={onRemove}
          aria-label={`Hide ${definition.title}`}
          title='Hide from profile'
          className={controlButton}>
          <EyeOff size={16} />
        </button>
      </div>
    </div>
  );
};
