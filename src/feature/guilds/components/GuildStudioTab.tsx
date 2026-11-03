import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "assets/components/ui/dialog";
import { cn } from "assets/lib/utils";
import { FameCoin } from "feature/arsenal/components/Workshop/FameCoin";
import { GuildStudioScene } from "feature/guilds/components/GuildStudioScene";
import type { StudioItem } from "feature/guilds/data/guildStudio";
import {
  STUDIO_BOARD_AWARDS,
  STUDIO_BOARD_ID,
  STUDIO_ITEMS,
  STUDIO_MAX_ITEM_LEVEL,
  STUDIO_MAX_ROOM_LEVEL,
  studioArtSrc,
} from "feature/guilds/data/guildStudio";
import type { StudioText } from "feature/guilds/hooks/useStudioText";
import { useStudioText } from "feature/guilds/hooks/useStudioText";
import type { GuildMember } from "feature/guilds/types/guild.types";
import type {
  GuildStudio,
  UpgradeCheck,
  WeeklyMemberStats,
} from "feature/guilds/utils/guildStudio.utils";
import {
  checkItemUpgrade,
  checkRoomUpgrade,
  itemCap,
  itemLevel,
  podiumFor,
  studioProgress,
} from "feature/guilds/utils/guildStudio.utils";
import { Check } from "lucide-react";
import { useState } from "react";

/**
 * The guild studio tab: the room as a scene with the gear standing in it, the
 * room's own level and the guild's Fame on top, and the list of pieces under
 * it. Picking a piece, in the room or on the list, opens its ladder and its
 * upgrade in a dialog. It only draws and calls back — whoever hosts it owns the
 * studio, the Fame and the writes.
 *
 * The catalog carries perks per piece, but none of them pays out yet, so none
 * is shown: the studio is the guild's room to fit out, not a promise.
 */

const Cost = ({ amount }: { amount: number }) => (
  <span className='inline-flex items-center gap-1.5 tabular-nums'>
    <FameCoin size={16} />
    {amount.toLocaleString()}
  </span>
);

const LevelPips = ({
  level,
  cap,
  label,
}: {
  level: number;
  cap: number;
  label: string;
}) => (
  <span className='flex gap-1' aria-label={label}>
    {Array.from({ length: STUDIO_MAX_ITEM_LEVEL }, (_, i) => (
      <span
        key={i}
        className={cn(
          "h-1.5 w-4 rounded-full transition-colors duration-base",
          i < level
            ? "bg-cyan-400"
            : i < cap
              ? "bg-zinc-700"
              : "bg-zinc-800/60",
        )}
      />
    ))}
  </span>
);

/** The price on the button; a maxed check has none, and no button either. */
const costOf = (check: UpgradeCheck): number =>
  "cost" in check ? check.cost : 0;

/** Why the button is off, in the one sentence a member needs. */
const blockedReason = (check: UpgradeCheck, text: StudioText) => {
  if (check.ok) return null;
  if (check.reason === "maxed") return text.t("studio.maxed");
  if (check.reason === "room")
    return text.t("studio.needs_room", {
      room: text.roomName(check.roomLevel),
    });
  return text.t("studio.short", { count: check.short.toLocaleString() });
};

interface RoomHeaderProps {
  studio: GuildStudio;
  bank: number;
  busy: boolean;
  onUpgrade: () => void;
}

const RoomHeader = ({ studio, bank, busy, onUpgrade }: RoomHeaderProps) => {
  const text = useStudioText();
  const { t } = text;
  const check = checkRoomUpgrade(studio, bank);
  const progress = studioProgress(studio);
  const hasNextRoom = studio.roomLevel < STUDIO_MAX_ROOM_LEVEL;
  const reason = blockedReason(check, text);

  return (
    <section className='space-y-6 rounded-lg bg-zinc-900/40 p-5 sm:p-6'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='max-w-2xl space-y-1'>
          <p className='text-sm text-zinc-400'>
            {t("studio.room_level", {
              level: studio.roomLevel,
              max: STUDIO_MAX_ROOM_LEVEL,
            })}
          </p>
          <h2 className='font-display text-2xl font-bold text-zinc-100'>
            {text.roomName(studio.roomLevel)}
          </h2>
          <p className='text-sm text-zinc-400'>
            {t("studio.gear_cap", {
              cap: itemCap(studio.roomLevel),
              built: progress.built,
              total: progress.total,
            })}
          </p>
          <p className='pt-2 text-sm leading-relaxed text-zinc-400'>
            {t("studio.intro")}
          </p>
        </div>
        <div className='text-right'>
          <p className='flex items-center justify-end gap-2 text-2xl font-bold tabular-nums text-amber-400'>
            <FameCoin size={22} />
            {bank.toLocaleString()}
          </p>
          <p className='mt-1 text-xs text-zinc-500'>{t("studio.treasury")}</p>
          <p className='mt-1 text-xs text-zinc-500'>
            {t("studio.treasury_hint")}
          </p>
        </div>
      </div>

      {hasNextRoom && (
        <div className='flex flex-wrap items-center justify-end gap-x-4 gap-y-2'>
          {reason && <span className='text-sm text-zinc-400'>{reason}</span>}
          <Button
            variant='secondary'
            disabled={!check.ok || busy}
            onClick={onUpgrade}>
            {t("studio.move_to", { room: text.roomName(studio.roomLevel + 1) })}{" "}
            · <Cost amount={costOf(check)} />
          </Button>
        </div>
      )}
    </section>
  );
};

/** The current sprite on a dark plate, or the piece's icon until it exists. */
const ItemArt = ({
  item,
  level,
  alt,
}: {
  item: StudioItem;
  level: number;
  alt: string;
}) => {
  const src = level > 0 ? studioArtSrc(item.id, level) : null;
  return (
    <div className='flex aspect-[4/3] w-full items-center justify-center rounded-lg bg-zinc-950/50 p-6'>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className='max-h-full max-w-full object-contain'
        />
      ) : (
        <item.icon
          size={56}
          aria-hidden
          className={level === 0 ? "text-zinc-700" : "text-zinc-400"}
        />
      )}
    </div>
  );
};

/**
 * The board's notes as a list: every category, the unlocked ones with the
 * week's podium, the rest with the level that pins them up.
 */
const WeekRanking = ({
  level,
  week,
}: {
  level: number;
  week: readonly WeeklyMemberStats<GuildMember>[];
}) => {
  const text = useStudioText();
  const { t } = text;
  return (
    <div className='space-y-4'>
      <div className='space-y-0.5'>
        <p className='text-sm text-zinc-300'>{t("studio.week_so_far")}</p>
        <p className='text-xs text-zinc-500'>{t("studio.week_note")}</p>
      </div>
      {STUDIO_BOARD_AWARDS.map((award, i) => {
        const title = text.awardTitle(award.stat);
        if (i >= level)
          return (
            <p key={award.stat} className='text-sm text-zinc-500'>
              {t("studio.unlocks_at", { title, level: i + 1 })}
            </p>
          );
        const podium = podiumFor(week, award.stat);
        return (
          <div key={award.stat} className='space-y-1.5'>
            <p className='text-sm font-semibold text-zinc-200'>{title}</p>
            {podium.length ? (
              <ol className='space-y-1'>
                {podium.map((entry, place) => (
                  <li
                    key={entry.member.uid}
                    className='flex items-center gap-3 text-sm'>
                    <span className='w-4 tabular-nums text-zinc-500'>
                      {place + 1}
                    </span>
                    <span className='min-w-0 flex-1 truncate text-zinc-200'>
                      {entry.member.displayName}
                    </span>
                    <span className='tabular-nums text-zinc-400'>
                      {text.awardValue(award.stat, entry.value)}
                    </span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className='text-sm text-zinc-500'>{t("studio.nobody_yet")}</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

const ItemDetail = ({
  item,
  studio,
  bank,
  busy,
  onUpgrade,
  week,
}: {
  item: StudioItem;
  studio: GuildStudio;
  bank: number;
  busy: boolean;
  onUpgrade: () => void;
  week: readonly WeeklyMemberStats<GuildMember>[];
}) => {
  const text = useStudioText();
  const { t } = text;
  const level = itemLevel(studio, item.id);
  const check = checkItemUpgrade(studio, item.id, bank);
  const reason = blockedReason(check, text);
  const hasNext = level < STUDIO_MAX_ITEM_LEVEL;
  const nextName = hasNext ? text.levelName(item.id, level + 1) : "";

  return (
    <div className='space-y-5'>
      <ItemArt
        item={item}
        level={level}
        alt={
          level > 0 ? text.levelName(item.id, level) : text.itemName(item.id)
        }
      />

      <div className='space-y-1'>
        <DialogDescription className='text-sm text-zinc-400'>
          {text.itemName(item.id)}
        </DialogDescription>
        <DialogTitle className='text-xl font-bold text-zinc-100'>
          {level > 0 ? text.levelName(item.id, level) : t("studio.not_built")}
        </DialogTitle>
      </div>

      <ol className='space-y-2'>
        {item.levels.map((_, i) => {
          const built = i < level;
          return (
            <li
              key={i}
              className={cn(
                "flex items-center gap-2 text-sm",
                built ? "text-zinc-200" : "text-zinc-500",
              )}>
              <span className='flex w-4 justify-center'>
                {built ? (
                  <Check size={14} className='text-emerald-400' aria-hidden />
                ) : (
                  <span className='tabular-nums'>{i + 1}</span>
                )}
              </span>
              <span className='truncate'>{text.levelName(item.id, i + 1)}</span>
            </li>
          );
        })}
      </ol>

      {hasNext && (
        <div className='space-y-2'>
          <Button
            className='w-full'
            disabled={!check.ok || busy}
            onClick={onUpgrade}>
            {level === 0
              ? t("studio.build", { name: nextName })
              : t("studio.upgrade_to", { name: nextName })}{" "}
            · <Cost amount={costOf(check)} />
          </Button>
          {reason && <p className='text-sm text-zinc-400'>{reason}</p>}
        </div>
      )}

      {item.id === STUDIO_BOARD_ID && <WeekRanking level={level} week={week} />}
    </div>
  );
};

/** Every piece by name under the scene: the overview, and the way in on a phone. */
const GearList = ({
  studio,
  selectedId,
  onSelect,
}: {
  studio: GuildStudio;
  selectedId: string;
  onSelect: (id: string) => void;
}) => {
  const text = useStudioText();
  const cap = itemCap(studio.roomLevel);
  return (
    <div className='grid grid-cols-2 gap-2 sm:grid-cols-5'>
      {STUDIO_ITEMS.map((item) => {
        const level = itemLevel(studio, item.id);
        const selected = item.id === selectedId;
        return (
          <button
            key={item.id}
            type='button'
            onClick={() => onSelect(item.id)}
            aria-pressed={selected}
            className={cn(
              "flex flex-col gap-2 rounded-lg px-3 py-2.5 text-left transition-colors duration-fast focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              selected ? "bg-zinc-800/70" : "hover:bg-zinc-800/40",
            )}>
            <span className='flex min-w-0 items-center gap-2'>
              <item.icon
                size={15}
                aria-hidden
                className='shrink-0 text-zinc-400'
              />
              <span
                className={cn(
                  "truncate text-sm font-medium",
                  level > 0 ? "text-zinc-100" : "text-zinc-400",
                )}>
                {text.itemName(item.id)}
              </span>
            </span>
            <LevelPips
              level={level}
              cap={cap}
              label={text.t("studio.level_of", {
                level,
                max: STUDIO_MAX_ITEM_LEVEL,
              })}
            />
          </button>
        );
      })}
    </div>
  );
};

export interface GuildStudioTabProps {
  studio: GuildStudio;
  /** The guild's Fame, which the studio is bought with. */
  bank: number;
  busy?: boolean;
  onUpgradeItem: (id: string) => void;
  onUpgradeRoom: () => void;
  /** Each member's week so far (Monday to now), for the weekly board. */
  week: readonly WeeklyMemberStats<GuildMember>[];
}

export const GuildStudioTab = ({
  studio,
  bank,
  busy = false,
  onUpgradeItem,
  onUpgradeRoom,
  week,
}: GuildStudioTabProps) => {
  const [selectedId, setSelectedId] = useState(STUDIO_ITEMS[0].id);
  const [open, setOpen] = useState(false);
  const selected =
    STUDIO_ITEMS.find((item) => item.id === selectedId) ?? STUDIO_ITEMS[0];

  const pick = (id: string) => {
    setSelectedId(id);
    setOpen(true);
  };

  return (
    <div className='mx-auto w-full max-w-5xl space-y-6'>
      <RoomHeader
        studio={studio}
        bank={bank}
        busy={busy}
        onUpgrade={onUpgradeRoom}
      />

      <div className='space-y-6'>
        <GuildStudioScene
          studio={studio}
          week={week}
          selectedId={open ? selected.id : ""}
          onSelect={pick}
        />

        <section className='rounded-lg bg-zinc-900/40 p-3 sm:p-5'>
          <GearList
            studio={studio}
            selectedId={open ? selected.id : ""}
            onSelect={pick}
          />
        </section>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        {/* Portalled out of the themed wrapper, so it carries the theme class. */}
        <DialogContent className='dark-theme max-h-[90vh] overflow-y-auto sm:max-w-md'>
          <ItemDetail
            item={selected}
            studio={studio}
            bank={bank}
            busy={busy}
            onUpgrade={() => onUpgradeItem(selected.id)}
            week={week}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
