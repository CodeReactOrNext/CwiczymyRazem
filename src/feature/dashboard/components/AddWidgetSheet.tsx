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
import type { WidgetId } from "feature/dashboard/types/dashboard.types";
import { Plus } from "lucide-react";

interface AddWidgetSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Cards not on Home right now, in registry order. */
  hidden: WidgetDefinition[];
  onAdd: (id: WidgetId) => void;
}

/** Everything Home can show but currently does not, grouped the way the menu is. */
export const AddWidgetSheet = ({
  open,
  onOpenChange,
  hidden,
  onAdd,
}: AddWidgetSheetProps) => (
  <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent
      side='right'
      className='w-full overflow-y-auto border-0 sm:max-w-md'>
      <SheetHeader className='text-left'>
        <SheetTitle>Add to Home</SheetTitle>
        <SheetDescription>
          Pick what you want to see first. New cards land at the bottom — drag
          them where they belong.
        </SheetDescription>
      </SheetHeader>

      {hidden.length === 0 ? (
        <p className='mt-8 text-sm text-zinc-400'>
          Everything is already on your Home.
        </p>
      ) : (
        <div className='mt-6 space-y-8'>
          {WIDGET_GROUP_ORDER.map((group) => {
            const items = hidden.filter(
              (definition) => definition.group === group,
            );
            if (items.length === 0) return null;
            return (
              <section key={group}>
                <h4 className='mb-2 px-3 text-xs font-semibold text-zinc-500'>
                  {WIDGET_GROUP_LABELS[group]}
                </h4>
                <ul className='space-y-1'>
                  {items.map((definition) => {
                    const Icon = definition.icon;
                    return (
                      <li key={definition.id}>
                        <button
                          type='button'
                          onClick={() => onAdd(definition.id)}
                          className='flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500 hover:bg-zinc-800/60'>
                          <Icon
                            size={18}
                            className='mt-0.5 shrink-0 text-zinc-400'
                          />
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
              </section>
            );
          })}
        </div>
      )}
    </SheetContent>
  </Sheet>
);
