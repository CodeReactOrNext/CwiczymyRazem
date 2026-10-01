import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "assets/components/ui/sheet";
import type { WidgetDefinition } from "feature/dashboard/data/widgetCatalog";
import {
  WIDGET_GROUP_LABELS,
  WIDGET_GROUP_ORDER,
} from "feature/dashboard/data/widgetCatalog";
import { Plus } from "lucide-react";

type SheetItem<Id extends string> = Pick<
  WidgetDefinition,
  "title" | "description" | "icon"
> & { id: Id; group?: string };

interface AddWidgetSheetProps<Id extends string> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Cards not shown right now, in registry order. */
  hidden: SheetItem<Id>[];
  onAdd: (id: Id) => void;
  title?: string;
  description?: string;
  emptyText?: string;
  /** Group headings; without them the list is flat. */
  groupOrder?: readonly string[];
  groupLabels?: Record<string, string>;
  /** When set, nothing can be added and this says why. */
  disabledReason?: string;
}

/** Everything a page can show but currently does not, grouped the way the menu is. */
export const AddWidgetSheet = <Id extends string>({
  open,
  onOpenChange,
  hidden,
  onAdd,
  title = "Add to Home",
  description = "Pick what you want to see first. New cards land at the bottom — drag them where they belong.",
  emptyText = "Everything is already on your Home.",
  groupOrder = WIDGET_GROUP_ORDER,
  groupLabels = WIDGET_GROUP_LABELS,
  disabledReason,
}: AddWidgetSheetProps<Id>) => {
  const renderItems = (items: SheetItem<Id>[]) => (
    <ul className='space-y-1'>
      {items.map((definition) => {
        const Icon = definition.icon;
        return (
          <li key={definition.id}>
            <button
              type='button'
              disabled={!!disabledReason}
              onClick={() => onAdd(definition.id)}
              className='flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-zinc-800/60 disabled:hover:bg-transparent'>
              <Icon size={18} className='mt-0.5 shrink-0 text-zinc-400' />
              <span className='min-w-0 flex-1'>
                <span className='block text-sm font-semibold text-zinc-100'>
                  {definition.title}
                </span>
                <span className='mt-0.5 block text-xs leading-relaxed text-zinc-400'>
                  {definition.description}
                </span>
              </span>
              <Plus
                size={16}
                className='mt-0.5 shrink-0 text-zinc-500'
                aria-hidden
              />
            </button>
          </li>
        );
      })}
    </ul>
  );

  const isGrouped = hidden.some((definition) => definition.group);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side='right'
        className='w-full overflow-y-auto border-0 sm:max-w-md'>
        <SheetHeader className='text-left'>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        {disabledReason && hidden.length > 0 && (
          <p className='mt-6 rounded-lg bg-amber-500/10 px-4 py-3 text-sm text-amber-200'>
            {disabledReason}
          </p>
        )}

        {hidden.length === 0 ? (
          <p className='mt-8 text-sm text-zinc-400'>{emptyText}</p>
        ) : !isGrouped ? (
          <div className='mt-6'>{renderItems(hidden)}</div>
        ) : (
          <div className='mt-6 space-y-8'>
            {groupOrder.map((group) => {
              const items = hidden.filter(
                (definition) => definition.group === group,
              );
              if (items.length === 0) return null;
              return (
                <section key={group}>
                  <h4 className='mb-2 px-3 text-xs font-semibold text-zinc-500'>
                    {groupLabels[group]}
                  </h4>
                  {renderItems(items)}
                </section>
              );
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
