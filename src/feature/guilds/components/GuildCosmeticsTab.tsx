import { cn } from "assets/lib/utils";
import { GuildBanner } from "feature/guilds/components/GuildBanner";
import { GuildCover } from "feature/guilds/components/GuildCover";
import { GuildCrest } from "feature/guilds/components/GuildCrest";
import { GuildMotifPicker } from "feature/guilds/components/GuildMotifPicker";
import { GuildTagBadge } from "feature/guilds/components/GuildTagBadge";
import type { GuildCosmeticItem } from "feature/guilds/data/guildCosmetics";
import { COSMETIC_SLOTS } from "feature/guilds/data/guildCosmetics";
import { useGuildMutations } from "feature/guilds/hooks/useGuilds";
import type { Guild } from "feature/guilds/types/guild.types";
import { tint } from "feature/guilds/utils/guildCosmetics.style";
import {
  accentHex,
  equippedItem,
  isUnlocked,
  motifIcons,
  sortByUnlock,
  unlockLevel,
} from "feature/guilds/utils/guildCosmetics.utils";
import { Check, Lock, Users } from "lucide-react";

/**
 * The guild's wardrobe.
 *
 * Nothing here costs anything: every item is on the page for every guild, and
 * the founder is the only one who may put one on. So this is a wardrobe rather
 * than a shop — one button per tile, and a tab only the founder is given (see
 * `GuildsView`), which is why nothing below asks who is looking.
 *
 * Everything is previewed in the guild's *current* colour rather than in the
 * abstract, because that is the question a member is actually asking — not
 * "what is Halo" but "what does Halo look like on us". A banner tile draws
 * itself with the accent and the icons the guild is wearing right now, and
 * swapping either redraws every banner tile on the page.
 *
 * Each slot is also previewed at the size and in the company it is actually
 * worn in: a banner across the top of a card shaped like a guild card, with the
 * crest hanging off it the way it really does; a frame beside a real member's
 * name. A repeating pattern shown in a 32px swatch — or stretched across a
 * full-width panel — is a pattern nobody can recognise afterwards on the thing
 * it was worn on.
 */

/**
 * The item, drawn where it lands. All three are the same height, so a row of
 * tiles lines up whichever slot it belongs to.
 */
const Preview = ({
  item,
  guild,
  hex,
}: {
  item: GuildCosmeticItem;
  guild: Guild;
  hex: string;
}) => {
  // The two places a colour actually shows: the crest's square and the tag.
  if (item.slot === "accent") {
    return (
      <div className='flex h-28 items-center justify-center gap-3 rounded-lg bg-zinc-950/40'>
        <span
          aria-hidden
          className='h-10 w-10 shrink-0 rounded-full'
          style={{ backgroundColor: item.hex }}
        />
        <GuildTagBadge
          badge={{
            guildId: guild.id,
            tag: guild.tag,
            accent: item.id,
            // Resolved rather than read raw, so a slot holding an id the
            // catalog does not know previews the default — what is on screen.
            frame: equippedItem(guild.cosmetics, "frame").id,
          }}
          size='md'
          linked={false}
        />
      </div>
    );
  }

  // A card the shape of the guild's own, so the pattern is seen at the pitch it
  // will be drawn at. The bars stand in for the name and the seat count.
  if (item.slot === "banner") {
    return (
      <div className='h-28 overflow-hidden rounded-lg bg-zinc-950/40'>
        <GuildBanner
          bannerId={item.id}
          hex={hex}
          icons={motifIcons(guild.cosmetics)}
          className='h-14'
        />
        <div className='px-3'>
          <div className='-mt-5 flex items-end gap-2.5'>
            <GuildCrest
              logo={guild.logo}
              tag={guild.tag}
              accentHex={hex}
              className='h-10 w-10 text-[9px]'
            />
            <span
              aria-hidden
              className='mb-1 h-2 w-20 rounded-full bg-white/20'
            />
          </div>
          <span
            aria-hidden
            className='mt-2 block h-1.5 w-28 rounded-full bg-white/10'
          />
        </div>
      </div>
    );
  }

  // A frame is only ever seen next to somebody's name, so it is shown next to
  // one — the founder's, because that is the name every guild has to hand.
  return (
    <div className='flex h-28 items-center justify-center gap-2 rounded-lg bg-zinc-950/40 px-3'>
      <span aria-hidden className='h-6 w-6 shrink-0 rounded-full bg-zinc-800' />
      <span className='truncate text-sm font-bold text-zinc-300'>
        {guild.founderName}
      </span>
      <GuildTagBadge
        badge={{
          guildId: guild.id,
          tag: guild.tag,
          accent: equippedItem(guild.cosmetics, "accent").id,
          frame: item.id,
        }}
        size='md'
        linked={false}
      />
    </div>
  );
};

const CosmeticTile = ({
  item,
  guild,
  hex,
  worn,
  locked,
  busy,
  onWear,
}: {
  item: GuildCosmeticItem;
  guild: Guild;
  hex: string;
  worn: boolean;
  /** The guild's level is below the item's — previewed, named, not wearable. */
  locked: boolean;
  busy: boolean;
  onWear: () => void;
}) => (
  <div
    className={cn(
      "flex h-full flex-col gap-4 rounded-lg p-4 transition-background",
      worn ? "bg-white/[0.07]" : "bg-zinc-900/40",
      locked && "opacity-70",
    )}
    style={worn ? { backgroundColor: tint(hex, 0.09) } : undefined}>
    <Preview item={item} guild={guild} hex={hex} />

    <div className='min-w-0'>
      <p className='flex items-center gap-1.5 text-sm font-bold text-zinc-100'>
        {item.name}
        {worn && <Check size={13} style={{ color: hex }} />}
        {locked && (
          <span className='rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-cyan-300'>
            lvl {unlockLevel(item)}
          </span>
        )}
      </p>
      <p className='mt-1 text-xs leading-relaxed text-zinc-500'>{item.blurb}</p>
    </div>

    {/* Held at the bottom, so the buttons across a row sit on one line however
        long the blurb above each of them ran. */}
    <div className='mt-auto'>
      {worn ? (
        <p
          className='flex h-9 items-center gap-1.5 text-xs font-bold'
          style={{ color: hex }}>
          Worn now
        </p>
      ) : locked ? (
        <p className='flex h-9 items-center gap-1.5 text-xs font-semibold text-zinc-400'>
          <Lock size={13} />
          Unlocks at guild level {unlockLevel(item)}
        </p>
      ) : (
        <button
          type='button'
          disabled={busy}
          onClick={onWear}
          className='flex h-9 w-full items-center justify-center rounded-lg bg-white/5 text-xs font-bold text-zinc-100 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-white/10'>
          Wear it
        </button>
      )}
    </div>
  </div>
);

export const GuildCosmeticsTab = ({ guild }: { guild: Guild }) => {
  const { equipCosmetic } = useGuildMutations();
  const busy = equipCosmetic.isPending;

  const { cosmetics } = guild;
  const hex = accentHex(cosmetics);
  const motif = equippedItem(cosmetics, "motif");

  return (
    <div className='space-y-10'>
      <section className='flex flex-col gap-4 lg:flex-row lg:items-stretch'>
        {/* The card as the rest of the board sees it, drawn by the same
            component the guild list draws it with — and at the width a card is
            really given, rather than stretched across the page. */}
        <article className='w-full shrink-0 overflow-hidden rounded-lg bg-zinc-900/40 lg:w-[28rem]'>
          <GuildCover
            guild={guild}
            className={guild.description ? undefined : "pb-5"}
            meta={
              <span className='inline-flex items-center gap-1.5 tabular-nums'>
                <Users size={13} />
                {guild.memberCount} of {guild.memberLimit} seats
              </span>
            }
          />

          {guild.description && (
            <p className='line-clamp-2 px-5 pb-5 pt-4 text-sm leading-relaxed text-zinc-400'>
              {guild.description}
            </p>
          )}
        </article>

        <div className='flex min-w-0 flex-1 items-center rounded-lg bg-zinc-900/40 p-5'>
          <p className='max-w-xl text-sm leading-relaxed text-zinc-400'>
            The card on the left is what the guild looks like everywhere else.
            Every colour, banner, icon and tag below costs nothing, and you pick
            between them because you founded this guild. The plainer ones are
            yours from the start; the rest unlock as the guild levels up, and
            each tile says at what level. Choose one and the whole roster is
            wearing it a moment later.
          </p>
        </div>
      </section>

      {COSMETIC_SLOTS.map(({ slot, label, blurb, items }) => (
        <section key={slot} className='space-y-4'>
          <div className='flex flex-wrap items-end justify-between gap-x-6 gap-y-1'>
            <div>
              <h3 className='flex items-baseline gap-2 text-sm font-bold text-zinc-200'>
                {label}
                {/* What is on right now, said here rather than found by hunting
                    the grid below for the one tile with a tick on it. */}
                <span className='text-xs font-medium' style={{ color: hex }}>
                  {equippedItem(cosmetics, slot).name}
                </span>
              </h3>
              <p className='mt-1 text-xs text-zinc-500'>{blurb}</p>
            </div>
            {items.length > 0 && (
              <p className='text-xs tabular-nums text-zinc-500'>
                {items.filter((item) => isUnlocked(item, guild.level)).length}{" "}
                of {items.length} unlocked at guild level {guild.level}
              </p>
            )}
          </div>

          {slot === "motif" ? (
            // Keyed on what is worn, so a set that comes back from the server
            // restarts the picker on it rather than leaving a stale draft.
            <GuildMotifPicker
              key={motif.id}
              worn={motifIcons(cosmetics)}
              bannerId={equippedItem(cosmetics, "banner").id}
              hex={hex}
              guildLevel={guild.level}
              busy={busy}
              onWear={(id) => equipCosmetic.mutate(id)}
            />
          ) : (
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
              {sortByUnlock(items, guild.level).map((item) => (
                <CosmeticTile
                  key={item.id}
                  item={item}
                  guild={guild}
                  hex={hex}
                  // Asked of the resolver rather than compared against the
                  // stored id, so a slot holding an id from no catalog shows
                  // the default as worn — which is what is actually on screen.
                  worn={equippedItem(cosmetics, slot).id === item.id}
                  locked={!isUnlocked(item, guild.level)}
                  busy={busy}
                  onWear={() => equipCosmetic.mutate(item.id)}
                />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
};
