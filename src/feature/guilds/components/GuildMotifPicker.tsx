import { cn } from "assets/lib/utils";
import { GuildBanner } from "feature/guilds/components/GuildBanner";
import { MOTIF_ICON_COMPONENTS } from "feature/guilds/components/motifIcons";
import type { MotifIconKey } from "feature/guilds/data/guildCosmetics";
import {
  MOTIF_GROUPS,
  MOTIF_ICONS,
  MOTIF_SIZE,
  motifIconLevel,
  motifId,
} from "feature/guilds/data/guildCosmetics";
import { Lock } from "lucide-react";
import { useState } from "react";

interface GuildMotifPickerProps {
  /** What the guild wears now — the picker starts from it. */
  worn: readonly MotifIconKey[];
  /** So the banner under the icons is the guild's own. */
  bannerId: string;
  hex: string;
  /** Quests cleared — an icon above this level cannot be picked yet. */
  guildLevel: number;
  busy: boolean;
  onWear: (id: string) => void;
}

/**
 * Choosing the four icons tiled across the banner.
 *
 * Four slots at the top, a grid of everything that can go in them below, and
 * the banner itself redrawn with every change so the founder is choosing on
 * the thing it will be worn on. Picking fills the lit slot and moves the light
 * to the next one, so four clicks in a row is a whole new set; clicking a slot
 * moves the light there for changing one icon alone. The same icon may sit in
 * more than one slot — four hearts is a look, and one the app's own hero
 * banner already wears.
 *
 * The draft lives here and nowhere else. Mount it under a key made from the
 * worn set (see the kit tab), so a change that comes back from the server
 * remounts the picker on the new set instead of leaving a stale draft behind.
 *
 * An icon above the guild's level is shown rather than hidden — a locked tile
 * says there is more to unlock, where leaving it off the grid would say
 * nothing at all — but it cannot be picked: the tile is disabled and a lock
 * sits where the icon would, with the level it opens at in the title.
 */
export const GuildMotifPicker = ({
  worn,
  bannerId,
  hex,
  guildLevel,
  busy,
  onWear,
}: GuildMotifPickerProps) => {
  const [draft, setDraft] = useState<MotifIconKey[]>([...worn]);
  const [lit, setLit] = useState(0);

  const dirty = draft.some((key, index) => key !== worn[index]);

  const pick = (key: MotifIconKey) => {
    if (motifIconLevel(key) > guildLevel) return;
    setDraft((current) =>
      current.map((slot, index) => (index === lit ? key : slot)),
    );
    setLit((current) => (current + 1) % MOTIF_SIZE);
  };

  return (
    <div className='space-y-5 rounded-lg bg-zinc-900/40 p-4 sm:p-5'>
      <div className='overflow-hidden rounded-lg'>
        <GuildBanner
          bannerId={bannerId}
          hex={hex}
          icons={draft}
          className='h-20 sm:h-24'
        />
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        {draft.map((key, index) => {
          const Icon = MOTIF_ICON_COMPONENTS[key];
          const isLit = index === lit;
          return (
            <button
              key={index}
              type='button'
              aria-label={`Slot ${index + 1}: ${key}${isLit ? " — picking for this one" : ""}`}
              aria-pressed={isLit}
              onClick={() => setLit(index)}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                isLit
                  ? "bg-white/15 text-zinc-100"
                  : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200",
              )}
              style={isLit ? { color: hex } : undefined}>
              <Icon size={22} />
            </button>
          );
        })}

        <p className='ml-1 text-xs text-zinc-500'>
          Pick for slot {lit + 1} — or click a slot to change just that one.
        </p>
      </div>

      {/* One row of tiles per group, so ninety-odd icons can be scanned by
          kind rather than read one at a time. Instruments are free from the
          start; every other group unlocks icon by icon as the guild levels
          up, so most of these rows fill in gradually rather than all at once. */}
      <div className='space-y-4'>
        {MOTIF_GROUPS.map((group) => {
          const iconsHere = MOTIF_ICONS.filter(
            (icon) => icon.group === group.id,
          );
          const unlockedHere = iconsHere.filter(
            (icon) => motifIconLevel(icon.key) <= guildLevel,
          ).length;

          return (
            <div key={group.id} className='space-y-2'>
              <p className='flex items-baseline justify-between gap-3 text-xs font-semibold text-zinc-500'>
                <span>{group.label}</span>
                {unlockedHere < iconsHere.length && (
                  <span className='font-normal tabular-nums text-zinc-600'>
                    {unlockedHere} of {iconsHere.length} unlocked
                  </span>
                )}
              </p>
              <div className='grid grid-cols-6 gap-2 sm:grid-cols-8 lg:grid-cols-12'>
                {iconsHere.map(({ key, label }) => {
                  const Icon = MOTIF_ICON_COMPONENTS[key];
                  const inUse = draft.includes(key);
                  const requires = motifIconLevel(key);
                  const locked = requires > guildLevel;

                  return (
                    <button
                      key={key}
                      type='button'
                      title={
                        locked ? `Unlocks at guild level ${requires}` : label
                      }
                      aria-label={
                        locked
                          ? `${label} — unlocks at guild level ${requires}`
                          : label
                      }
                      disabled={locked}
                      onClick={() => pick(key)}
                      className={cn(
                        "flex h-11 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed",
                        locked
                          ? "bg-transparent text-zinc-700"
                          : inUse
                            ? "bg-white/10 text-zinc-100"
                            : "bg-transparent text-zinc-500 hover:bg-white/5 hover:text-zinc-200",
                      )}>
                      {locked ? <Lock size={15} /> : <Icon size={20} />}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className='flex flex-wrap items-center gap-3'>
        {dirty ? (
          <>
            <button
              type='button'
              disabled={busy}
              onClick={() => onWear(motifId(draft))}
              className='flex h-9 items-center justify-center rounded-lg bg-white/5 px-4 text-xs font-bold text-zinc-100 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-white/10'>
              Wear these four
            </button>
            <button
              type='button'
              disabled={busy}
              onClick={() => setDraft([...worn])}
              className='h-9 rounded-lg px-3 text-xs font-semibold text-zinc-500 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:text-zinc-200'>
              Back to what is worn
            </button>
          </>
        ) : (
          <p
            className='flex h-9 items-center text-xs font-bold'
            style={{ color: hex }}>
            Worn now
          </p>
        )}
      </div>
    </div>
  );
};
