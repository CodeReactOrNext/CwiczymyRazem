import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import { Input } from "assets/components/ui/input";
import { cn } from "assets/lib/utils";
import { EFFECTS_BY_ID } from "feature/arsenal/data/effectDefinitions";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import { useUserArsenal } from "feature/arsenal/hooks/useUserArsenal";
import type { ChatAttachment } from "feature/chat/types/chat.types";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import { getRecordings } from "feature/recordings/services/getRecordings";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import { useMemo, useState } from "react";

type PickerTab = "exercise" | "plan" | "song" | "recording" | "item";

const TABS: { id: PickerTab; label: string }[] = [
  { id: "exercise", label: "Exercise" },
  { id: "plan", label: "Plan" },
  { id: "song", label: "My songs" },
  { id: "recording", label: "My recordings" },
  { id: "item", label: "My gear" },
];

/** Enough to find something by typing; the rest is one more letter away. */
const MAX_RESULTS = 40;

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60";

interface PickerRow {
  key: string;
  title: string;
  subtitle?: string;
  attachment: ChatAttachment;
}

const matches = (query: string, ...fields: (string | null | undefined)[]) => {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return fields.some((field) => field?.toLowerCase().includes(needle));
};

const minutes = (value: number) => `${Math.round(value)} min`;

/**
 * Picks something from the app to drop into the chat as a card. Exercises and
 * plans come from the static catalog; songs, recordings and gear are the
 * player's own and are read only when their tab is opened.
 */
export const ChatAttachmentPicker = ({
  open,
  onOpenChange,
  userId,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  onPick: (attachment: ChatAttachment) => void;
}) => {
  const [tab, setTab] = useState<PickerTab>("exercise");
  const [query, setQuery] = useState("");

  const songsQuery = useQuery({
    queryKey: ["chat-attach", "songs", userId],
    queryFn: () => getUserSongs(userId!),
    enabled: open && tab === "song" && Boolean(userId),
    staleTime: 5 * 60_000,
  });

  const recordingsQuery = useQuery({
    queryKey: ["chat-attach", "recordings", userId],
    queryFn: () => getRecordings(1, 30, userId!),
    enabled: open && tab === "recording" && Boolean(userId),
    staleTime: 5 * 60_000,
  });

  const arsenalQuery = useUserArsenal(userId, open && tab === "item");

  const rows = useMemo((): PickerRow[] => {
    switch (tab) {
      case "exercise":
        return exercisesAgregat
          .filter((ex) => matches(query, ex.title, ex.category))
          .map((ex) => {
            const subtitle = `${ex.category} · ${minutes(ex.timeInMinutes)}`;
            return {
              key: ex.id,
              title: ex.title,
              subtitle,
              attachment: { kind: "exercise", id: ex.id, title: ex.title, subtitle },
            };
          });
      case "plan":
        return defaultPlans
          .filter((plan) => matches(query, plan.title, plan.category))
          .map((plan) => {
            const subtitle = `${plan.difficulty} · ${minutes(
              plan.exercises.reduce((sum, ex) => sum + ex.timeInMinutes, 0),
            )}`;
            return {
              key: plan.id,
              title: plan.title,
              subtitle,
              attachment: { kind: "plan", id: plan.id, title: plan.title, subtitle },
            };
          });
      case "song": {
        const lists = songsQuery.data;
        const songs = lists
          ? [...lists.learning, ...lists.wantToLearn, ...lists.learned]
          : [];
        return songs
          .filter((song) => matches(query, song.title, song.artist))
          .map((song) => ({
            key: song.id,
            title: song.title,
            subtitle: song.artist,
            attachment: {
              kind: "song",
              id: song.id,
              title: song.title,
              artist: song.artist,
            },
          }));
      }
      case "recording":
        return (recordingsQuery.data?.recordings ?? [])
          .filter((rec) => matches(query, rec.title, rec.songTitle))
          .map((rec) => {
            const subtitle = rec.songTitle
              ? [rec.songTitle, rec.songArtist].filter(Boolean).join(" · ")
              : undefined;
            return {
              key: rec.id,
              title: rec.title,
              subtitle,
              attachment: {
                kind: "recording",
                id: rec.id,
                title: rec.title,
                ...(subtitle && { subtitle }),
              },
            };
          });
      case "item": {
        const arsenal = arsenalQuery.data;
        const guitars = (arsenal?.inventory ?? []).flatMap((item): PickerRow[] => {
          const def = GUITARS_BY_ID.get(item.guitarId);
          if (!def) return [];
          return [
            {
              key: item.id,
              title: `${def.brand} ${def.name}`,
              subtitle: `Guitar · ${def.rarity}`,
              attachment: {
                kind: "item",
                itemType: "guitar",
                itemName: def.name,
                itemBrand: def.brand,
                itemRarity: def.rarity,
                itemImageId: def.imageId,
                rolledItem: item,
              },
            },
          ];
        });
        const effects = (arsenal?.effectInventory ?? []).flatMap(
          (item): PickerRow[] => {
            const def = EFFECTS_BY_ID.get(item.effectId);
            if (!def) return [];
            return [
              {
                key: item.id,
                title: `${def.brand} ${def.name}`,
                subtitle: `Pedal · ${def.rarity}`,
                attachment: {
                  kind: "item",
                  itemType: "effect",
                  itemName: def.name,
                  itemBrand: def.brand,
                  itemRarity: def.rarity,
                  itemImageId: def.imageId,
                  rolledItem: item,
                },
              },
            ];
          },
        );
        return [...guitars, ...effects].filter((row) =>
          matches(query, row.title, row.subtitle),
        );
      }
    }
  }, [tab, query, songsQuery.data, recordingsQuery.data, arsenalQuery.data]);

  const isLoading =
    (tab === "song" && songsQuery.isLoading) ||
    (tab === "recording" && recordingsQuery.isLoading) ||
    (tab === "item" && arsenalQuery.isLoading);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='dark-theme flex max-h-[85vh] flex-col gap-5 rounded-lg bg-zinc-950 p-6 sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='text-base'>Share to chat</DialogTitle>
        </DialogHeader>

        <div className='flex flex-wrap gap-2'>
          {TABS.map((item) => (
            <button
              key={item.id}
              type='button'
              onClick={() => setTab(item.id)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                FOCUS_RING,
                tab === item.id
                  ? "bg-cyan-500/20 text-cyan-100"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
              )}>
              {item.label}
            </button>
          ))}
        </div>

        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder='Search…'
          autoComplete='off'
          className='h-10 rounded-lg border-none bg-zinc-900'
        />

        <div className='-mx-2 min-h-[200px] flex-1 overflow-y-auto px-2 scrollbar scrollbar-track-transparent scrollbar-thumb-zinc-700'>
          {isLoading ? (
            <p className='py-10 text-center text-sm text-zinc-500'>Loading…</p>
          ) : rows.length === 0 ? (
            <p className='py-10 text-center text-sm text-zinc-500'>
              Nothing to share here yet.
            </p>
          ) : (
            <div className='flex flex-col gap-1'>
              {rows.slice(0, MAX_RESULTS).map((row) => (
                <button
                  key={row.key}
                  type='button'
                  onClick={() => {
                    onPick(row.attachment);
                    onOpenChange(false);
                  }}
                  className={cn(
                    "flex flex-col rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-zinc-900",
                    FOCUS_RING,
                  )}>
                  <span className='truncate text-sm font-semibold text-zinc-100'>
                    {row.title}
                  </span>
                  {row.subtitle && (
                    <span className='truncate text-xs text-zinc-500'>
                      {row.subtitle}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
