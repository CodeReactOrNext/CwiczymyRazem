import "lib/i18n/fullCatalog";

import { Button } from "assets/components/ui/button";
import { GuildStudioTab } from "feature/guilds/components/GuildStudioTab";
import {
  STUDIO_ITEMS,
  STUDIO_MAX_ITEM_LEVEL,
  STUDIO_MAX_ROOM_LEVEL,
} from "feature/guilds/data/guildStudio";
import type { GuildMember } from "feature/guilds/types/guild.types";
import type {
  GuildStudio,
  WeeklyMemberStats,
} from "feature/guilds/utils/guildStudio.utils";
import {
  EMPTY_STUDIO,
  upgradeItem,
  upgradeRoom,
} from "feature/guilds/utils/guildStudio.utils";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useState } from "react";

/**
 * Dev-only harness for the guild studio prototype: local state, no Firebase,
 * a fake guild bank with buttons to top it up, and a made-up week for the
 * weekly board. Not linked from any nav; renders nothing outside
 * development.
 *
 *   ?state=fresh   a new guild: garage, nothing built (default)
 *   ?state=mid     a few weeks in, a level-2 board
 *   ?state=full    everything maxed
 */

/** Eleven members' week so far: hours, sessions, streak days, points. */
const WEEK: WeeklyMemberStats<GuildMember>[] = (
  [
    ["Kasia Nowak", 6.5, 5, 9, 1840],
    ["Tom Riff", 4.2, 7, 4, 1520],
    ["You", 3.8, 4, 12, 2210],
    ["Ola", 3, 4, 2, 760],
    ["Marek Bass", 2.4, 3, 3, 540],
    ["Julia K", 1.9, 2, 6, 610],
    ["Piotr", 1.1, 1, 1, 150],
    ["Ana Silva", 0.8, 2, 2, 300],
    ["Ben", 0.5, 1, 1, 90],
    ["Zofia", 0, 0, 0, 0],
    ["Leo Drums", 0, 0, 0, 0],
  ] as const
).map(([displayName, hours, sessions, streak, points], i) => ({
  member: { uid: `dev-member-${i}`, displayName, avatar: null },
  hours,
  sessions,
  streak,
  points,
}));

const FIXTURES: Record<string, { studio: GuildStudio; bank: number }> = {
  fresh: { studio: EMPTY_STUDIO, bank: 600 },
  mid: {
    studio: {
      roomLevel: 2,
      items: {
        board: 2,
        amp: 2,
        drums: 2,
        sofa: 2,
        desk: 2,
        mic: 1,
        walls: 2,
        panels: 1,
      },
    },
    bank: 2400,
  },
  full: {
    studio: {
      roomLevel: STUDIO_MAX_ROOM_LEVEL,
      items: Object.fromEntries(
        STUDIO_ITEMS.map((item) => [item.id, STUDIO_MAX_ITEM_LEVEL]),
      ),
    },
    bank: 0,
  },
};

const GuildStudioPreview = () => {
  const router = useRouter();
  const fixture =
    FIXTURES[String(router.query.state ?? "fresh")] ?? FIXTURES.fresh;
  const [studio, setStudio] = useState(fixture.studio);
  const [savedBank, setBank] = useState(fixture.bank);
  // On by default: the preview is for trying the room out, not for saving up.
  const [unlimited, setUnlimited] = useState(true);
  const bank = unlimited ? Infinity : savedBank;

  const apply = (result: { studio: GuildStudio; bank: number } | null) => {
    if (!result) return;
    setStudio(result.studio);
    if (!unlimited) setBank(result.bank);
  };

  return (
    <div className='min-h-screen bg-zinc-950 px-4 py-6 md:px-8'>
      <div className='space-y-6'>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <h1 className='font-display text-xl font-bold text-zinc-100'>
            Guild studio · prototype
          </h1>
          <div className='flex flex-wrap gap-2'>
            <Button
              variant='subtle'
              size='sm'
              aria-pressed={unlimited}
              className={unlimited ? "text-amber-300" : undefined}
              onClick={() => setUnlimited((current) => !current)}>
              Unlimited Fame: {unlimited ? "on" : "off"}
            </Button>
            {!unlimited &&
              [500, 5000].map((amount) => (
                <Button
                  key={amount}
                  variant='subtle'
                  size='sm'
                  onClick={() => setBank((current) => current + amount)}>
                  +{amount.toLocaleString()} Fame
                </Button>
              ))}
            <Button
              variant='subtle'
              size='sm'
              onClick={() => {
                setStudio(fixture.studio);
                setBank(fixture.bank);
              }}>
              Reset
            </Button>
          </div>
        </div>

        <GuildStudioTab
          studio={studio}
          bank={bank}
          week={WEEK}
          onUpgradeItem={(id) => apply(upgradeItem(studio, id, bank))}
          onUpgradeRoom={() => apply(upgradeRoom(studio, bank))}
        />
      </div>
    </div>
  );
};

const GuildStudioPreviewPage = () => {
  const router = useRouter();
  if (process.env.NODE_ENV === "production" || !router.isReady) return null;
  // Remount per fixture so ?state= switches start from that fixture.
  return <GuildStudioPreview key={String(router.query.state ?? "fresh")} />;
};

export default dynamic(() => Promise.resolve(GuildStudioPreviewPage), {
  ssr: false,
});
