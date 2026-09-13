import type { DragEndEvent } from "@dnd-kit/core";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Button } from "assets/components/ui/button";
import { Skeleton } from "assets/components/ui/skeleton";
import { SupportBanner } from "feature/dashboard/components/SupportBanner";
import {
  DashboardLayoutProvider,
  useDashboardData,
} from "feature/dashboard/context/DashboardContext";
import { getWidgetDefinition } from "feature/dashboard/data/widgetCatalog";
import { useDashboardLayout } from "feature/dashboard/hooks/useDashboardLayout";
import {
  addWidget,
  hiddenWidgets,
  isDefaultLayout,
  moveWidget,
  normalizeLayout,
  removeWidget,
  setWidgetSize,
} from "feature/dashboard/utils/dashboardLayout";
import LogsBoxView from "feature/logsBox/view/LogsBoxView";
import { GettingStartedWidget } from "feature/onboarding/components/GettingStartedWidget/GettingStartedWidget";
import { Check, Plus, RotateCcw, Settings2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useResponsiveStore } from "store/useResponsiveStore";

import { AddWidgetSheet } from "./AddWidgetSheet";
import { WidgetFrame } from "./WidgetFrame";
import { WidgetContent } from "./widgets/WidgetContent";

const GRID = "grid grid-cols-1 gap-6 lg:grid-cols-2";

/**
 * Everything under the hero. The getting-started checklist at the top and
 * the support banner and community feed at the bottom are fixed; between
 * them sit the player's cards in the player's order, plus the Customize mode
 * that changes both. Every change is saved as it is made, so Done only closes
 * the toolbars.
 */
export const DashboardWidgets = () => {
  const { userAuth, feedSlot } = useDashboardData();
  const { layout, isLoading, updateLayout } = useDashboardLayout(userAuth);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const isMobile = useResponsiveStore((state) => state.isMobile);

  const sensors = useSensors(
    // A few pixels of travel before a drag starts, so a tap on the handle
    // still reads as a click for the keyboard instructions.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = layout.widgets.findIndex((w) => w.id === active.id);
    const to = layout.widgets.findIndex((w) => w.id === over.id);
    updateLayout(moveWidget(layout, from, to));
  };

  const hidden = useMemo(() => hiddenWidgets(layout), [layout]);
  const contextValue = useMemo(
    () => ({ layout, isEditing, updateLayout }),
    [layout, isEditing, updateLayout],
  );
  const widgetIds = layout.widgets.map((w) => w.id);

  return (
    <DashboardLayoutProvider value={contextValue}>
      {/* A flex column, not space-y: the checklist renders nothing once it is
          claimed, and a gap skips a hidden child where a margin would not. */}
      <div className='flex flex-col gap-6'>
        <div className='empty:hidden'>
          <GettingStartedWidget />
        </div>

        <div className='space-y-4'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            {isEditing ? (
              <p className='text-sm text-zinc-400'>
                Drag cards to reorder, hide what you don&apos;t need, add what
                you do.
              </p>
            ) : (
              <span />
            )}
            <div className='ml-auto flex flex-wrap items-center gap-2'>
              {isEditing ? (
                <>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='gap-1.5'
                    onClick={() => setIsAddOpen(true)}>
                    <Plus size={14} />
                    Add widget
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='gap-1.5'
                    disabled={isDefaultLayout(layout)}
                    onClick={() => updateLayout(normalizeLayout(undefined))}>
                    <RotateCcw size={14} />
                    Reset
                  </Button>
                  <Button
                    type='button'
                    size='sm'
                    className='gap-1.5'
                    onClick={() => setIsEditing(false)}>
                    <Check size={14} />
                    Done
                  </Button>
                </>
              ) : (
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='gap-1.5 text-zinc-400 hover:text-zinc-100'
                  disabled={isLoading}
                  onClick={() => setIsEditing(true)}>
                  <Settings2 size={14} />
                  Customize
                </Button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className={GRID}>
              <Skeleton className='h-64 rounded-lg' />
              <Skeleton className='h-64 rounded-lg' />
              <Skeleton className='h-48 rounded-lg lg:col-span-2' />
            </div>
          ) : layout.widgets.length === 0 ? (
            <div className='rounded-lg bg-zinc-900/40 px-6 py-12 text-center'>
              <p className='text-sm font-semibold text-zinc-200'>
                Nothing here yet.
              </p>
              <p className='mt-1 text-sm text-zinc-400'>
                {isEditing
                  ? "Add a widget to fill this space."
                  : "Customize Home to put cards back here."}
              </p>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='mt-5 gap-1.5'
                onClick={() => {
                  setIsEditing(true);
                  setIsAddOpen(true);
                }}>
                <Plus size={14} />
                Add widget
              </Button>
            </div>
          ) : (
            <DndContext
              id='home-widgets'
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}>
              <SortableContext items={widgetIds} strategy={rectSortingStrategy}>
                <div className={GRID}>
                  {layout.widgets.map((placement) => {
                    const definition = getWidgetDefinition(placement.id);
                    return (
                      <WidgetFrame
                        key={placement.id}
                        placement={placement}
                        definition={definition}
                        isEditing={isEditing}
                        canResize={definition.resizable && !isMobile}
                        onRemove={() =>
                          updateLayout(removeWidget(layout, placement.id))
                        }
                        onResize={(size) =>
                          updateLayout(
                            setWidgetSize(layout, placement.id, size),
                          )
                        }>
                        <WidgetContent id={placement.id} />
                      </WidgetFrame>
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>

        <SupportBanner />

        {feedSlot ?? <LogsBoxView />}
      </div>

      <AddWidgetSheet
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        hidden={hidden}
        onAdd={(id) => updateLayout(addWidget(layout, id))}
      />
    </DashboardLayoutProvider>
  );
};
