import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "assets/components/ui/dropdown-menu";
import { cn } from "assets/lib/utils";
import type { LucideIcon } from "lucide-react";

/** Where the player right-clicked, in viewport pixels. */
export interface StashMenuAnchor {
  x: number;
  y: number;
}

export interface StashMenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  /** Off, with the reason said out loud next to the label rather than hidden. */
  disabled?: boolean;
  reason?: string;
  /** The item does not come back — sell, scrap. */
  danger?: boolean;
}

interface StashContextMenuProps {
  /** Null while nothing is open. */
  anchor: StashMenuAnchor | null;
  /** What was right-clicked, so the menu says which of sixty sockets it means. */
  title: string;
  items: StashMenuItem[];
  onClose: () => void;
}

/**
 * The right-click menu of the stash.
 *
 * The same actions the item's card offers, reachable without opening it — on a
 * board this size, "sell the fourth duplicate" should not cost two dialogs. The
 * card stays the place that *explains* an item; this is the place that acts on
 * one.
 *
 * Anchored to the cursor by way of an empty, fixed-position trigger: the menu
 * then flips and shifts near the edges of the screen on its own, which a
 * hand-placed panel would have to be taught.
 */
export const StashContextMenu = ({
  anchor,
  title,
  items,
  onClose,
}: StashContextMenuProps) => {
  if (!anchor) return null;

  return (
    <DropdownMenu
      // Remounted per click: the anchor moves with the cursor, and a popper
      // that is already open does not go looking for its trigger again.
      key={`${anchor.x}:${anchor.y}`}
      open
      // Not modal: the board stays scrollable underneath, and a right-click on
      // another socket opens that one straight away instead of just dismissing.
      modal={false}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}>
      <DropdownMenuTrigger asChild>
        <span
          aria-hidden
          className='fixed h-0 w-0'
          style={{ left: anchor.x, top: anchor.y }}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='start'
        side='bottom'
        sideOffset={2}
        className='w-56 border-0 bg-zinc-900 p-1'>
        <div className='truncate px-3 pb-1.5 pt-2 text-[10px] font-bold tracking-wider text-zinc-500'>
          {title}
        </div>
        {items.map((item) => (
          <DropdownMenuItem
            key={item.id}
            disabled={item.disabled}
            title={item.reason}
            onSelect={item.onSelect}
            className={cn(
              "cursor-pointer gap-2.5 rounded px-3 py-2 text-xs font-semibold text-zinc-300 focus:bg-zinc-800 focus:text-white",
              item.danger &&
                "text-zinc-400 focus:bg-red-500/15 focus:text-red-300",
              item.disabled && "cursor-not-allowed opacity-40",
            )}>
            <item.icon size={13} strokeWidth={2.25} />
            <span className='flex-1 truncate'>{item.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
