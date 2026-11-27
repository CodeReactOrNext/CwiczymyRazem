import { Card } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import { SectionHeader } from "components/SectionHeader/SectionHeader";
import { TierBadge } from "feature/songs/components/SongsGrid/TierBadge";
import type { Song } from "feature/songs/types/songs.type";
import { formatPlayTime } from "feature/songs/utils/arrangements.utils";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { useTranslation } from "hooks/useTranslation";
import { inkAccent } from "lib/colorTheme/colorTheme";
import { Clock } from "lucide-react";

import { ShinyCover } from "./ShinyCover";
import { ProfileSongRow } from "./SongSkillShowcase";

interface SongCaseProps {
  songs: Song[];
  isPinned: boolean;
  isOwner: boolean;
  /** Milliseconds per song id — see useSongPracticeTimes. */
  practiceTimes?: Record<string, number>;
  /** The case has the whole row to itself, so the other songs go two abreast. */
  wide?: boolean;
}

const tierOf = (song: Song) =>
  getSongTier(!song.avgDifficulty ? "?" : song.tier || song.avgDifficulty);

/**
 * The trophy case's twin for songs: the learned songs a player wants to be
 * known for. The first one (the hardest, or the first pin) is the exhibit —
 * its cover printed like a foil card — and the rest are the same rows the
 * repertoire uses.
 */
export const SongCase = ({
  songs,
  isPinned,
  isOwner,
  practiceTimes,
  wide = false,
}: SongCaseProps) => {
  const { t } = useTranslation("profile");
  if (songs.length === 0) return null;
  const [lead, ...rest] = songs;
  const leadTier = tierOf(lead);
  const leadMs = practiceTimes?.[lead.id] ?? 0;

  return (
    <Card className='h-full p-5 sm:p-6'>
      <SectionHeader
        title={t("layout.sections.signature-songs.title")}
        description={isOwner && !isPinned && t("cases.pin_hint")}
        className='mb-0 flex-wrap'
      />

      <div className='mt-5 flex items-center gap-5 rounded-lg bg-zinc-800/40 p-5'>
        <ShinyCover
          src={lead.coverUrl}
          alt={lead.title}
          tier={leadTier.tier}
          className='h-24 w-24 shrink-0 rounded-xl'
        />
        <div className='min-w-0'>
          <p
            translate='no'
            className='line-clamp-2 text-base font-bold text-zinc-50'>
            {lead.title}
          </p>
          <p translate='no' className='mt-1 truncate text-sm text-zinc-400'>
            {lead.artist}
          </p>
          <div className='mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs'>
            <span className='flex items-center gap-1.5'>
              <TierBadge song={lead} className='h-6 w-6' />
              <span
                className='font-semibold'
                style={{ color: inkAccent(leadTier.color) }}>
                {leadTier.label}
              </span>
            </span>
            {leadMs > 0 && (
              <span
                title={t("cases.time_spent")}
                className='flex items-center gap-1.5 tabular-nums text-zinc-300'>
                <Clock aria-hidden size={12} className='text-zinc-500' />
                {formatPlayTime(leadMs)}
              </span>
            )}
          </div>
        </div>
      </div>

      {rest.length > 0 && (
        <div
          className={cn(
            "mt-3 grid grid-cols-1 gap-x-4 gap-y-1 px-2.5",
            wide && "sm:grid-cols-2",
          )}>
          {rest.map((song) => (
            <ProfileSongRow
              key={song.id}
              song={song}
              practiceMs={practiceTimes?.[song.id]}
            />
          ))}
        </div>
      )}
    </Card>
  );
};
