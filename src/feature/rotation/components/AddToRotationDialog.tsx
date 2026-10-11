import { useQuery } from "@tanstack/react-query";
import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "assets/components/ui/dialog";
import { Input } from "assets/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "assets/components/ui/tabs";
import { cn } from "assets/lib/utils";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import { Check, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { PLAYABLE_SKILLS } from "../data/rotationCatalog";
import { useRotationDisplay } from "../hooks/useRotationDisplay";
import type { RotationItem, RotationItemType } from "../types/rotation.types";
import { ROTATION_ITEM_TYPES } from "../types/rotation.types";
import { MAX_ROTATION_ITEMS, rotationKey } from "../utils/rotation.utils";
import { CustomItemForm } from "./CustomItemForm";
import { RotationThumb } from "./RotationThumb";

type Candidate = Omit<RotationItem, "addedAt">;

interface AddToRotationDialogProps {
  uid: string;
  items: RotationItem[];
  onAdd: (item: Candidate) => Promise<boolean>;
  onRemove: (item: Candidate) => Promise<unknown>;
  onClose: () => void;
}

const EXERCISE_CANDIDATES: Candidate[] = exercisesAgregat.map((exercise) => ({
  type: "exercise",
  id: exercise.id,
}));
const SKILL_CANDIDATES: Candidate[] = PLAYABLE_SKILLS.map((skill) => ({
  type: "skill",
  id: skill.id,
}));

/**
 * Picks what goes into rotation, one tap per item, saved as you go. Songs come
 * from the player's own library — rotation is for things already learned.
 */
export const AddToRotationDialog = ({
  uid,
  items,
  onAdd,
  onRemove,
  onClose,
}: AddToRotationDialogProps) => {
  const { describe, t } = useRotationDisplay();
  const [tab, setTab] = useState<RotationItemType>("song");
  const [search, setSearch] = useState("");

  const songsQuery = useQuery({
    queryKey: ["rotation-library-songs", uid],
    queryFn: () => getUserSongs(uid),
  });

  const songCandidates = useMemo<Candidate[]>(() => {
    const lists = songsQuery.data;
    if (!lists) return [];
    const seen = new Set<string>();
    // Mastered first: those are the ones that fade without playing.
    return [...lists.learned, ...lists.learning, ...lists.wantToLearn]
      .filter((song) => !seen.has(song.id) && !!seen.add(song.id))
      .map((song) => ({
        type: "song" as const,
        id: song.id,
        title: song.title,
        artist: song.artist,
        ...(song.coverUrl && { coverUrl: song.coverUrl }),
      }));
  }, [songsQuery.data]);

  const inRotation = useMemo(() => new Set(items.map(rotationKey)), [items]);

  const candidates = useMemo(() => {
    const source: Candidate[] =
      tab === "song"
        ? songCandidates
        : tab === "exercise"
          ? EXERCISE_CANDIDATES
          : tab === "skill"
            ? SKILL_CANDIDATES
            : items.filter((item) => item.type === "custom");
    // The custom tab lists the player's own items under the form, unfiltered.
    const needle = tab === "custom" ? "" : search.trim().toLowerCase();
    return source
      .map((candidate) => ({
        candidate,
        display: describe({ ...candidate, addedAt: 0 }),
      }))
      .filter(
        ({ display }) =>
          !needle ||
          display.title.toLowerCase().includes(needle) ||
          display.subtitle.toLowerCase().includes(needle),
      );
  }, [tab, songCandidates, items, search, describe]);

  const addCustom = async (candidate: Candidate) => {
    try {
      const added = await onAdd(candidate);
      if (!added) toast.error(t("picker.full", { count: MAX_ROTATION_ITEMS }));
      return added;
    } catch {
      toast.error(t("toast.error"));
      return false;
    }
  };

  const countOf = (type: RotationItemType) =>
    items.filter((item) => item.type === type).length;

  const toggle = async (candidate: Candidate) => {
    try {
      if (inRotation.has(rotationKey(candidate))) {
        await onRemove(candidate);
        return;
      }
      const added = await onAdd(candidate);
      if (!added) toast.error(t("picker.full", { count: MAX_ROTATION_ITEMS }));
    } catch {
      toast.error(t("toast.error"));
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='flex max-h-[90vh] flex-col gap-6 border-0 bg-zinc-900 shadow-none sm:max-w-lg sm:p-8'>
        <div className='space-y-2 pr-10'>
          <DialogTitle className='text-xl font-bold text-zinc-100'>
            {t("picker.title")}
          </DialogTitle>
          <DialogDescription className='text-sm text-zinc-400'>
            {t("picker.description")}
          </DialogDescription>
        </div>

        <div className='space-y-3'>
          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as RotationItemType)}>
            <TabsList className='grid h-auto w-full grid-cols-4 bg-zinc-800/50'>
              {ROTATION_ITEM_TYPES.map((type) => (
                <TabsTrigger
                  key={type}
                  value={type}
                  className='gap-2 py-2 text-zinc-400 data-[state=active]:bg-zinc-700 data-[state=active]:text-zinc-100 data-[state=active]:shadow-none hover:text-zinc-200'>
                  {t(`picker.tabs.${type}`)}
                  {countOf(type) > 0 && (
                    <span className='text-xs tabular-nums text-emerald-400'>
                      {countOf(type)}
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {tab !== "custom" && (
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("picker.search")}
              aria-label={t("picker.search")}
              startIcon={<Search className='h-4 w-4 text-zinc-500' />}
              className='h-11 border-0 bg-zinc-800/60 text-zinc-100'
            />
          )}
        </div>

        <div className='-mx-2 min-h-[12rem] flex-1 space-y-8 overflow-y-auto px-2'>
          {tab === "custom" && <CustomItemForm onAdd={addCustom} />}
          {tab === "custom" && candidates.length > 0 && (
            <p className='px-1 text-sm font-medium text-zinc-200'>
              {t("custom.yours")}
            </p>
          )}
          <ul className='space-y-1'>
            {tab === "song" &&
              !songsQuery.isLoading &&
              songCandidates.length === 0 && (
                <li className='flex flex-col items-start gap-3 px-1 py-4'>
                  <p className='text-sm text-zinc-400'>
                    {t("picker.no_songs")}
                  </p>
                  <Link
                    href='/songs?view=explore'
                    className='rounded text-sm font-semibold text-zinc-100 underline-offset-4 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:underline'>
                    {t("picker.find_songs")}
                  </Link>
                </li>
              )}
            {candidates.length === 0 &&
              tab !== "custom" &&
              (tab !== "song" || songCandidates.length > 0) && (
                <li className='px-1 py-4 text-sm text-zinc-500'>
                  {t("picker.no_results")}
                </li>
              )}
            {candidates.map(({ candidate, display }) => {
              const added = inRotation.has(rotationKey(candidate));
              return (
                <li key={rotationKey(candidate)}>
                  <button
                    type='button'
                    onClick={() => toggle(candidate)}
                    aria-pressed={added}
                    aria-label={t(
                      added ? "picker.remove_item" : "picker.add_item",
                      {
                        title: display.title,
                      },
                    )}
                    className='flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-800/70'>
                    <RotationThumb
                      display={display}
                      className='h-10 w-10'
                      iconClassName='h-4 w-4'
                    />
                    <span className='min-w-0 flex-1'>
                      <span className='block truncate text-sm font-medium text-zinc-100'>
                        {display.title}
                      </span>
                      <span className='mt-0.5 block truncate text-xs text-zinc-400'>
                        {display.subtitle}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                        added
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-zinc-800 text-zinc-300",
                      )}>
                      {added ? (
                        <Check className='h-4 w-4' />
                      ) : (
                        <Plus className='h-4 w-4' />
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <Button
          onClick={onClose}
          className='h-11 rounded-lg bg-white font-bold text-black focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-200'>
          {t("picker.done")}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
