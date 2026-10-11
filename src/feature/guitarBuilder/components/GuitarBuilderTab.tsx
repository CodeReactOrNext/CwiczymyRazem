import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import { cn } from "assets/lib/utils";
import { getRarityColor } from "feature/arsenal/components/RarityBadge";
import { GUITARS_BY_ID } from "feature/arsenal/data/guitarDefinitions";
import type {
  ArsenalUserData,
  InventoryItem,
} from "feature/arsenal/types/arsenal.types";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
import { PackageOpen, Plus } from "lucide-react";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { SLOT_LABELS } from "../data/components";
import { MAX_STICKERS } from "../data/guitarParts";
import { useBuildGuitar, useRenameGuitar } from "../hooks/useBuildGuitar";
import type { ComponentSlot } from "../types/guitarBuilder.types";
import { checkBuild } from "../utils/components";
import {
  buildFameCost,
  cleanGuitarName,
  GUITAR_NAME_MAX,
  parseCustomGuitarId,
  rebuildFameCost,
} from "../utils/customGuitar";
import {
  EMPTY_LOADOUT,
  GuitarWorkbench,
  type WorkbenchState,
} from "./GuitarWorkbench";

interface GuitarBuilderTabProps {
  data: ArsenalUserData;
  fame: number;
}

/** A built guitar in the strip along the top — pick one to rebuild it. */
const BuildTile = ({
  item,
  active,
  onSelect,
}: {
  item: InventoryItem;
  active: boolean;
  onSelect: () => void;
}) => {
  const def = GUITARS_BY_ID.get(item.guitarId);
  if (!def || !item.custom) return null;
  return (
    <button
      type='button'
      aria-pressed={active}
      onClick={onSelect}
      className={cn(
        "flex w-44 shrink-0 flex-col gap-2 rounded-lg p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400",
        active ? "bg-cyan-500/10" : "bg-zinc-900/60 hover:bg-zinc-800",
      )}>
      <img
        src={getRankBadgeSrc(def.imageId, "small")}
        alt=''
        className='h-14 w-full object-contain'
        draggable={false}
        loading='lazy'
      />
      <span className='space-y-0.5'>
        <span
          className={cn(
            "block truncate text-xs",
            active ? "text-cyan-400" : "text-zinc-200",
          )}>
          {def.name}
        </span>
        <span className='flex justify-between text-xs'>
          <span style={{ color: getRarityColor(def.rarity) }}>
            {def.rarity}
          </span>
          <span className='tabular-nums text-zinc-400'>
            Lvl {item.custom.level}
          </span>
        </span>
      </span>
    </button>
  );
};

/**
 * The Builder tab: put a guitar together from parts out of cases, for Fame,
 * or pick one already built and swap its parts. A finished build is an
 * ordinary guitar in the stash — rack it, show it, sell it.
 */
export const GuitarBuilderTab = ({ data, fame }: GuitarBuilderTabProps) => {
  const router = useRouter();
  const { mutate: build, isPending } = useBuildGuitar();
  const { mutate: rename, isPending: isRenaming } = useRenameGuitar();
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [session, setSession] = useState(0);
  const [slot, setSlot] = useState<ComponentSlot>("body");

  const builds = useMemo(
    () => (data.inventory ?? []).filter((item) => item.custom),
    [data.inventory],
  );
  const editing = builds.find((item) => item.id === editingId) ?? null;
  const loose = useMemo(() => data.components ?? [], [data.components]);
  const stash = useMemo(
    () => [...loose, ...(editing?.custom?.parts ?? [])],
    [loose, editing],
  );
  const newUids = useMemo(
    () => new Set(loose.filter((part) => part.isNew).map((part) => part.uid)),
    [loose],
  );

  const storedName = editing
    ? (parseCustomGuitarId(editing.guitarId)?.name ?? "")
    : "";

  const select = (id: string | null) => {
    const item = builds.find((b) => b.id === id);
    setEditingId(id);
    setName(item ? (parseCustomGuitarId(item.guitarId)?.name ?? "") : "");
    setSession((n) => n + 1);
  };

  const cleanName = cleanGuitarName(name);
  const renamed = Boolean(editing) && (cleanName ?? "") !== storedName;

  const action = ({ loadout, stickers, summary }: WorkbenchState) => {
    const check = checkBuild(stash, loadout, stickers, MAX_STICKERS);
    const cost = editing?.custom
      ? rebuildFameCost(editing.custom.level, summary.total)
      : buildFameCost(summary.total);
    const short = fame < cost;
    const reason = !check.ok ? check.error : short ? "Not enough Fame" : null;
    return (
      <div className='space-y-2'>
        <div className='flex gap-2'>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={GUITAR_NAME_MAX}
            placeholder={
              editing ? "Name your guitar" : "Name your guitar (optional)"
            }
            aria-label='Guitar name'
            className='h-10 bg-zinc-900/60'
          />
          {editing && renamed && (
            <Button
              variant='secondary'
              className='h-10 shrink-0'
              disabled={isRenaming}
              loading={isRenaming}
              onClick={() => rename({ itemId: editing.id, name: cleanName })}>
              Save name
            </Button>
          )}
        </div>
        <Button
          className='h-11 w-full bg-white text-zinc-900 hover:bg-zinc-200'
          disabled={Boolean(reason) || isPending}
          loading={isPending}
          onClick={() =>
            build(
              {
                loadout,
                stickers,
                itemId: editing?.id ?? null,
                name: cleanName,
              },
              {
                onSuccess: (result) => {
                  const built = GUITARS_BY_ID.get(result.item.guitarId)?.name;
                  toast.success(
                    editing
                      ? `${built} rebuilt`
                      : `${built} built — hang it on your Rig`,
                  );
                  select(editing ? result.item.id : null);
                },
              },
            )
          }>
          <span className='flex items-center gap-2'>
            {editing ? "Rebuild guitar" : "Build guitar"}
            <span className='flex items-center gap-1 text-amber-600'>
              <img src='/images/coin.png' alt='' className='h-4 w-4' />
              {cost}
            </span>
          </span>
        </Button>
        {reason && (
          <p className='text-center text-xs text-zinc-400'>{reason}</p>
        )}
      </div>
    );
  };

  const emptySlot = (
    <div className='flex flex-col items-center gap-4 rounded-lg bg-zinc-900/40 px-6 py-12 text-center'>
      <PackageOpen className='size-8 text-zinc-400' aria-hidden />
      <p className='max-w-sm text-sm text-zinc-400'>
        No {SLOT_LABELS[slot].toLowerCase()} yet. Parts drop from the Standard,
        Premium Guitar and Elite Guitar cases.
      </p>
      <Button
        variant='secondary'
        size='sm'
        onClick={() =>
          router.replace(
            { query: { ...router.query, tab: "cases" } },
            undefined,
            {
              shallow: true,
            },
          )
        }>
        Open cases
      </Button>
    </div>
  );

  return (
    <div className='space-y-6'>
      {builds.length > 0 && (
        <div className='no-scrollbar flex gap-2 overflow-x-auto'>
          <button
            type='button'
            aria-pressed={!editing}
            onClick={() => select(null)}
            className={cn(
              "flex w-32 shrink-0 flex-col items-center justify-center gap-2 rounded-lg p-3 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400",
              !editing
                ? "bg-cyan-500/10 text-cyan-400"
                : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
            )}>
            <Plus className='size-6' aria-hidden />
            New guitar
          </button>
          {builds.map((item) => (
            <BuildTile
              key={item.id}
              item={item}
              active={item.id === editingId}
              onSelect={() => select(item.id)}
            />
          ))}
        </div>
      )}

      <GuitarWorkbench
        key={`${editingId ?? "new"}-${session}`}
        stash={stash}
        initialLoadout={editing?.custom?.loadout ?? EMPTY_LOADOUT}
        initialStickers={editing?.custom?.stickers ?? []}
        slot={slot}
        onSlotChange={setSlot}
        newUids={newUids}
        action={action}
        emptySlot={emptySlot}
        name={cleanName}
      />
    </div>
  );
};
