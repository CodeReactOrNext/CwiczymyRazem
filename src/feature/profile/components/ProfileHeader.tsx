import { pageSubtitleClass, pageTitleClass } from "components/PageTitle/PageTitle";
import Avatar from "components/UI/Avatar";
import { achievementsMap } from "feature/achievements/data/achievementsData";
import { achievementsRarity } from "feature/achievements/data/achievementsRarity";
import { getRarityColor } from "feature/arsenal/components/RarityBadge";
import { getEquippedRarity } from "feature/arsenal/data/equippedGuitar";
import { guitarDefinitionByImageId } from "feature/arsenal/data/guitarDefinitions";
import { useEquippedGuitar } from "feature/arsenal/hooks/useUserArsenal";
import { getRankBadgeSrc, isGuitarImageId } from "feature/arsenal/utils/guitarImage";
import { GuildTagBadge } from "feature/guilds/components/GuildTagBadge";
import { getProfileBanner } from "feature/profile/data/profileBanners";
import { PROFILE_ACCENT_COLORS } from "feature/profile/data/profileSectionCatalog";
import { useProfileLabels } from "feature/profile/hooks/useProfileLabels";
import type { ProfileLayoutConfig } from "feature/profile/types/profileLayout.types";
import {
  formatDaysAgo,
  resolveAccent,
  resolveBanner,
  resolveEmblem,
  resolveTitle,
} from "feature/profile/utils/profileLayout";
import type { Song } from "feature/songs/types/songs.type";
import { getGatedSkillPower } from "feature/songs/utils/difficulty.utils";
import { useColorTheme } from "lib/colorTheme/colorTheme";
import { useIntlLocale } from "lib/i18n/dateLocale";
import { Clock, Flame } from "lucide-react";
import type { ReactNode } from "react";
import { FaSoundcloud, FaYoutube } from "react-icons/fa";
import type { ProfileInterface } from "types/ProfileInterface";
import { convertMsToHM, getYearsOfPlaying } from "utils/converter";

import { HeroLevelStat } from "./HeroLevelStat";
import { SongTierBadge } from "./SongTierBadge";

interface ProfileHeaderProps {
  userData: ProfileInterface;
  userAuth: string;
  layout: ProfileLayoutConfig;
  streak: number;
  learnedSongs: Song[] | undefined;
  isSongsLoading: boolean;
  isSongsError: boolean;
}

const Fact = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className='flex min-w-0 items-center gap-1.5'>
    <dt className='shrink-0 text-zinc-500'>{label}</dt>
    <dd className='flex min-w-0 items-center gap-1.5 font-semibold text-zinc-200'>
      {children}
    </dd>
  </div>
);

const Stat = ({ children }: { children: ReactNode }) => (
  <div className='flex min-h-[76px] min-w-0 items-center gap-3.5 rounded-lg bg-zinc-800/40 px-4 py-3.5'>
    {children}
  </div>
);

const StatValue = ({ value, label }: { value: ReactNode; label: string }) => (
  <div className='min-w-0'>
    <p className='text-xl font-bold leading-tight tabular-nums text-zinc-50'>
      {value}
    </p>
    <p className='mt-0.5 truncate text-xs font-medium text-zinc-400'>{label}</p>
  </div>
);

/**
 * Who the player is, at a glance — built like Home's hero: a scene on top
 * (the banner they picked, their guitar, their emblem), the avatar standing on
 * its edge, and under the name a strip of the few numbers that matter.
 *
 * The quiet facts (joined, guild, band…) are one labelled line: a bare
 * "Sublunar / Free Return Trajectory" next to the points read like a rank the
 * app invented, when it is the band the player typed in.
 */
export const ProfileHeader = ({
  userData,
  userAuth,
  layout,
  streak,
  learnedSongs,
  isSongsLoading,
  isSongsError,
}: ProfileHeaderProps) => {
  const {
    statistics,
    displayName,
    avatar,
    guildBadge,
    createdAt,
    band,
    soundCloudLink,
    youTubeLink,
    guitarStartDate,
    selectedGuitar,
  } = userData;
  const labels = useProfileLabels();
  const isLight = useColorTheme() === "light";
  const { t } = labels;
  const intlLocale = useIntlLocale();
  const facts = new Set(layout.facts);
  const badges = new Set(layout.badges);
  const earned = statistics.achievements ?? [];
  const accent = PROFILE_ACCENT_COLORS[resolveAccent(layout, earned)];
  const titleId = resolveTitle(layout, earned);
  const titleData = titleId ? achievementsMap.get(titleId) : undefined;
  const bannerLayers = getProfileBanner(resolveBanner(layout, earned)).layers;
  const emblemId = resolveEmblem(layout, earned);
  const emblemData = emblemId ? achievementsMap.get(emblemId) : undefined;

  const yearsOfPlaying = guitarStartDate
    ? getYearsOfPlaying(guitarStartDate.toDate())
    : null;
  const lastPractice = formatDaysAgo(new Date(statistics.lastReportDate), undefined, t);

  const { item: equippedGuitar } = useEquippedGuitar(userAuth);
  const imgPath = selectedGuitar;
  const isSpecialGuitar = isGuitarImageId(imgPath);
  const specialGuitarDef = isSpecialGuitar
    ? guitarDefinitionByImageId(imgPath)
    : null;
  // The scene is lit by what the guitar is now, not by what it was at mint —
  // the workshop can promote it, and the promotion only exists on the item.
  const equippedRarity = getEquippedRarity(equippedGuitar, specialGuitarDef);
  const glowColor = equippedRarity
    ? getRarityColor(equippedRarity)
    : accent.base;

  const showLinks = facts.has("links") && (youTubeLink || soundCloudLink);
  const factItems: ReactNode[] = [];
  if (facts.has("joined")) {
    factItems.push(
      <Fact key='joined' label={labels.fact("joined")}>
        {createdAt.toDate().toLocaleDateString(intlLocale, {
          month: "short",
          year: "numeric",
        })}
      </Fact>,
    );
  }
  if (facts.has("last-practice")) {
    factItems.push(
      <Fact key='last' label={labels.fact("last-practice")}>
        {lastPractice ?? t("header.not_yet")}
      </Fact>,
    );
  }
  if (
    facts.has("playing-for") &&
    yearsOfPlaying != null &&
    yearsOfPlaying > 0
  ) {
    factItems.push(
      <Fact key='playing' label={t("header.playing_guitar")}>
        {t(yearsOfPlaying === 1 ? "header.years_one" : "header.years", { count: yearsOfPlaying })}
      </Fact>,
    );
  }
  if (facts.has("guild") && guildBadge?.tag) {
    factItems.push(
      <Fact key='guild' label={labels.fact("guild")}>
        <GuildTagBadge badge={guildBadge} size='md' />
      </Fact>,
    );
  }
  if (facts.has("band") && band?.trim()) {
    factItems.push(
      <Fact key='band' label={labels.fact("band")}>
        <span translate='no' className='truncate'>
          {band}
        </span>
      </Fact>,
    );
  }

  const { time } = statistics;
  const totalTime = convertMsToHM(
    time.technique + time.theory + time.creativity + time.hearing,
  );
  // An unrated player gets no tier tile at all: "5 more songs" on a profile is
  // the app talking about what is missing, not about the player.
  const showTier =
    badges.has("song-tier") &&
    (isSongsLoading || getGatedSkillPower(learnedSongs ?? []) > 0);

  const stats: ReactNode[] = [];
  if (facts.has("streak") && streak > 0) {
    stats.push(
      <Stat key='streak'>
        <Flame aria-hidden className='h-7 w-7 shrink-0 text-orange-500' />
        <StatValue
          value={t(streak === 1 ? "header.days_one" : "header.days", { count: streak })}
          label={labels.fact("streak")}
        />
      </Stat>,
    );
  }
  if (badges.has("level")) {
    stats.push(
      <Stat key='level'>
        <HeroLevelStat
          lvl={statistics.lvl}
          points={statistics.points}
          variant='bar'
          barColor={layout.accent === "cyan" ? undefined : accent.base}
        />
      </Stat>,
    );
  }
  stats.push(
    <Stat key='time'>
      <Clock aria-hidden className='h-6 w-6 shrink-0 text-zinc-400' />
      <StatValue value={totalTime} label={t("stats.spent_time")} />
    </Stat>,
  );
  if (showTier) {
    stats.push(
      <Stat key='tier'>
        <SongTierBadge
          inline
          learnedSongs={learnedSongs}
          isLoading={isSongsLoading}
          isError={isSongsError}
        />
      </Stat>,
    );
  }

  return (
    <header>
      {/* The scene. Nothing is written over it: in the light theme the scenes
          stay dark, and a name lying on one would not read. */}
      <div className='relative h-28 overflow-hidden rounded-t-[inherit] md:h-44'>
        <div className='absolute inset-0 bg-background' />
        {bannerLayers ? (
          <div
            aria-hidden
            className='absolute inset-0'
            style={{ background: bannerLayers }}
          />
        ) : (
          <div
            aria-hidden
            className='light-hide absolute inset-0 bg-[radial-gradient(ellipse_55%_100%_at_85%_100%,rgba(234,88,12,0.3),transparent_70%)]'
          />
        )}
        {emblemData && (
          // The emblem is a stamp in the scene, not a badge: large, tilted,
          // barely there — it is noticed on the second look.
          <emblemData.Icon
            aria-hidden
            className={`pointer-events-none absolute left-[38%] top-1/2 h-28 w-28 -translate-y-1/2 -rotate-12 opacity-[0.12] md:h-44 md:w-44${achievementsRarity[emblemData.rarity].tailwindClass}`}
          />
        )}
        {isSpecialGuitar && (
          // The art is already landscape (the guitar lies on its side), so it
          // only needs a height that fits the band and a slight tilt.
          <img
            src={getRankBadgeSrc(imgPath, "large")}
            className='pointer-events-none absolute right-[-4%] top-1/2 h-[120px] w-auto max-w-none -translate-y-1/2 -rotate-6 select-none sm:right-[6%] md:h-[200px]'
            style={{
              filter: isLight
                ? "drop-shadow(0 6px 12px rgba(0,0,0,0.18))"
                : `drop-shadow(0 12px 28px rgba(0,0,0,0.8)) drop-shadow(0 0 20px ${glowColor}30)`,
            }}
            alt=''
            aria-hidden
            draggable={false}
          />
        )}
      </div>

      <div className='relative -mt-12 px-5 pb-2 md:-mt-14 md:px-8 lg:px-10'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6'>
          <Avatar
            name={displayName}
            avatarURL={avatar}
            size='2xl'
            className='shrink-0'
          />

          {/* Padded past the overlap, so the text starts under the scene. */}
          <div className='min-w-0 flex-1 sm:pt-16'>
            {titleId && titleData ? (
              // A worn title sits right above the name the way a nameplate in
              // a game reads — name, the Wizard.
              <p
                className='mb-1 flex items-center gap-2 text-sm font-semibold'
                title={t("header.title_from", { rarity: labels.rarity(titleData.rarity) })}>
                <titleData.Icon
                  size={14}
                  className={achievementsRarity[titleData.rarity].tailwindClass}
                  aria-hidden
                />
                <span
                  className={achievementsRarity[titleData.rarity].tailwindClass}>
                  {labels.achievementTitle(titleId)}
                </span>
              </p>
            ) : null}
            <h1 translate='no' className={pageTitleClass}>
              {displayName}
            </h1>
            {layout.tagline && (
              <p className={pageSubtitleClass}>{layout.tagline}</p>
            )}

            {factItems.length > 0 && (
              <dl className='mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm'>
                {factItems}
              </dl>
            )}

            {showLinks && (
              <div className='mt-4 flex flex-wrap gap-2'>
                {youTubeLink && (
                  <a
                    target='_blank'
                    rel='noreferrer'
                    href={youTubeLink}
                    className='flex items-center gap-1.5 rounded-lg bg-red-500/15 px-2.5 py-1.5 text-xs font-semibold text-zinc-100 transition-colors hover:bg-red-500/30'>
                    <FaYoutube className='h-3.5 w-3.5 text-red-400' /> YouTube
                  </a>
                )}
                {soundCloudLink && (
                  <a
                    target='_blank'
                    rel='noreferrer'
                    href={soundCloudLink}
                    className='flex items-center gap-1.5 rounded-lg bg-orange-500/15 px-2.5 py-1.5 text-xs font-semibold text-zinc-100 transition-colors hover:bg-orange-500/30'>
                    <FaSoundcloud className='h-3.5 w-3.5 text-orange-400' />{" "}
                    SoundCloud
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <div className='mt-7 grid select-none grid-cols-2 gap-2 md:gap-3 lg:grid-cols-4'>
          {stats}
        </div>
      </div>
    </header>
  );
};
