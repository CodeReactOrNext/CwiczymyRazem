import { getSongTier } from 'feature/songs/utils/getSongTier';
import Link from 'next/link';

interface RankedSong {
  rank: string;
  title: string;
  artist: string;
  difficulty: number;
  ratings: string;
  need: string;
  songId: string;
  cover: string;
  guideSlug?: string;
}

interface SongRankingProps {
  /**
   * Pipe-delimited songs, each `rank::title::artist::difficulty::ratings::need::songId::coverUrl[::guideSlug]`.
   * MDX content compiles with no scope, so every prop has to survive as a plain
   * string (see AppCard / StatRow for the same constraint).
   */
  songs: string;
  caption?: string;
}

const parseSongs = (value: string): RankedSong[] =>
  value
    .split('|')
    .map((item) => item.split('::').map((part) => part.trim()))
    .filter((parts) => parts.length >= 8)
    .map(([rank, title, artist, difficulty, ratings, need, songId, cover, guideSlug]) => ({
      rank,
      title,
      artist,
      difficulty: Number(difficulty),
      ratings,
      need,
      songId,
      cover,
      guideSlug: guideSlug || undefined,
    }));

/**
 * Ranked song list for blog posts: cover, rank, community difficulty score with
 * a tier-coloured bar, and deep links into the app song page and (when one
 * exists) the song guide.
 */
export const SongRanking = ({ songs, caption }: SongRankingProps) => {
  const items = parseSongs(songs);

  return (
    <div className="not-prose my-10 overflow-hidden rounded-xl bg-zinc-900/40">
      <div className="flex items-baseline justify-between gap-4 px-5 pt-5 sm:px-6">
        <p className="text-xs font-medium text-zinc-500">Community difficulty score, lowest first</p>
        <p className="hidden text-xs font-medium text-zinc-500 sm:block">0 – 10 scale</p>
      </div>

      <ol className="mt-2 pb-2">
        {items.map((song) => {
          const tier = getSongTier(song.difficulty);
          const appHref = `/songs?view=explore&songId=${song.songId}`;
          const primaryHref = song.guideSlug ? `/song-library/${song.guideSlug}` : appHref;

          return (
            <li
              key={song.songId}
              className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-zinc-800/40 sm:gap-5 sm:px-6"
            >
              <span className="w-6 shrink-0 text-right text-sm font-bold tabular-nums text-zinc-500">
                {song.rank}
              </span>

              <Link
                href={primaryHref}
                className="block h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-zinc-800"
                aria-label={`${song.title} by ${song.artist}`}
              >
                <img
                  src={song.cover}
                  alt={`${song.title} album cover`}
                  width={56}
                  height={56}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  href={primaryHref}
                  className="block truncate text-base font-bold text-white transition-colors hover:text-cyan-300"
                >
                  {song.title}
                </Link>
                <p className="truncate text-sm text-zinc-400">{song.artist}</p>
                <p className="mt-1 truncate text-xs text-zinc-500">{song.need}</p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-1 w-24 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, Math.max(0, song.difficulty * 10))}%`,
                        backgroundColor: tier.color,
                      }}
                    />
                  </div>
                  <Link
                    href={appHref}
                    className="text-xs font-medium text-cyan-400 transition-colors hover:text-cyan-300"
                  >
                    Open in app
                  </Link>
                  {song.guideSlug && (
                    <Link
                      href={`/song-library/${song.guideSlug}`}
                      className="text-xs font-medium text-cyan-400 transition-colors hover:text-cyan-300"
                    >
                      Song guide
                    </Link>
                  )}
                </div>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-2xl font-black leading-none tabular-nums" style={{ color: tier.color }}>
                  {song.difficulty.toFixed(1)}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  {song.ratings} {song.ratings === '1' ? 'rating' : 'ratings'}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {caption && <p className="px-5 pb-5 pt-2 text-xs text-zinc-500 sm:px-6">{caption}</p>}
    </div>
  );
};
