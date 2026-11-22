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
import { useIsFetching } from "@tanstack/react-query";
import { Button } from "assets/components/ui/button";
import { Skeleton } from "assets/components/ui/skeleton";
import { cn } from "assets/lib/utils";
import { EmptyState } from "components/EmptyState/EmptyState";
import { SupportBanner } from "feature/dashboard/components/SupportBanner";
import {
  DashboardLayoutProvider,
  useDashboardCustomize,
  useDashboardData,
} from "feature/dashboard/context/DashboardContext";
import {
  getWidgetDefinition,
  WIDGET_GROUP_LABELS,
  WIDGET_GROUP_ORDER,
} from "feature/dashboard/data/widgetCatalog";
import { useDashboardLayout } from "feature/dashboard/hooks/useDashboardLayout";
import { useIsNewPlayer } from "feature/dashboard/hooks/useIsNewPlayer";
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
import { Check, Loader2, Plus, RotateCcw, Settings2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useResponsiveStore } from "store/useResponsiveStore";

import { AddWidgetSheet } from "./AddWidgetSheet";
import { WidgetFrame } from "./WidgetFrame";
import { WidgetContent } from "./widgets/WidgetContent";

const GRID = "grid grid-cols-1 gap-6 lg:grid-cols-2";

/**
 * Everything under the hero. The support banner (from the player's third
 * practice day on) and community feed at the bottom are fixed; between
 * them sit the player's cards in the player's order, plus the Customize mode
 * that changes both. Every change is saved as it is made, so Done only closes
 * the toolbars.
 */
export const DashboardWidgets = () => {
  const { t } = useTranslation("dashboard");
  const { userAuth, feedSlot } = useDashboardData();
  const isNewPlayer = useIsNewPlayer();
  const { layout, isLoading, updateLayout } = useDashboardLayout(
    userAuth,
    isNewPlayer,
  );
  // Home's hero holds the Customize key from `md` up, so there the mode lives
  // above these cards; on its own the block keeps the mode to itself.
  const lifted = useDashboardCustomize();
  const [ownEditing, setOwnEditing] = useState(false);
  const isEditing = lifted ? lifted.isEditing : ownEditing;
  const setIsEditing = lifted ? lifted.setIsEditing : setOwnEditing;
  const [isAddOpen, setIsAddOpen] = useState(false);
  const isMobile = useResponsiveStore((state) => state.isMobile);
  // Cards keep showing what they had while fresher answers are on the way;
  // this is the only sign of that, so nothing on the page has to move.
  const isRefreshing = useIsFetching() > 0;

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

        {/* gap, not space-y: the toolbar row is gone from `md` up while the
            hero holds the key, and a hidden row must not leave its margin. */}
        <div className='flex flex-col gap-4'>
          <div
            className={cn(
              "flex flex-wrap items-center justify-between gap-3",
              lifted && !isEditing && "md:hidden",
            )}>
            {isEditing ? (
              <p className='text-sm text-zinc-400'>
                {t("customize.hint")}
              </p>
            ) : (
              <span />
            )}
            <div className='ml-auto flex flex-wrap items-center gap-2'>
              {isRefreshing && !isLoading && !isEditing && (
                <span
                  role='status'
                  className='mr-1 flex items-center gap-1.5 text-xs text-zinc-500'>
                  <Loader2 aria-hidden className='h-3.5 w-3.5 animate-spin' />
                  {t("customize.refreshing", "Updating…")}
                </span>
              )}
              {isEditing ? (
                <>
                  <Button
                    type='button'
                    variant='outline'
                    disabled={isLoading}
                    onClick={() => setIsAddOpen(true)}>
                    <Plus aria-hidden />
                    {t("customize.add_widget")}
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    // The hero's key can open this before the saved layout
                    // lands; a reset then would write over it unseen.
                    disabled={isLoading || isDefaultLayout(layout)}
                    onClick={() => updateLayout(normalizeLayout(undefined))}>
                    <RotateCcw aria-hidden />
                    {t("customize.reset")}
                  </Button>
                  <Button type='button' onClick={() => setIsEditing(false)}>
                    <Check aria-hidden />
                    {t("customize.done")}
                  </Button>
                </>
              ) : (
                <Button
                  type='button'
                  variant='subtle'
                  disabled={isLoading}
                  onClick={() => setIsEditing(true)}>
                  <Settings2 aria-hidden />
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
            <EmptyState
              icon={<Settings2 />}
              title={t("customize.empty_title")}
              description={
                isEditing
                  ? t("customize.empty_editing")
                  : t("customize.empty_hint")
              }
              action={
                <Button
                  type='button'
                  onClick={() => {
                    setIsEditing(true);
                    setIsAddOpen(true);
                  }}>
                  <Plus aria-hidden />
                  {t("customize.add_widget")}
                </Button>
              }
            />
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

        {/* Not before the player has practised on a few days: with the short
            starter Home it would land on the first screen, asking for support
            ahead of the first session. */}
        {!isNewPlayer && <SupportBanner />}

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
