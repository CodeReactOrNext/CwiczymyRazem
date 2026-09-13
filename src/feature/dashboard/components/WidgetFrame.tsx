import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "assets/lib/utils";
import type { WidgetDefinition } from "feature/dashboard/data/widgetCatalog";
import type {
  WidgetPlacement,
  WidgetSize,
} from "feature/dashboard/types/dashboard.types";
import {
  Columns2,
  EyeOff,
  GripVertical,
  RectangleHorizontal,
} from "lucide-react";
import type { ReactNode } from "react";

interface WidgetFrameProps {
  placement: WidgetPlacement;
  definition: WidgetDefinition;
  isEditing: boolean;
  /** Resizable by the catalog and on a screen that has two columns to choose from. */
  canResize: boolean;
  onRemove: () => void;
  onResize: (size: WidgetSize) => void;
  children: ReactNode;
}

const controlButton =
  "rounded p-1.5 text-zinc-400 transition-colors hover:bg-zinc-700/60 hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500";

/**
 * One cell of the Home grid. Invisible while the page is just being read;
 * while it is being customised it grows a small toolbar (drag handle, width,
 * hide) and the card underneath stops reacting to clicks so a drag can start
 * anywhere on it without opening something.
 */
export const WidgetFrame = ({
  placement,
  definition,
  isEditing,
  canResize,
  onRemove,
  onResize,
  children,
}: WidgetFrameProps) => {
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
    // `empty:hidden` — a card that decided to render nothing (checklist
    // claimed, no support challenge this week) must not leave a blank cell.
    return (
      <div ref={setNodeRef} className={cn(colSpan, "empty:hidden")}>
        {children}
      </div>
    );
  }

  const Icon = definition.icon;
  const isFull = placement.size === "full";

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        colSpan,
        "flex flex-col gap-2",
        isDragging && "relative z-20 opacity-80",
      )}>
      <div className='flex items-center gap-2 rounded-lg bg-zinc-800/40 px-2 py-1.5'>
        <button
          ref={setActivatorNodeRef}
          type='button'
          {...attributes}
          {...listeners}
          aria-label={`Move ${definition.title}`}
          title='Drag to move'
          className={cn(
            controlButton,
            "cursor-grab touch-none active:cursor-grabbing",
          )}>
          <GripVertical size={16} />
        </button>
        <Icon size={14} className='shrink-0 text-zinc-500' />
        <span className='min-w-0 flex-1 truncate text-sm font-semibold text-zinc-200'>
          {definition.title}
        </span>
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
            {isFull ? (
              <Columns2 size={16} />
            ) : (
              <RectangleHorizontal size={16} />
            )}
          </button>
        )}
        <button
          type='button'
          onClick={onRemove}
          aria-label={`Hide ${definition.title}`}
          title='Hide from Home'
          className={controlButton}>
          <EyeOff size={16} />
        </button>
      </div>

      <div
        className={cn(
          "peer",
          !definition.editable && "pointer-events-none select-none",
        )}>
        {children}
      </div>

      {definition.mayBeEmpty && (
        <p className='hidden rounded-lg bg-zinc-900/40 px-4 py-6 text-center text-sm text-zinc-500 peer-empty:block'>
          Nothing to show right now. This card only appears when there is
          something in it.
        </p>
      )}
    </div>
  );
};
