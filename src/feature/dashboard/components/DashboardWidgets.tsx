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
import {
  getWidgetDefinition,
  WIDGET_GROUP_LABELS,
  WIDGET_GROUP_ORDER,
} from "feature/dashboard/data/widgetCatalog";
import { useDashboardLayout } from "feature/dashboard/hooks/useDashboardLayout";
import { useLocalizeWidget } from "feature/dashboard/hooks/useLocalizeWidget";
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
import { LogsBoxSkeleton } from "feature/logsBox/view/LogsBoxView/LogsBoxView";
import { MountOnVisible } from "feature/seoLanding/components/MountOnVisible";
import { useTranslation } from "hooks/useTranslation";
import { Check, Plus, RotateCcw, Settings2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useResponsiveStore } from "store/useResponsiveStore";

import { AddWidgetSheet } from "./AddWidgetSheet";
import { WidgetFrame } from "./WidgetFrame";
import { WidgetContent } from "./widgets/WidgetContent";

const GRID = "grid grid-cols-1 gap-6 lg:grid-cols-2";

/**
 * Everything under the hero. The support banner and community feed at the bottom are fixed; between
 * them sit the player's cards in the player's order, plus the Customize mode
 * that changes both. Every change is saved as it is made, so Done only closes
 * the toolbars.
 */
export const DashboardWidgets = () => {
  const { t } = useTranslation("dashboard");
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
  const localizeWidget = useLocalizeWidget();
  const localizedGroupLabels = Object.fromEntries(
    WIDGET_GROUP_ORDER.map((group) => [
      group,
      t(`widget_groups.${group}`, WIDGET_GROUP_LABELS[group]),
    ]),
  );

  return (
    <DashboardLayoutProvider value={contextValue}>
      <div className='flex flex-col gap-6'>

        <div className='space-y-4'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            {isEditing ? (
              <p className='text-sm text-zinc-400'>
                {t("customize.hint")}
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
                    className='h-11 px-4'
                    onClick={() => setIsAddOpen(true)}>
                    <Plus aria-hidden className='mr-2' />
                    {t("customize.add_widget")}
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='h-11 px-4'
                    disabled={isDefaultLayout(layout)}
                    onClick={() => updateLayout(normalizeLayout(undefined))}>
                    <RotateCcw aria-hidden className='mr-2' />
                    {t("customize.reset")}
                  </Button>
                  <Button
                    type='button'
                    size='sm'
                    className='h-11 px-4'
                    onClick={() => setIsEditing(false)}>
                    <Check aria-hidden className='mr-2' />
                    {t("customize.done")}
                  </Button>
                </>
              ) : (
                <Button
                  type='button'
                  variant='subtle'
                  size='sm'
                  className='h-9 px-4'
                  disabled={isLoading}
                  onClick={() => setIsEditing(true)}>
                  <Settings2 aria-hidden className='mr-2' />
                  {t("customize.customize")}
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
                {t("customize.empty_title")}
              </p>
              <p className='mt-1 text-sm text-zinc-400'>
                {isEditing
                  ? t("customize.empty_editing")
                  : t("customize.empty_hint")}
              </p>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='mt-5 h-11 gap-1.5'
                onClick={() => {
                  setIsEditing(true);
                  setIsAddOpen(true);
                }}>
                <Plus aria-hidden className='mr-2' />
                {t("customize.add_widget")}
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
                    const definition = localizeWidget(
                      getWidgetDefinition(placement.id),
                    );
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

        {/* Below the widgets and the banner, so usually off screen at load. The
            feed brings a pile of listeners (logs, pinned donations, unread
            counts), the changelog and the whole RTDB presence node — none of
            it needs to compete with the widgets above it. */}
        <MountOnVisible placeholder={<LogsBoxSkeleton />}>
          {feedSlot ?? <LogsBoxView />}
        </MountOnVisible>
      </div>

      <AddWidgetSheet
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        hidden={hidden.map(localizeWidget)}
        groupLabels={localizedGroupLabels}
        onAdd={(id) => updateLayout(addWidget(layout, id))}
      />
    </DashboardLayoutProvider>
  );
};
