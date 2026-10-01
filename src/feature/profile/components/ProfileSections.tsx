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
import { cn } from "assets/lib/utils";
import type { AchievementList } from "feature/achievements/types";
import { AddWidgetSheet } from "feature/dashboard/components/AddWidgetSheet";
import {
  getProfileSectionDefinition,
  PROFILE_SECTION_CATALOG,
} from "feature/profile/data/profileSectionCatalog";
import type {
  ProfileLayoutConfig,
  ProfileSectionId,
} from "feature/profile/types/profileLayout.types";
import {
  addSection,
  DEFAULT_PROFILE_LAYOUT,
  hasSection,
  isDefaultProfileLayout,
  isProfileFull,
  MAX_SECTIONS,
  moveSection,
  removeSection,
  setSectionSize,
} from "feature/profile/utils/profileLayout";
import type { Song } from "feature/songs/types/songs.type";
import { Check, IdCard, Plus, RotateCcw, Settings2 } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useResponsiveStore } from "store/useResponsiveStore";

import { ProfileCardSheet } from "./ProfileCardSheet";
import { SectionTile } from "./SectionTile";

const GRID = "grid grid-cols-1 lg:grid-cols-2";

interface ProfileSectionsProps {
  layout: ProfileLayoutConfig;
  updateLayout: (layout: ProfileLayoutConfig) => void;
  isOwner: boolean;
  renderSection: (id: ProfileSectionId) => ReactNode;
  earned: AchievementList[];
  learnedSongs: Song[];
}

/**
 * The part of the profile under the header, in the order the player chose.
 * The owner gets a Customize mode — the same one Home has — to reorder, hide,
 * resize and add sections, and a sheet for the header itself. Visitors only
 * ever see the result.
 */
export const ProfileSections = ({
  layout,
  updateLayout,
  isOwner,
  renderSection,
  earned,
  learnedSongs,
}: ProfileSectionsProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isCardOpen, setIsCardOpen] = useState(false);
  const isMobile = useResponsiveStore((state) => state.isMobile);
  const editing = isOwner && isEditing;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = layout.sections.findIndex((s) => s.id === active.id);
    const to = layout.sections.findIndex((s) => s.id === over.id);
    updateLayout(moveSection(layout, from, to));
  };

  const hidden = useMemo(
    () =>
      PROFILE_SECTION_CATALOG.filter(
        (definition) => !hasSection(layout, definition.id),
      ),
    [layout],
  );

  return (
    <div className='space-y-6'>
      {isOwner && (
        <div className='flex flex-wrap items-center justify-between gap-3'>
          {editing ? (
            <p className='text-sm text-zinc-400'>
              <span className='font-semibold tabular-nums text-zinc-200'>
                {layout.sections.length}/{MAX_SECTIONS} slots
              </span>{" "}
              · Drag to reorder, hide what you don&apos;t want to show.
            </p>
          ) : (
            <span />
          )}
          <div className='ml-auto flex flex-wrap items-center gap-2'>
            {editing ? (
              <>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='gap-1.5'
                  onClick={() => setIsCardOpen(true)}>
                  <IdCard size={14} />
                  Profile card
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  className='gap-1.5'
                  onClick={() => setIsAddOpen(true)}>
                  <Plus size={14} />
                  Add section
                </Button>
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='gap-1.5'
                  disabled={isDefaultProfileLayout(layout)}
                  onClick={() =>
                    // Texts, title and trophies are the player's own picks,
                    // not layout — a reset puts sections and switches back.
                    updateLayout({
                      ...DEFAULT_PROFILE_LAYOUT,
                      tagline: layout.tagline,
                      about: layout.about,
                      title: layout.title,
                      trophies: layout.trophies,
                      featuredSongs: layout.featuredSongs,
                      emblem: layout.emblem,
                    })
                  }>
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
                onClick={() => setIsEditing(true)}>
                <Settings2 size={14} />
                Customize profile
              </Button>
            )}
          </div>
        </div>
      )}

      {layout.sections.length === 0 ? (
        <div className='rounded-2xl bg-zinc-900/30 px-6 py-12 text-center'>
          <p className='text-sm font-semibold text-zinc-200'>
            {isOwner
              ? "Your profile shows only the card right now."
              : "This player keeps their profile short."}
          </p>
          {isOwner && (
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
              Add section
            </Button>
          )}
        </div>
      ) : (
        <DndContext
          id='profile-sections'
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}>
          <SortableContext
            items={layout.sections.map((s) => s.id)}
            strategy={rectSortingStrategy}>
            <div className={cn(GRID, editing ? "gap-3" : "gap-8")}>
              {layout.sections.map((placement, index) => {
                const definition = getProfileSectionDefinition(placement.id);
                return (
                  <SectionTile
                    key={placement.id}
                    placement={placement}
                    definition={definition}
                    isEditing={editing}
                    canResize={definition.resizable && !isMobile}
                    isFirst={index === 0}
                    isLast={index === layout.sections.length - 1}
                    onMove={(delta) =>
                      updateLayout(moveSection(layout, index, index + delta))
                    }
                    onRemove={() =>
                      updateLayout(removeSection(layout, placement.id))
                    }
                    onResize={(size) =>
                      updateLayout(setSectionSize(layout, placement.id, size))
                    }>
                    {renderSection(placement.id)}
                  </SectionTile>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {isOwner && (
        <>
          <AddWidgetSheet
            open={isAddOpen}
            onOpenChange={setIsAddOpen}
            hidden={hidden}
            onAdd={(id) => updateLayout(addSection(layout, id))}
            title='Add to profile'
            description='New sections land at the bottom — drag them where they belong.'
            emptyText='Every section is already on your profile.'
            disabledReason={
              isProfileFull(layout)
                ? `Your profile is full — ${MAX_SECTIONS} of ${MAX_SECTIONS} slots used. Hide a section to make room.`
                : undefined
            }
          />
          <ProfileCardSheet
            open={isCardOpen}
            onOpenChange={setIsCardOpen}
            layout={layout}
            onChange={updateLayout}
            earned={earned}
            learnedSongs={learnedSongs}
          />
        </>
      )}
    </div>
  );
};
