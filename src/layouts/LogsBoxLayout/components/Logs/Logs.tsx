import { buttonVariants } from "assets/components/ui/button";
import {
  Chip,
  getChipCustomStyle,
} from "assets/components/ui/chip";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { OnlineUsers } from "components/OnlineUsers/OnlineUsers";
import Avatar from "components/UI/Avatar";
import { HeroPattern } from "components/UI/HeroBanner";
import { UserLink } from "components/UserLink";
import { UserTooltip } from "components/UserTooltip/UserTooltip";
import AchievementIcon from "feature/achievements/components/AchievementIcon";
import LessonPracticeModal from "feature/aiCoach/view/RoadmapView/components/LessonPracticeModal";
import { EffectCard } from "feature/arsenal/components/GuitarInventory/EffectCard";
import { GuitarCard } from "feature/arsenal/components/GuitarInventory/GuitarCard";
import { getRarityColor } from "feature/arsenal/components/RarityBadge";
import {
  EFFECT_DEFINITIONS,
  EFFECTS_BY_ID,
} from "feature/arsenal/data/effectDefinitions";
import { getEffectLevel } from "feature/arsenal/data/effectStats";
import {
  guitarDefinitionByImageId,
  GUITARS_BY_ID,
} from "feature/arsenal/data/guitarDefinitions";
import { getItemLevel } from "feature/arsenal/data/itemStats";
import type {
  EffectInventoryItem,
  InventoryItem,
} from "feature/arsenal/types/arsenal.types";
import { getEffectImageSrc } from "feature/arsenal/utils/effectImage";
import { getRankBadgeSrc } from "feature/arsenal/utils/guitarImage";
// challengesList removed
import { BOSS_PLAN_PREFIX } from "feature/bosses/data/bosses";
import { AVATAR_SHRINK } from "feature/chat/chatLayout";
import { welcomeGoalPhrase } from "feature/chat/utils/systemMessages";
import { communityDocId } from "feature/communityExercises/utils/communityToExercise";
import {
  bannerNeedsDarkCard,
  CosmeticBanner,
} from "feature/cosmetics/components/CosmeticBanner";
import cosmeticStyles from "feature/cosmetics/components/cosmetics.module.css";
import { findBanner } from "feature/cosmetics/data/cosmeticsCatalog";
import { useEquippedCosmetics } from "feature/cosmetics/hooks/useCosmetics";
import type { TopPlayerData } from "feature/discordBot/services/topPlayersService";
import { SearchingDots } from "feature/duels/components/DuelBits";
import { useNow } from "feature/duels/hooks/useDuels";
import { formatRatingDelta } from "feature/duels/utils/duelFormat";
import { EarTrainingLeaderboardDialog } from "feature/exercisePlan/components/EarTrainingLeaderboardDialog";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import type { Exercise } from "feature/exercisePlan/types/exercise.types";
import { hasLeaderboard } from "feature/exercisePlan/utils/hasLeaderboard";
import { GuildTagBadge } from "feature/guilds/components/GuildTagBadge";
import { findCosmetic } from "feature/guilds/data/guildCosmetics";
import { ComponentPreviewCard } from "feature/guitarBuilder/components/ComponentPreviewCard";
import { ComponentThumb } from "feature/guitarBuilder/components/ComponentThumb";
import { SLOT_LABELS } from "feature/guitarBuilder/data/components";
import type { OwnedComponent } from "feature/guitarBuilder/types/guitarBuilder.types";
import { getComponent } from "feature/guitarBuilder/utils/components";
import { DiscordPromoCard } from "feature/logs/components/DiscordPromoCard";
import { LogReaction } from "feature/logs/components/LogReaction";
import {
  markMotivateHintDone,
  useMotivateHint,
} from "feature/logs/hooks/useMotivateHint";
import { useUnreadMessages } from "feature/logs/hooks/useUnreadMessages";
import type {
  FirebaseLogsCaseOpenInterface,
  FirebaseLogsDailyQuestInterface,
  FirebaseLogsDiscordPromoInterface,
  FirebaseLogsDonationInterface,
  FirebaseLogsDuelPlayer,
  FirebaseLogsDuelResultInterface,
  FirebaseLogsDuelWaitingInterface,
  FirebaseLogsExamPassedInterface,
  FirebaseLogsGoalCompletedInterface,
  FirebaseLogsGoalCreatedInterface,
  FirebaseLogsGuildLevelInterface,
  FirebaseLogsInterface,
  FirebaseLogsMarketplaceInterface,
  FirebaseLogsMarketplacePurchaseInterface,
  FirebaseLogsPlayerJoinedInterface,
  FirebaseLogsPlaylistInterface,
  FirebaseLogsRecordingsInterface,
  FirebaseLogsRoadmapStepInterface,
  FirebaseLogsSongsInterface,
  FirebaseLogsSupportAskInterface,
  FirebaseLogsTopPlayersInterface,
} from "feature/logs/types/logs.type";
import { calculateGroupFame } from "feature/logs/utils/activityFame";
import { getFeedDayHeadings } from "feature/logs/utils/feedDayHeadings";
import { formatLogTime } from "feature/logs/utils/formatLogTime";
import {
  type AnyFirebaseLog,
  dropIncompleteTailGroup,
  getLogActivityType,
  groupConsecutiveLogs,
  isExpiredDuelWaiting,
  type LogActivityType,
  type LogGroup,
} from "feature/logs/utils/groupConsecutiveLogs";
import {
  getGroupAwardedFame,
  getGroupReactionAnchor,
  getGroupReactors,
} from "feature/logs/utils/groupReactions";
import {
  getLessonTitle,
  resolveLoggedExercises,
} from "feature/logs/utils/loggedPractice";
import { splitPinnedDonations } from "feature/logs/utils/pinnedDonations";
import {
  EXERCISES_BY_ID,
  findExerciseByTitle,
} from "feature/logs/utils/practiceCatalog";
import { CommunityHighlights } from "feature/logsBox/components/CommunityHighlights";
import { useCommunityDrawer } from "feature/logsBox/hooks/useCommunityDrawer";
import { RecordingViewModal } from "feature/recordings/components/RecordingViewModal";
import { BMC_URL } from "feature/roadmap/data/roadmap.data";
import { TierBadge } from "feature/songs/components/SongsGrid/TierBadge";
import {
  type SongTierInfo,
  useSongTiers,
} from "feature/songs/hooks/useSongTiers";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { getSupportVariantCopy } from "feature/support/content/supportVariants";
import { useTranslation } from "hooks/useTranslation";
import {
  type ActivityPreview,
  ActivityStartModal,
} from "layouts/LogsBoxLayout/components/Logs/ActivityStartModal";
import { useDateFnsLocale, useIntlLocale } from "lib/i18n/dateLocale";
import { Interpolate } from "lib/i18n/Interpolate";
import type { Translate } from "lib/i18n/translate";
import {
  CalendarIcon,
  Coffee,
  Heart,
  Shield,
  Star,
  Trophy,
  X,
} from "lucide-react";
import Link from "next/link";
import { Fragment, useEffect, useMemo, useRef } from "react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useResponsiveStore } from "store/useResponsiveStore";
import { addZeroToTime } from "utils/converter";
import { TOUCH_TARGET } from "utils/touchTarget";

/** Compact practice duration shown next to the points in a feed row — "1h 20 min", "45 min",
 * or seconds for sub-minute sessions (so a short drill never reads as "0m"). */
const formatSessionTime = (ms: number): string => {
  const totalMinutes = Math.floor(ms / 60000);
  if (totalMinutes < 1) return `${Math.round(ms / 1000)}s`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return hours > 0 ? `${hours}h ${minutes} min` : `${minutes} min`;
};

const getLogTimestampMs = (log: AnyFirebaseLog): number =>
  new Date((log as any).timestamp ?? (log as any).data).getTime();

/** Splits a rolled inventory instance into its guitar/effect shape and resolves its level,
 * so arsenal feed rows can hand the full card to `ItemPill`. */
export const resolveRolledItem = (
  rolled: InventoryItem | EffectInventoryItem | undefined,
) => {
  const rolledGuitar = rolled && "guitarId" in rolled ? rolled : null;
  const rolledEffect = rolled && "effectId" in rolled ? rolled : null;
  let level: number | null = null;

  if (rolledGuitar) {
    const def = GUITARS_BY_ID.get(rolledGuitar.guitarId);
    if (def) level = getItemLevel(rolledGuitar, def);
  } else if (rolledEffect) {
    const def = EFFECTS_BY_ID.get(rolledEffect.effectId);
    if (def) level = getEffectLevel(rolledEffect, def);
  }

  return { rolledGuitar, rolledEffect, level };
};

const PLAYLIST_KINDS = new Set(["playlist", "path", "top"]);

const ItemTooltipCard = ({
  itemType,
  itemName,
  itemBrand,
  itemRarity,
  itemImageId,
}: {
  itemType: "guitar" | "effect";
  itemName: string;
  itemBrand: string;
  itemRarity: string;
  itemImageId: number | string;
}) => {
  const color = getRarityColor(itemRarity);
  const imgSrc =
    itemType === "guitar"
      ? getRankBadgeSrc(itemImageId, "small")
      : getEffectImageSrc(itemImageId, "medium");

  const guitarDef =
    itemType === "guitar"
      ? guitarDefinitionByImageId(itemImageId)
      : null;
  const effectDef =
    itemType === "effect"
      ? EFFECT_DEFINITIONS.find((e) => e.imageId === itemImageId)
      : null;

  return (
    <div
      className='flex w-44 flex-col overflow-hidden rounded-xl'
      style={{ border: `1px solid ${color}50`, background: "#111" }}>
      {/* Header */}
      <div className='px-3 pb-1 pt-3'>
        <p
          className='text-xs font-bold tracking-wide'
          style={{ color: `${color}cc` }}>
          {itemBrand}
        </p>
        <p className='text-sm font-bold leading-tight text-white'>{itemName}</p>
        <span
          className='mt-1.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-bold tracking-wide'
          style={{
            backgroundColor: `${color}20`,
            color,
            border: `1px solid ${color}40`,
          }}>
          {itemRarity}
        </span>
      </div>

      {/* Image */}
      <div className='relative mx-2 my-2 flex items-end justify-center overflow-hidden rounded-lg px-3 py-4'>
        {/* Subtle structural grid */}
        <div
          className='pointer-events-none absolute inset-0 z-0'
          style={{
            backgroundImage: [
              `linear-gradient(${color} 1px, transparent 1px)`,
              `linear-gradient(90deg, ${color} 1px, transparent 1px)`,
            ].join(","),
            backgroundSize: "22px 22px",
            opacity: 0.04,
          }}
        />
        {/* Neutral spotlight so dark items separate from the background */}
        <div
          className='pointer-events-none absolute inset-0 z-0'
          style={{
            background: `radial-gradient(60% 55% at 50% 48%, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 40%, transparent 72%)`,
          }}
        />
        {/* Rarity glow */}
        <div
          className='pointer-events-none absolute inset-0 z-0'
          style={{
            background: `radial-gradient(ellipse at center, ${color}18 0%, transparent 70%)`,
          }}
        />
        <img
          src={imgSrc}
          alt={itemName}
          className={`relative z-10 object-contain drop-shadow-xl ${itemType === "guitar" ? "h-36 w-auto -rotate-90" : "h-24 w-24"}`}
        />
      </div>

      {/* Footer */}
      {(guitarDef || effectDef) && (
        <div
          className='flex items-center justify-between px-3 py-2 text-xs text-gray-400'
          style={{
            borderTop: `1px solid ${color}20`,
            background: `${color}08`,
          }}>
          {guitarDef && (
            <>
              <span className='font-semibold text-gray-300'>
                {guitarDef.yearFrom}
              </span>
              <span className='text-xs text-gray-500'>
                {guitarDef.countries[0]}
              </span>
            </>
          )}
          {effectDef && (
            <>
              <span className='font-semibold text-gray-300'>
                {effectDef.type}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

/** Centered, tap-to-dismiss modal used on touch devices where hover tooltips don't fire. */
const CardModal = ({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) => {
  const { t } = useTranslation("feed");
  if (typeof document === "undefined") return null;
  return createPortal(
    <div
      className='fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm'
      onClick={onClose}>
      <div
        className='relative w-full max-w-[320px]'
        onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          aria-label={t("close")}
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "absolute -right-2 -top-2 z-10")}>
          <X size={15} />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
};

/** An item pill with its card: hover tooltip on desktop, tap-to-open modal on touch. */
const PillCard = ({
  pill,
  card,
}: {
  pill: React.ReactNode;
  card: React.ReactNode;
}) => {
  const isMobile = useResponsiveStore((state) => state.isMobile);
  const [open, setOpen] = useState(false);

  // Touch devices: tap opens the card in a centered modal (hover tooltips don't fire).
  if (isMobile) {
    return (
      <>
        <span onClick={() => setOpen(true)}>{pill}</span>
        {open && (
          <CardModal onClose={() => setOpen(false)}>{card}</CardModal>
        )}
      </>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={150}>
        <TooltipTrigger asChild>{pill}</TooltipTrigger>
        <TooltipContent
          className='border-0 bg-transparent p-0 shadow-2xl'
          side='top'>
          {card}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const ItemPill = ({
  itemType,
  itemName,
  itemBrand,
  itemRarity,
  itemImageId,
  level,
  rolledGuitar,
  rolledEffect,
}: {
  itemType: "guitar" | "effect";
  itemName: string;
  itemBrand: string;
  itemRarity: string;
  itemImageId: number | string;
  level: number | null;
  rolledGuitar: any;
  rolledEffect: any;
}) => {
  const { t } = useTranslation("feed");
  const color = getRarityColor(itemRarity);
  const imgSrc =
    itemType === "guitar"
      ? getRankBadgeSrc(itemImageId, "small")
      : getEffectImageSrc(itemImageId, "small");

  const cardContent = rolledGuitar ? (
    <div style={{ width: 250 }}>
      <GuitarCard item={rolledGuitar} readOnly />
    </div>
  ) : rolledEffect ? (
    <div style={{ width: 250 }}>
      <EffectCard item={rolledEffect} readOnly />
    </div>
  ) : (
    <ItemTooltipCard
      itemType={itemType}
      itemName={itemName}
      itemBrand={itemBrand}
      itemRarity={itemRarity}
      itemImageId={itemImageId}
    />
  );

  const pill = (
    <span className='inline-flex w-full cursor-pointer items-center gap-2.5 rounded-lg bg-white/5 p-2 sm:w-auto sm:gap-1.5 sm:rounded-none sm:bg-transparent sm:p-0'>
      {/* Guitar/effect art — fixed size, never shrinks. Leads on mobile, trails on desktop. */}
      <img
        src={imgSrc}
        alt={itemName}
        className={`h-10 w-10 shrink-0 object-contain opacity-80 sm:order-last sm:h-7 sm:w-7 ${itemType === "guitar" ? "-rotate-45" : ""}`}
      />
      {/* Name + badges: stacked on mobile, inline on desktop */}
      <span className='flex min-w-0 flex-1 flex-col gap-1 sm:flex-initial sm:flex-row sm:items-center sm:gap-1.5'>
        <span
          className='order-1 min-w-0 break-words text-sm font-bold sm:order-2'
          style={{ color }}>
          {itemBrand} {itemName}
        </span>
        {/* Badges stay on one line and keep together */}
        <span className='order-2 flex shrink-0 items-center gap-1.5 sm:order-1'>
          <Chip
            color='custom'
            className='whitespace-nowrap px-1.5 py-0.5 text-xs tracking-wide'
            style={getChipCustomStyle(color)}>
            {itemRarity}
          </Chip>
          {level !== null && (
            <Chip
              color='gray'
              className='whitespace-nowrap px-1.5 py-0.5 text-xs tabular-nums tracking-wide'
              title={t("item_level")}>
              {t("item_level_short", { level })}
            </Chip>
          )}
        </span>
      </span>
    </span>
  );

  return <PillCard pill={pill} card={cardContent} />;
};

interface LogsBoxLayoutProps {
  logs: AnyFirebaseLog[];
  marksLogsAsRead: () => void;
  currentUserId: string;
  /** More logs exist below the window — separate from whether "Show more" is still on offer. */
  hasOlderLogs?: boolean;
  hasMoreLogs?: boolean;
  onLoadMoreLogs?: () => void;
  /** The "what's going on" cells beside Live Now — the dashboard's wide panel only. */
  showHighlights?: boolean;
}

const TimeStamp = ({ date }: { date: Date }) => (
  <p className='mb-2 w-full whitespace-nowrap py-1 text-[0.6rem] text-zinc-400 sm:mb-0 sm:w-auto sm:text-[0.55rem] lg:mr-4 lg:text-xs'>
    {date.toLocaleDateString() +
      " " +
      addZeroToTime(date.getHours()) +
      ":" +
      addZeroToTime(date.getMinutes())}
  </p>
);

const LogItem = ({
  isNew,
  bannerId,
  children,
}: {
  isNew: boolean;
  /** The banner the row's player bought and wears, if any. */
  bannerId?: string | null;
  children: React.ReactNode;
}) => {
  const banner = findBanner(bannerId);

  return (
    <div
      className={cn(
        "my-3 flex flex-col flex-nowrap items-start rounded-xl px-4 py-4 transition-all duration-base sm:px-5 lg:flex-row lg:items-center",
        banner && "relative overflow-hidden",
        // A painted banner keeps its card dark in both themes — the pictures
        // are night scenes — and opaque, so the page never shows through. A
        // drawn one sits on the player's normal card.
        bannerNeedsDarkCard(banner)
          ? "force-dark bg-zinc-900"
          : isNew
            ? "bg-zinc-800/70"
            : "bg-zinc-900/60",
      )}>
      {banner && <CosmeticBanner item={banner} />}
      {banner ? (
        <div className={cn("relative z-10 w-full", cosmeticStyles.onBanner)}>
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
};

const getSongStatusMessage = (status: string, t: any): string => {
  return t(`song_status.${status}`);
};

/** Compact tier square shown next to a song reference in the feed. Hidden while
 * the lookup is loading and for unrated/deleted songs. */
const SongTierChip = ({ info }: { info?: SongTierInfo }) => {
  if (!info) return null;
  const tier = getSongTier(
    !info.avgDifficulty ? "?" : info.tier || info.avgDifficulty,
  );
  if (tier.tier === "?") return null;

  return (
    <span title={tier.label} className='mr-1.5 inline-flex shrink-0 align-middle'>
      <TierBadge song={info} className='h-5 w-auto min-w-5 rounded px-1 text-xs' />
    </span>
  );
};

/**
 * A song named inside a feed sentence — the `{{song}}` slot of a `song_status`
 * line. The sentence places it, since German wants it before the closing verb
 * ("hat den Song … bewertet"), not tacked on after the sentence ends.
 */
const SongReference = ({
  song,
  info,
}: {
  song: { songId?: string; songTitle: string; songArtist: string };
  info?: SongTierInfo;
}) => (
  <>
    {song.songId && <SongTierChip info={info} />}
    {song.songId ? (
      <Link
        href={`/songs?view=management&songId=${song.songId}`}
        className={cn(TOUCH_TARGET, "font-bold text-white underline decoration-white/40 decoration-dotted underline-offset-4 transition-colors hover:text-cyan-400 hover:decoration-cyan-400/60")}>
        {song.songArtist} - {song.songTitle}
      </Link>
    ) : (
      <span className='font-bold text-white'>
        {song.songArtist} - {song.songTitle}
      </span>
    )}
  </>
);

// Podkomponenty dla FirebaseLogsTopPlayersItem

const PlayerAvatar = ({ player }: { player: TopPlayerData }) => (
  <div className='relative flex flex-shrink-0 items-center justify-center'>
    <div className='-mx-1 origin-center scale-[0.8]'>
      <Avatar
        size='sm'
        name={player.displayName}
        avatarURL={player.avatar ?? undefined}
      />
    </div>
  </div>
);

const SeasonHeader = ({
  seasonName,
  daysLeftInSeason,
  date,
  t,
}: {
  seasonName: string;
  daysLeftInSeason?: number;
  date: Date;
  t: (key: string) => string;
}) => (
  <div className='flex flex-wrap items-center gap-3 border-b border-white/5 bg-transparent px-3 py-3 sm:px-5 sm:py-4'>
    <div className='flex items-center gap-2'>
      <h3 className='text-sm font-bold tracking-wide text-white sm:text-base'>
        {t("logsBox.top_players")}
      </h3>
    </div>

    <span className='text-xs font-semibold tracking-wide text-zinc-400'>
      {seasonName}
    </span>

    {/* Right side with date info - on larger screens */}
    <div className='ml-auto hidden items-center gap-3 text-xs text-zinc-400 sm:flex'>
      {daysLeftInSeason !== undefined && (
        <Chip color='gray'>
          <CalendarIcon size='1em' className='h-3.5 w-3.5 shrink-0' />
          <span className='tabular-nums'>{daysLeftInSeason}</span>
          <span>{t("logsBox.days_left")}</span>
        </Chip>
      )}
      <span className='text-zinc-400'>
        {date.toLocaleDateString()} {addZeroToTime(date.getHours())}:
        {addZeroToTime(date.getMinutes())}
      </span>
    </div>

    {/* Days left - on mobile only */}
    {daysLeftInSeason !== undefined && (
      <div className='mt-2 flex w-full items-center justify-end text-xs text-zinc-400 sm:hidden'>
        <Chip color='gray'>
          <CalendarIcon size='1em' className='h-3.5 w-3.5 shrink-0' />
          <span className='tabular-nums'>{daysLeftInSeason}</span>
          <span>{t("logsBox.days_left")}</span>
        </Chip>
      </div>
    )}
  </div>
);

const PlayerRow = ({
  player,
  index,
}: {
  player: TopPlayerData;
  index: number;
}) => {
  const { t } = useTranslation("feed");
  const isTop3 = index < 3;

  return (
    <div className='flex items-center gap-2 px-3 py-2 sm:gap-4 sm:px-5 sm:py-3'>
      <div className='w-6 flex-shrink-0 text-center text-sm font-bold text-white/50'>
        #{index + 1}
      </div>

      {/* User info with photo */}
      <div className='flex items-center gap-1 sm:gap-2'>
        <PlayerAvatar player={player} />

        <UserTooltip userId={player.uid}>
          <Link
            className={`${TOUCH_TARGET} text-sm font-bold tracking-wide transition-colors sm:text-base ${
              index === 0 ? "text-yellow-500/90" : "text-white/90"
            } hover:text-white`}
            href={`/user/${player.uid}`}>
            {player.displayName}
          </Link>
        </UserTooltip>
      </div>

      <div className='ml-auto'>
        <div className='flex items-baseline gap-1.5'>
          <span className='text-xs font-semibold text-zinc-400'>
            {t("points_short")}
          </span>
          <span
            className={`text-sm font-bold sm:text-base ${isTop3 ? "text-cyan-400" : "text-cyan-600"}`}>
            {player.points}
          </span>
        </div>
      </div>
    </div>
  );
};

const NoTopPlayersData = ({
  date,
  isNew,
  t,
}: {
  date: Date;
  isNew: boolean;
  t: (key: string) => string;
}) => (
  <div
    className={`my-3 flex flex-col flex-nowrap items-start rounded-xl px-4 py-5 transition-all duration-base sm:px-6 lg:flex-row lg:items-center ${
      isNew ? "bg-zinc-800/70" : "bg-zinc-900/60"
    }`}>
    <TimeStamp date={date} />
    <div className='flex w-full flex-col gap-2 sm:w-[80%]'>
      <h3 className='flex items-center gap-2 text-sm font-bold text-zinc-200'>
        <Trophy size='1em' className='text-yellow-400' />
        <span>{t("logsBox.top_players")}</span>
      </h3>
      <p className='text-zinc-400'>{t("feed:no_top_players")}</p>
    </div>
  </div>
);

const FirebaseLogsTopPlayersItem = ({
  log,
  isNew,
}: {
  log: FirebaseLogsTopPlayersInterface;
  isNew: boolean;
}) => {
  const { t } = useTranslation(["common", "feed"]);
  const { data, topPlayers, daysLeftInSeason } = log;
  const date = new Date(data);

  // Get current season information
  const currentMonth = date.toLocaleString("default", { month: "long" });
  const currentYear = date.getFullYear();
  const seasonName = `${currentMonth} ${currentYear}`;

  // Handle case where topPlayers might not be available
  if (!topPlayers || !Array.isArray(topPlayers) || topPlayers.length === 0) {
    return <NoTopPlayersData date={date} isNew={isNew} t={t} />;
  }

  return (
    <div
      className={`my-3 flex flex-col overflow-hidden rounded-xl transition-all duration-base ${
        isNew ? "bg-zinc-800/70" : "bg-zinc-900/60"
      }`}>
      <SeasonHeader
        seasonName={seasonName}
        daysLeftInSeason={daysLeftInSeason}
        date={date}
        t={t}
      />

      <div className='divide-y divide-white/5'>
        {topPlayers.map((player, index) => (
          <PlayerRow key={player.uid} player={player} index={index} />
        ))}
      </div>
    </div>
  );
};
const FirebaseLogsGuildLevelItem = ({
  log,
  isNew,
}: {
  log: FirebaseLogsGuildLevelInterface;
  isNew: boolean;
}) => {
  const { t } = useTranslation("feed");
  const date = new Date(log.data);
  const accentHex = findCosmetic(log.guildBadge?.accent)?.hex ?? "#fbbf24";
  const unlisted = (log.questsCleared ?? 0) - (log.quests?.length ?? 0);

  return (
    <div
      className={`my-3 flex flex-col gap-3 rounded-xl px-3 py-3 transition-all duration-base sm:px-5 sm:py-4 ${
        isNew ? "bg-zinc-800/70" : "bg-zinc-900/60"
      }`}>
      <div className='flex flex-wrap items-center gap-3'>
        <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10'>
          <Shield size={16} className='text-amber-400' />
        </div>
        <div className='min-w-0 flex-1'>
          <p className='flex items-center gap-2 text-xs font-semibold text-amber-400'>
            {t("guild_level_up")}
            <GuildTagBadge badge={log.guildBadge} />
          </p>
          <h3 className='text-sm font-bold text-white sm:text-base'>
            {t("guild_reached_level", {
              guild: log.guildName,
              level: log.level,
            })}
          </h3>
        </div>
        <span className='ml-auto shrink-0 text-[11px] text-zinc-400'>
          {date.toLocaleDateString()} {addZeroToTime(date.getHours())}:
          {addZeroToTime(date.getMinutes())}
        </span>
      </div>

      {log.quests?.length > 0 && (
        <div className='flex flex-wrap items-center gap-2'>
          <span className='text-sm text-zinc-400'>{t("cleared")}</span>
          {log.quests.map((name) => (
            <Chip
              key={name}
              color='custom'
              style={getChipCustomStyle(accentHex)}>
              {name}
            </Chip>
          ))}
          {unlisted > 0 && (
            <span className='text-sm text-zinc-400'>
              {t("and_more", { count: unlisted })}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

/** A thing a feed sentence names — what was practiced, bought, passed. */
const FEED_OBJECT = "font-bold text-white";
const FEED_OBJECT_LINK = cn(
  TOUCH_TARGET,
  FEED_OBJECT,
  "transition-colors hover:text-cyan-400 hover:underline",
);

/** How many activities a card lists before the rest folds behind "Show more". */
const MAX_VISIBLE_LOGS = 3;

/** The square a feed row leads with when it has a real thing to show: an item, a new level. */
const FeedThumb = ({ children }: { children: React.ReactNode }) => (
  <span
    // Solid already — a bannered row's underlay has nothing to add here.
    data-opaque
    className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800'>
    {children}
  </span>
);

/** A number a feed row reports, under the name of what it measures. */
type FeedStat =
  | { label: string; value: React.ReactNode }
  | false
  | null
  | undefined;

/**
 * One activity in a feed card, always the same shape: a sentence naming the
 * thing, then its numbers as named columns underneath — what it paid first,
 * so points never float loose beside a title with nothing saying what they
 * are. Art, when a row has any, sits under the sentence beside the numbers
 * that describe it: every row's text starts on the same left edge whether or
 * not it has a picture. Every kind of log goes
 * through this, so a card reads top to bottom instead of as a wrapped run of
 * fragments, icons and chips.
 */
const FeedRow = ({
  thumb,
  title,
  facts = [],
  stats = [],
}: {
  thumb?: React.ReactNode;
  title: React.ReactNode;
  /** Short qualifiers that trail the sentence. Falsy entries are skipped. */
  facts?: React.ReactNode[];
  /** Named numbers under the sentence. Falsy entries are skipped. */
  stats?: FeedStat[];
}) => {
  const shownFacts = facts.filter(
    (fact) =>
      fact !== null && fact !== undefined && fact !== false && fact !== "",
  );
  const shownStats = stats.filter(
    (stat): stat is { label: string; value: React.ReactNode } => Boolean(stat),
  );

  return (
    <div className='min-w-0'>
        <p className='break-words text-sm leading-snug text-zinc-400 first-letter:uppercase sm:text-[15px]'>
          {title}
          {shownFacts.length > 0 && (
            // inline-block: on a narrow card the qualifiers drop to the next line together
            // instead of breaking between "Lv" and the number.
            <span className='ml-2 inline-block text-[13px] tabular-nums text-zinc-400'>
              {shownFacts.map((fact, index) => (
                <Fragment key={index}>
                  {index > 0 && (
                    <span aria-hidden className='text-zinc-600'>
                      {" · "}
                    </span>
                  )}
                  {fact}
                </Fragment>
              ))}
            </span>
          )}
        </p>
      {(thumb || shownStats.length > 0) && (
        <div className='mt-2 flex items-center gap-4'>
          {thumb}
          {shownStats.length > 0 && (
            <dl className='flex min-w-0 flex-wrap gap-x-7 gap-y-2'>
              {shownStats.map((stat) => (
                <div key={stat.label}>
                  <dt className='text-xs text-zinc-400'>{stat.label}</dt>
                  <dd className='mt-0.5 flex items-center gap-1 text-sm font-semibold tabular-nums text-zinc-100'>
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </div>
  );
};

/** Points a row paid — always its first stat. */
const pointsStat = (points: number, label: string): FeedStat => ({
  label,
  value: (
    <>
      {points}
      <img
        src='/images/tokens/pick.png'
        alt=''
        className='h-3.5 w-3.5 object-contain'
      />
    </>
  ),
});

const priceStat = (price: number, label: string): FeedStat => ({
  label,
  value: (
    <>
      {price}
      <img
        src='/images/tokens/coin.png'
        alt=''
        className='h-3.5 w-3.5 object-contain'
      />
    </>
  ),
});

const DuelName = ({
  player,
  isWinner,
  isMe,
}: {
  player: FirebaseLogsDuelPlayer;
  isWinner: boolean;
  isMe: boolean;
}) => (
  <Link
    href={`/user/${player.userId}`}
    className={cn(
      TOUCH_TARGET,
      "font-bold transition-colors hover:underline",
      isMe ? "text-cyan-300" : isWinner ? "text-white" : "text-zinc-300",
    )}>
    {player.displayName}
  </Link>
);

/**
 * A settled duel: who beat whom, on what, by how much. Nobody owns the row, so
 * there is nothing to motivate — the two names link to the players instead.
 */
const FirebaseLogsDuelResultItem = ({
  log,
  isNew,
  currentUserId,
}: {
  log: FirebaseLogsDuelResultInterface;
  isNew: boolean;
  currentUserId: string;
}) => {
  const { t } = useTranslation(["feed", "duels"]);
  const intlLocale = useIntlLocale();
  const dateLocale = useDateFnsLocale();
  const date = new Date(log.data);
  const [first, second] = log.players;
  const isDraw = log.kind === "draw";
  const delta = first.ratingAfter - first.ratingBefore;
  const score = (value: number) => value.toLocaleString(intlLocale);

  return (
    <div
      className={`my-3 flex flex-col gap-3 rounded-xl px-4 py-4 transition-all duration-base sm:px-5 ${
        isNew ? "bg-zinc-800/70" : "bg-zinc-900/60"
      }`}>
      {/* Same shape as a player's card: who on top, one row underneath. */}
      <div className='flex flex-wrap items-center gap-x-3 gap-y-1'>
        <span className='flex shrink-0 -space-x-2' aria-hidden='true'>
          <Avatar
            avatarURL={first.avatar || undefined}
            name={first.displayName}
            size='xs'
            className='relative z-10 rounded-full ring-2 ring-zinc-900'
          />
          <Avatar
            avatarURL={second.avatar || undefined}
            name={second.displayName}
            size='xs'
            className='rounded-full ring-2 ring-zinc-900'
          />
        </span>
        <h3 className='min-w-0 text-[15px] text-zinc-400'>
          <Interpolate
            text={t(`duels:feed.${log.kind}`)}
            values={{
              winner: (
                <DuelName
                  player={first}
                  isWinner={!isDraw}
                  isMe={first.userId === currentUserId}
                />
              ),
              loser: (
                <DuelName
                  player={second}
                  isWinner={false}
                  isMe={second.userId === currentUserId}
                />
              ),
            }}
          />
        </h3>
        <span className='shrink-0 text-xs text-zinc-400'>
          {formatLogTime(date, new Date(), {
            locale: dateLocale,
            justNow: t("feed:just_now"),
          })}
        </span>
      </div>

      <div className='sm:pl-[68px]'>
        <FeedRow
          title={<span className={FEED_OBJECT}>{log.exerciseTitle}</span>}
          facts={[t("feed:duel_finished")]}
          stats={[
            {
              label: t("feed:stat.score"),
              value: (
                <>
                  {score(first.bestScore)}
                  <span className='text-zinc-600'>:</span>
                  <span className={isDraw ? undefined : "text-zinc-500"}>
                    {score(second.bestScore)}
                  </span>
                </>
              ),
            },
            !isDraw && {
              label: t("feed:stat.rating"),
              value: (
                <span
                  className={delta > 0 ? "text-emerald-400" : "text-zinc-500"}>
                  {formatRatingDelta(delta)}
                </span>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
};

/**
 * Somebody is waiting in the duel queue. Says that, not who — a duel stays
 * anonymous until it is settled. Joining lives on /duels, where the mic note and
 * the slot limit are shown before the click; a duel started by a stray tap here
 * would end as a walkover loss.
 */
const FirebaseLogsDuelWaitingItem = ({
  log,
  isNew,
}: {
  log: FirebaseLogsDuelWaitingInterface;
  isNew: boolean;
}) => {
  const { t } = useTranslation("feed");
  const date = new Date(log.data);

  return (
    <div
      className={`my-3 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl px-4 py-4 transition-all duration-base sm:px-5 ${
        isNew ? "bg-zinc-800/70" : "bg-zinc-900/60"
      }`}>
      <span className='flex w-8 shrink-0 justify-center'>
        <SearchingDots />
      </span>

      <div className='min-w-0 flex-[1_1_14rem]'>
        <p className='text-xs font-semibold text-zinc-400'>
          {t("duel_waiting_label")}
        </p>
        <h3 className='text-sm font-bold text-white sm:text-base'>
          {t("duel_waiting_title")}
        </h3>
        <p className='mt-1 text-xs text-zinc-400'>{t("duel_waiting_hint")}</p>
      </div>

      <Link
        href='/duels'
        onClick={() => useCommunityDrawer.getState().setOpen(false)}
        className='inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-white px-4 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900'>
        {t("duel_waiting_join")}
      </Link>

      <span className='ml-auto shrink-0 text-[11px] text-zinc-400'>
        {date.toLocaleDateString()} {addZeroToTime(date.getHours())}:
        {addZeroToTime(date.getMinutes())}
      </span>
    </div>
  );
};

const FirebaseLogsSupportAskItem = ({
  log,
  isNew,
}: {
  log: FirebaseLogsSupportAskInterface;
  isNew: boolean;
}) => {
  const { t } = useTranslation("feed");
  const date = new Date(log.data);
  const copy = getSupportVariantCopy(
    log.variant,
    {
    raisedThisMonth: log.raisedThisMonth,
    monthlyGoal: log.monthlyGoal,
    totalRaised: log.totalRaised,
    supporters: log.supporters,
    nextTierLabel: log.nextTierLabel,
    nextTierAmountToGo: log.nextTierAmountToGo,
    tiersFunded: log.tiersFunded,
    tiersTotal: log.tiersTotal,
    },
    t,
  );

  return (
    <div
      className={`force-dark support-warm relative my-3 flex flex-col overflow-hidden rounded-xl transition-all duration-base ${
        isNew ? "bg-zinc-800/70" : "bg-zinc-900/60"
      }`}>
      {/* Same tiled icon pattern and warm glow as the "Help build Riff Quest" banner
          (feature/dashboard/components/SupportBanner.tsx), so the funding story looks
          the same wherever it shows up. */}
      <HeroPattern
        className='light-hide opacity-[0.08]'
        maskImage='linear-gradient(to right, black 0%, transparent 55%)'
      />
      <div className='pointer-events-none absolute inset-0 light-hide bg-gradient-to-r from-orange-500/10 via-transparent to-transparent' />
      <div className='relative z-10 flex flex-wrap items-center gap-3 px-3 py-3 sm:px-5 sm:py-4'>
        <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500/10'>
          <Heart size={16} className='text-orange-400' fill='currentColor' />
        </div>
        <div className='min-w-0 flex-1'>
          <p className='text-xs font-semibold text-orange-400/80'>
            {copy.eyebrow}
          </p>
          <h3 className='text-sm font-bold text-white sm:text-base'>
            {copy.headline}
          </h3>
        </div>
        <span className='ml-auto shrink-0 text-[11px] text-zinc-400'>
          {date.toLocaleDateString()} {addZeroToTime(date.getHours())}:
          {addZeroToTime(date.getMinutes())}
        </span>
      </div>

      <div className='relative z-10 px-3 pb-4 sm:px-5'>
        <p className='text-sm text-zinc-400'>{copy.body}</p>
        <a
          href={BMC_URL}
          target='_blank'
          rel='noopener noreferrer'
          className='mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-semibold text-zinc-950 transition-all hover:bg-amber-400 sm:text-sm'>
          <Coffee size={14} />
          {t("support_riff_quest")}
        </a>
      </div>
    </div>
  );
};

/**
 * Who the card thanks: the player's nick when the donation is matched to an account, otherwise
 * the name Buy Me a Coffee sent — unless that name is just the donor's email, which stays private.
 */
const getDonationName = (
  log: FirebaseLogsDonationInterface,
  t: Translate,
): string => {
  const userName = log.userName?.trim();
  if (log.uid && userName) return userName;

  const supporterName = log.supporterName?.trim();
  if (supporterName && !supporterName.includes("@")) return supporterName;

  return userName || t("someone");
};

/** The sentence the card leads with — the day's whole support when there was more than one. */
const getDonationHeadline = (
  logs: FirebaseLogsDonationInterface[],
  t: Translate,
): string => {
  const [newest] = logs;
  const name = getDonationName(newest, t);

  if (logs.length > 1)
    return t("donation_backed_times", { name, count: logs.length });

  return newest.kind === "recurring"
    ? t("donation_monthly", { name })
    : t("donation_coffee", { name, amount: newest.amount });
};

/** One coffee inside a card that holds several — the day's donations, listed under the headline. */
const DonationLine = ({ log }: { log: FirebaseLogsDonationInterface }) => {
  const { t } = useTranslation("feed");
  const date = new Date(log.data);

  return (
    <div className='flex items-center gap-2 text-sm text-zinc-400'>
      <Coffee size={14} className='shrink-0 text-orange-400/80' />
      <span className='text-white'>
        {log.kind === "recurring"
          ? t("monthly_support")
          : t("coffee_amount", { amount: log.amount })}
      </span>
      <span className='text-[11px] text-zinc-400'>
        {addZeroToTime(date.getHours())}:{addZeroToTime(date.getMinutes())}
      </span>
    </div>
  );
};

/**
 * A donation card. When the address Buy Me a Coffee sent matches an account, the card names that
 * player and can be motivated like any other activity — the donor keeps the Fame the feed hands
 * out, and a second coffee the same day stacks onto the same amount instead of opening a second
 * card. With no account behind the donation there is nobody to pay, so the card stays the plain
 * announcement it has always been.
 */
const FirebaseLogsDonationItem = ({
  logs,
  isNew,
  currentUserId,
  showMotivateHint,
}: {
  logs: FirebaseLogsDonationInterface[];
  isNew: boolean;
  currentUserId: string;
  showMotivateHint: boolean;
}) => {
  const { t } = useTranslation("feed");
  const newest = logs[0];
  const date = new Date(newest.data);
  const { uid, userName, avatarUrl, guildBadge } = newest;

  const fameAmount = calculateGroupFame({ logs });
  const reactionLogId = getGroupReactionAnchor({ logs })?.id;
  const reactors = getGroupReactors({ logs });
  const awardedFame = getGroupAwardedFame({ logs }, fameAmount);

  return (
    <div
      className={`force-dark support-warm relative my-3 flex flex-col overflow-hidden rounded-xl transition-all duration-base ${
        isNew ? "bg-zinc-800/70" : "bg-zinc-900/60"
      }`}>
      <HeroPattern
        className='light-hide opacity-[0.1]'
        maskImage='linear-gradient(to right, black 0%, transparent 60%)'
      />
      <div className='pointer-events-none absolute inset-0 light-hide bg-gradient-to-r from-orange-500/15 via-transparent to-transparent' />
      <div className='relative z-10 flex flex-wrap items-center gap-3 px-3 py-3 sm:px-5 sm:py-4'>
        <div className='min-w-0 flex-1'>
          <p className='text-xs font-semibold text-orange-400'>
            {t("new_supporter")}
          </p>
          <h3 className='text-sm font-bold text-white sm:text-base'>
            {getDonationHeadline(logs, t)}
          </h3>
        </div>
        <span className='ml-auto shrink-0 text-[11px] text-zinc-400'>
          {date.toLocaleDateString()} {addZeroToTime(date.getHours())}:
          {addZeroToTime(date.getMinutes())}
        </span>
      </div>

      {logs.length > 1 && (
        <div className='relative z-10 flex flex-col gap-2 px-3 pb-4 sm:px-5'>
          {logs.map((log, index) => (
            <DonationLine key={log.id ?? `${log.data}-${index}`} log={log} />
          ))}
        </div>
      )}

      {uid && (
        <div className='relative z-10 flex items-center gap-2 px-3 pb-4 sm:gap-2.5 sm:px-5'>
          <span className='inline-flex min-w-0 items-center gap-2 font-semibold text-zinc-200'>
            <UserLink
              uid={uid}
              userName={userName ?? getDonationName(newest, t)}
              avatarUrl={avatarUrl ?? undefined}
              guildBadge={guildBadge}
              avatarClassName={AVATAR_SHRINK}
              nameClassName='text-[15px] text-zinc-100 sm:ml-2'
              guildBadgeClassName='hidden sm:inline-flex'
            />
          </span>
          {reactionLogId && (
            <div className='ml-auto shrink-0'>
              <LogReaction
                logId={reactionLogId}
                reactions={reactors}
                currentUserId={currentUserId}
                disabled={uid === currentUserId}
                fameAmount={fameAmount}
                awardedFame={awardedFame}
                recipientName={userName ?? getDonationName(newest, t)}
                showHint={showMotivateHint}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * The exercise a goal row names. A library exercise links to where it's
 * played; one the player wrote has nowhere to open it — it may be private — so
 * it's just its title.
 */
const GoalExerciseName = ({ exerciseId, title }: { exerciseId: string; title: string }) =>
  communityDocId(exerciseId) ? (
    <span className='font-bold text-white'>{title}</span>
  ) : (
    <Link
      href={`/profile/skills?exerciseId=${exerciseId}`}
      className={cn(TOUCH_TARGET, "font-bold text-white transition-colors hover:text-cyan-400 hover:underline")}>
      {title}
    </Link>
  );

/**
 * A guitar or effect named by a feed row: its art leads the row, the name
 * opens the item's card (hover on desktop, tap on touch), rarity and level sit
 * in the facts.
 */
const ItemRow = ({
  lead,
  trail,
  itemType,
  itemName,
  itemBrand,
  itemRarity,
  itemImageId,
  rolledItem,
  price,
}: {
  /** The sentence up to the item ("opened Vintage Case and got"). */
  lead: React.ReactNode;
  /** Whatever follows the item's name ("from Tomek"). */
  trail?: React.ReactNode;
  itemType: "guitar" | "effect";
  itemName: string;
  itemBrand: string;
  itemRarity: string;
  itemImageId: number | string;
  rolledItem: InventoryItem | EffectInventoryItem | undefined;
  /** What it was listed or sold for. */
  price?: number;
}) => {
  const { t } = useTranslation("feed");
  const { rolledGuitar, rolledEffect, level } = resolveRolledItem(rolledItem);
  const imgSrc =
    itemType === "guitar"
      ? getRankBadgeSrc(itemImageId, "small")
      : getEffectImageSrc(itemImageId, "small");

  const card = rolledGuitar ? (
    <div style={{ width: 250 }}>
      <GuitarCard item={rolledGuitar} readOnly />
    </div>
  ) : rolledEffect ? (
    <div style={{ width: 250 }}>
      <EffectCard item={rolledEffect} readOnly />
    </div>
  ) : (
    <ItemTooltipCard
      itemType={itemType}
      itemName={itemName}
      itemBrand={itemBrand}
      itemRarity={itemRarity}
      itemImageId={itemImageId}
    />
  );

  return (
    <FeedRow
      thumb={
        <FeedThumb>
          <img
            src={imgSrc}
            alt=''
            className={cn(
              "h-8 w-8 object-contain",
              itemType === "guitar" && "-rotate-45",
            )}
          />
        </FeedThumb>
      }
      title={
        <>
          {lead}{" "}
          <PillCard
            pill={
              <span className={cn(FEED_OBJECT, "cursor-pointer")}>
                {itemBrand} {itemName}
              </span>
            }
            card={card}
          />
          {trail && <> {trail}</>}
        </>
      }
      stats={[
        {
          label: t("stat.rarity"),
          value: (
            <span style={{ color: getRarityColor(itemRarity) }}>
              {itemRarity}
            </span>
          ),
        },
        level !== null && { label: t("stat.level"), value: level },
        price !== undefined && priceStat(price, t("stat.price")),
      ]}
    />
  );
};

/** The Guitar Builder twin of ItemRow: a part dropped from a case. */
const ComponentRow = ({
  lead,
  component,
}: {
  lead: React.ReactNode;
  component: OwnedComponent | undefined;
}) => {
  const { t } = useTranslation("feed");
  const def = component ? getComponent(component.defId) : null;
  if (!component || !def) return <FeedRow title={lead} />;

  return (
    <FeedRow
      thumb={
        <FeedThumb>
          {/* stash art squeezed into the row's slot, whatever size the thumb draws it at */}
          <ComponentThumb
            def={def}
            className='h-8 w-8 shrink-0 [&_img]:!h-full [&_img]:!w-full [&_span]:!h-full [&_span]:!w-full'
          />
        </FeedThumb>
      }
      title={
        <>
          {lead}{" "}
          <PillCard
            pill={
              <span className={cn(FEED_OBJECT, "cursor-pointer")}>
                {def.name}
              </span>
            }
            card={<ComponentPreviewCard component={component} />}
          />
        </>
      }
      facts={[
        SLOT_LABELS[def.slot],
      ]}
      stats={[
        {
          label: t("stat.rarity"),
          value: (
            <span style={{ color: getRarityColor(def.rarity) }}>
              {def.rarity}
            </span>
          ),
        },
        { label: t("stat.level"), value: component.level },
      ]}
    />
  );
};

/** Renders one activity as feed rows — the avatar and the reaction live once on the group. */
const GroupedLogLine = ({
  log,
  type,
  songTiers,
  onPreview,
  onViewRecording,
  onOpenLeaderboard,
}: {
  log: AnyFirebaseLog;
  type: LogActivityType;
  songTiers: Record<string, SongTierInfo>;
  onPreview: (preview: ActivityPreview) => void;
  onViewRecording: (id: string) => void;
  onOpenLeaderboard: (exerciseId: string, exerciseTitle: string) => void;
}) => {
  const { t } = useTranslation(["common", "exercises", "feed"]);

  if (type === "song") {
    const songLog = log as FirebaseLogsSongsInterface;
    const message = getSongStatusMessage(songLog.status, t);
    const showRating =
      songLog.status === "difficulty_rate" &&
      songLog.difficulty_rate !== undefined;
    const ratingTier = showRating
      ? getSongTier(songLog.difficulty_rate as number)
      : null;

    return (
      <FeedRow
        title={
          <Interpolate
            text={message}
            values={{
              song: (
                <SongReference
                  song={songLog}
                  info={songLog.songId ? songTiers[songLog.songId] : undefined}
                />
              ),
            }}
          />
        }
        facts={[
          showRating && ratingTier && (
            <span
              title={t("feed:difficulty_rated", {
                rating: songLog.difficulty_rate,
                tier: ratingTier.label,
              })}>
              {songLog.difficulty_rate}/10
            </span>
          ),
        ]}
      />
    );
  }

  if (type === "recording") {
    const recLog = log as FirebaseLogsRecordingsInterface;

    return (
      <FeedRow
        title={
          <>
            {t("feed:added_recording")}{" "}
            {recLog.recordingId ? (
              <button
                type='button'
                onClick={() => onViewRecording(recLog.recordingId as string)}
                className={cn(FEED_OBJECT_LINK, "text-left")}>
                {recLog.recordingTitle}
              </button>
            ) : (
              <a
                href={recLog.videoUrl}
                target='_blank'
                rel='noopener noreferrer'
                className={FEED_OBJECT_LINK}>
                {recLog.recordingTitle}
              </a>
            )}
          </>
        }
        facts={[
          recLog.songTitle && `${recLog.songArtist} - ${recLog.songTitle}`,
        ]}
      />
    );
  }

  if (type === "caseOpen") {
    const caseLog = log as FirebaseLogsCaseOpenInterface;
    const lead = (
      <Interpolate
        text={t("feed:opened_case")}
        values={{
          case: <span className={FEED_OBJECT}>{caseLog.caseName}</span>,
        }}
      />
    );

    return caseLog.itemType === "component" ? (
      <ComponentRow lead={lead} component={caseLog.component} />
    ) : (
      <ItemRow
        lead={lead}
        itemType={caseLog.itemType}
        itemName={caseLog.itemName}
        itemBrand={caseLog.itemBrand}
        itemRarity={caseLog.itemRarity}
        itemImageId={caseLog.itemImageId}
        rolledItem={caseLog.rolledItem}
      />
    );
  }

  if (type === "marketplace") {
    const marketLog = log as FirebaseLogsMarketplaceInterface;

    return (
      <ItemRow
        lead={t("feed:listed")}
        itemType={marketLog.itemType}
        itemName={marketLog.itemName}
        itemBrand={marketLog.itemBrand}
        itemRarity={marketLog.itemRarity}
        itemImageId={marketLog.itemImageId}
        rolledItem={marketLog.rolledItem}
        price={marketLog.price}
      />
    );
  }

  if (type === "marketplacePurchase") {
    const purchaseLog = log as FirebaseLogsMarketplacePurchaseInterface;

    return (
      <ItemRow
        lead={t("feed:bought")}
        trail={
          <>
            {t("feed:from")}{" "}
            {purchaseLog.sellerId ? (
              <Link
                href={`/user/${purchaseLog.sellerId}`}
                className={FEED_OBJECT_LINK}>
                {purchaseLog.sellerName}
              </Link>
            ) : (
              <span className={FEED_OBJECT}>{purchaseLog.sellerName}</span>
            )}
          </>
        }
        itemType={purchaseLog.itemType}
        itemName={purchaseLog.itemName}
        itemBrand={purchaseLog.itemBrand}
        itemRarity={purchaseLog.itemRarity}
        itemImageId={purchaseLog.itemImageId}
        rolledItem={purchaseLog.rolledItem}
        price={purchaseLog.price}
      />
    );
  }

  if (type === "playlist") {
    const playlistLog = log as FirebaseLogsPlaylistInterface;
    const kindLabel = t(
      `feed:playlist_kind.${PLAYLIST_KINDS.has(playlistLog.playlistKind) ? playlistLog.playlistKind : "playlist"}`,
    );

    return (
      <FeedRow
        title={
          <>
            {t("feed:created_playlist", { kind: kindLabel })}{" "}
            <Link
              href={`/songs?view=playlists&playlistId=${playlistLog.playlistId}`}
              className={FEED_OBJECT_LINK}>
              {playlistLog.playlistName}
            </Link>
          </>
        }
        facts={[
          playlistLog.songCount > 0 &&
            (playlistLog.songCount === 1
              ? t("feed:song_count_one")
              : t("feed:song_count_other", { count: playlistLog.songCount })),
        ]}
      />
    );
  }

  if (type === "examPassed") {
    const examLog = log as FirebaseLogsExamPassedInterface;

    return (
      <FeedRow
        title={
          <Interpolate
            text={t("feed:passed_exam")}
            values={{
              step: <span className={FEED_OBJECT}>{examLog.stepTitle}</span>,
            }}
          />
        }
        facts={[
          examLog.stars > 0 && (
            <span className='inline-flex items-center gap-0.5 text-zinc-300'>
              {Array.from({ length: examLog.stars }).map((_, i) => (
                <Star key={i} className='h-3 w-3 shrink-0 fill-current' />
              ))}
            </span>
          ),
        ]}
        stats={[
          { label: t("feed:stat.accuracy"), value: `${examLog.accuracy}%` },
        ]}
      />
    );
  }

  if (type === "roadmapStep") {
    const stepLog = log as FirebaseLogsRoadmapStepInterface;

    return (
      <FeedRow
        title={
          <Interpolate
            text={t("feed:completed_roadmap_step")}
            values={{
              step: (
                <Link
                  href={`/ai-coach?roadmapId=${stepLog.roadmapId}&step=${stepLog.stepId}`}
                  className={FEED_OBJECT_LINK}>
                  {stepLog.stepTitle}
                </Link>
              ),
              roadmap: (
                <span className='font-semibold text-zinc-200'>
                  {stepLog.roadmapTitle}
                </span>
              ),
            }}
          />
        }
        facts={[stepLog.phaseTitle]}
      />
    );
  }

  if (type === "goalCompleted") {
    const goalLog = log as FirebaseLogsGoalCompletedInterface;

    return (
      <FeedRow
        title={
          <Interpolate
            text={t("feed:reached_exercise_goal")}
            values={{
              exercise: (
                <GoalExerciseName
                  exerciseId={goalLog.exerciseId}
                  title={goalLog.exerciseTitle}
                />
              ),
            }}
          />
        }
        stats={[
          { label: t("feed:stat.tempo"), value: `${goalLog.targetBpm} BPM` },
        ]}
      />
    );
  }

  if (type === "goalCreated") {
    const goalLog = log as FirebaseLogsGoalCreatedInterface;

    return (
      <FeedRow
        title={
          <Interpolate
            text={t("feed:set_exercise_goal")}
            values={{
              exercise: (
                <GoalExerciseName
                  exerciseId={goalLog.exerciseId}
                  title={goalLog.exerciseTitle}
                />
              ),
            }}
          />
        }
        stats={[
          {
            label: t("feed:stat.tempo"),
            value: `${goalLog.startBpm} → ${goalLog.targetBpm} BPM`,
          },
        ]}
      />
    );
  }

  if (type === "playerJoined") {
    const joinedLog = log as FirebaseLogsPlayerJoinedInterface;
    const phrase = welcomeGoalPhrase(joinedLog.goal, joinedLog.planTitle, t);

    return (
      <FeedRow
        title={phrase ? t("feed:joined_with", { phrase }) : t("feed:joined")}
      />
    );
  }

  if (type === "dailyQuest") {
    const questLog = log as FirebaseLogsDailyQuestInterface;

    return (
      <FeedRow
        title={
          <Interpolate
            text={t("feed:completed_daily_quests")}
            values={{
              quests: (
                <span className={FEED_OBJECT}>{t("feed:daily_quests")}</span>
              ),
            }}
          />
        }
        stats={[pointsStat(questLog.points, t("feed:stat.points"))]}
      />
    );
  }

  // "exercise" | "exercisePlan" — general practice log (points, level ups, achievements, plan/exercise/song refs).
  const genericLog = log as FirebaseLogsInterface;
  const plan = genericLog.planId
    ? (defaultPlans.find((p) => p.id === genericLog.planId) ?? null)
    : null;
  const matchedExercise: Exercise | null = genericLog.exerciseTitle
    ? findExerciseByTitle(genericLog.exerciseTitle)
    : null;
  const rankedExercise =
    matchedExercise && hasLeaderboard(matchedExercise) ? matchedExercise : null;
  // A plan that isn't in the catalog — someone's own, an auto plan — can only be opened through
  // the exercises its log lists. Logs written before those were recorded stay plain labels.
  const loggedExercises = resolveLoggedExercises(
    genericLog.exerciseIds,
    EXERCISES_BY_ID,
  );
  const lessonTitle = getLessonTitle(genericLog.exerciseTitle);
  const lessonVideoId = genericLog.lessonVideoId;
  // The session's own name, as the report filed it. A song session's title just
  // repeats its song line ("Song: …", "Practicing: …"), so it is not one.
  const sessionTitle =
    genericLog.exerciseTitle &&
    !genericLog.exerciseTitle.includes("Practicing: ") &&
    !genericLog.exerciseTitle.startsWith("Song: ")
      ? genericLog.exerciseTitle
      : null;
  // A custom or community plan is not in `defaultPlans`, so its name only ever
  // reaches the feed as the session title — without this it used to vanish and
  // leave a ten-song routine looking like one song. An ad-hoc single-exercise
  // session carries a planId as well (the library wraps the exercise in a
  // throwaway plan), so a title the catalog still knows stays an exercise.
  // A boss fight files its boss as the session's title: a fight to go to, not a plan to open.
  const bossTitle = genericLog.planId?.startsWith(BOSS_PLAN_PREFIX) ? sessionTitle : null;
  const planTitle = plan
    ? plan.title
    : genericLog.planId && sessionTitle && !matchedExercise && !bossTitle
      ? sessionTitle
      : null;
  // `songTitle` only ever holds the song that got the most time, so on a routine
  // that ran a whole setlist it named one of ten. The plan's name says it all.
  const hidesPrimarySong = !!planTitle && (genericLog.songs?.length ?? 0) > 1;
  // A manual report can name several songs; listing only `songTitle` hid all
  // but the first one. Older logs carry no `songs`, so they fall back to it.
  const practicedSongs = (() => {
    const seen = new Set<string>();
    const fromSongs = (genericLog.songs ?? []).filter((song) => {
      const key = song.songId || `${song.songArtist} - ${song.songTitle}`;
      if (!song.songTitle || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    if (fromSongs.length > 0) return fromSongs;
    return genericLog.songTitle && genericLog.songArtist
      ? [
          {
            songId: genericLog.songId,
            songTitle: genericLog.songTitle,
            songArtist: genericLog.songArtist,
          },
        ]
      : [];
  })();
  const sessionTimeMs = genericLog.timeSumary?.sumTime ?? 0;

  /**
   * The thing a session practiced, inside its sentence. It opens that plan,
   * exercise or lesson when the feed knows how to, and stays plain text when it
   * doesn't — a free-text manual report, an older log.
   */
  const practiced = (label: string, hint: string, onOpen?: () => void) => (
    <Interpolate
      text={t("feed:practiced_item")}
      values={{
        item: onOpen ? (
          <button
            type='button'
            onClick={onOpen}
            title={hint}
            className={cn(FEED_OBJECT_LINK, "text-left")}>
            {label}
          </button>
        ) : (
          <span className={FEED_OBJECT}>{label}</span>
        ),
      }}
    />
  );

  // What the session was about. Usually one thing; a plan logged with a single
  // song names both, each on its own row.
  const subjects: { title: React.ReactNode; facts?: React.ReactNode[] }[] = [];

  if (bossTitle) {
    subjects.push({
      title: (
        <Interpolate
          text={t("feed:fought_boss")}
          values={{
            item: (
              <Link
                href='/bosses'
                title={t("feed:boss_hint")}
                className={FEED_OBJECT_LINK}>
                {bossTitle}
              </Link>
            ),
          }}
        />
      ),
      facts: [
        genericLog.bossRun &&
          t("feed:phase_cleared", { phase: genericLog.bossRun.phase }),
      ],
    });
  }

  if (planTitle) {
    subjects.push({
      title: practiced(
        planTitle,
        t("feed:plan_hint"),
        plan
          ? () => onPreview({ kind: "plan", plan })
          : loggedExercises.length > 0
            ? () =>
                onPreview({
                  kind: "routine",
                  title: planTitle,
                  exercises: loggedExercises,
                })
            : undefined,
      ),
      facts: [t("feed:activity_kind.plan")],
    });
  }

  if (sessionTitle && !planTitle && !bossTitle && !genericLog.songTitle) {
    subjects.push(
      lessonTitle
        ? {
            title: practiced(
              lessonTitle,
              t("feed:lesson_hint"),
              lessonVideoId
                ? () =>
                    onPreview({
                      kind: "lesson",
                      title: lessonTitle,
                      videoId: lessonVideoId,
                    })
                : undefined,
            ),
            facts: [t("feed:activity_kind.lesson")],
          }
        : {
            title: practiced(
              sessionTitle,
              t("feed:exercise_hint"),
              matchedExercise
                ? () =>
                    onPreview({ kind: "exercise", exercise: matchedExercise })
                : undefined,
            ),
          },
    );
  }

  if (practicedSongs.length > 0 && !hidesPrimarySong) {
    subjects.push({
      title: (
        <Interpolate
          text={t("common:song_status.practiced", {
            count: practicedSongs.length,
          })}
          values={{
            song: practicedSongs.map((song, index) => (
              <Fragment
                key={song.songId || `${song.songArtist}-${song.songTitle}`}>
                {index > 0 && <span className='text-zinc-500'>, </span>}
                <SongReference
                  song={song}
                  info={song.songId ? songTiers[song.songId] : undefined}
                />
              </Fragment>
            )),
          }}
        />
      ),
    });
  }

  if (subjects.length === 0) subjects.push({ title: t("feed:logged_session") });

  /** A scored number opens the exercise's leaderboard when it has one. */
  const ranked = (value: React.ReactNode, hint?: string) =>
    rankedExercise ? (
      <button
        type='button'
        onClick={() =>
          onOpenLeaderboard(rankedExercise.id, rankedExercise.title)
        }
        title={t("feed:ranking_hint")}
        className={cn(
          TOUCH_TARGET,
          "font-semibold underline decoration-white/40 decoration-dotted underline-offset-4 transition-colors hover:text-cyan-400 hover:decoration-cyan-400/60",
        )}>
        {value}
      </button>
    ) : (
      <span title={hint}>{value}</span>
    );
  const scoreStat = (score: number): FeedStat => ({
    label: t("feed:stat.score"),
    value: ranked(score),
  });
  const placeStat = (rank: number | null | undefined): FeedStat =>
    rank != null && {
      label: t("feed:stat.place"),
      value: ranked(`#${rank}`, t("feed:leaderboard_place_hint")),
    };

  const mic =
    genericLog.micPerformance && genericLog.micPerformance.score !== 0
      ? genericLog.micPerformance
      : null;
  const ear =
    genericLog.earTrainingPerformance &&
    genericLog.earTrainingPerformance.score !== 0
      ? genericLog.earTrainingPerformance
      : null;

  // Always in this order, so the eye finds the same number in the same column on every card.
  const sessionStats: FeedStat[] = [
    pointsStat(genericLog.points, t("feed:stat.points")),
    sessionTimeMs > 0 && {
      label: t("feed:stat.time"),
      value: (
        <span title={t("feed:session_time_hint")}>
          {formatSessionTime(sessionTimeMs)}
        </span>
      ),
    },
    mic && scoreStat(mic.score),
    mic && { label: t("feed:stat.accuracy"), value: `${mic.accuracy}%` },
    // Older logs and metronome-less exercises carry no tempo — say nothing rather than guess one.
    mic &&
      mic.bpm != null && {
        label: t("feed:stat.tempo"),
        value: `${mic.bpm} BPM`,
      },
    mic && placeStat(mic.rank),
    ear && scoreStat(ear.score),
    ear && placeStat(ear.rank),
  ];

  return (
    <>
      {subjects.map((subject, index) => (
        <FeedRow
          key={index}
          title={subject.title}
          facts={subject.facts}
          // The session's points, time and score belong to its first row.
          stats={index === 0 ? sessionStats : undefined}
        />
      ))}

      {genericLog.newLevel?.isNewLevel && (
        <FeedRow
          title={
            <Interpolate
              text={t("feed:reached_level")}
              values={{
                level: (
                  <span className={FEED_OBJECT}>
                    {genericLog.newLevel.level}
                  </span>
                ),
              }}
            />
          }
        />
      )}

      {genericLog.newAchievements?.length > 0 && (
        <FeedRow
          title={
            <span className='inline-flex flex-wrap items-center gap-2'>
              {t("common:logsBox.achievements")}
              {genericLog.newAchievements.map((achievement, index) => (
                <AchievementIcon key={index} id={achievement} />
              ))}
            </span>
          }
        />
      )}
    </>
  );
};

const GroupedLogItem = ({
  group,
  isNew,
  currentUserId,
  songTiers,
  showMotivateHint,
  onPreview,
  onViewRecording,
  onOpenLeaderboard,
}: {
  group: LogGroup;
  isNew: boolean;
  currentUserId: string;
  songTiers: Record<string, SongTierInfo>;
  showMotivateHint: boolean;
  onPreview: (preview: ActivityPreview) => void;
  onViewRecording: (id: string) => void;
  onOpenLeaderboard: (exerciseId: string, exerciseTitle: string) => void;
}) => {
  const { t } = useTranslation("feed");
  const dateLocale = useDateFnsLocale();
  const [isExpanded, setIsExpanded] = useState(false);
  const representative = group.logs[0] as FirebaseLogsInterface;
  const date = new Date(getLogTimestampMs(group.logs[0]));
  const fameAmount = calculateGroupFame(group);
  const { uid, userName, avatarUrl, guildBadge } =
    representative;
  const worn = useEquippedCosmetics()(uid);

  // The reaction lives on the oldest log in the group, not the newest one shown at the top: the
  // head keeps changing as the user logs more of the same activity, the tail does not.
  const reactionLogId = getGroupReactionAnchor(group)?.id;
  const reactors = getGroupReactors(group);
  const awardedFame = getGroupAwardedFame(group, fameAmount);

  // A long run of the same player's activity folds after the newest few, so one busy evening
  // doesn't push everyone else out of the feed.
  const visibleLogs = isExpanded
    ? group.logs
    : group.logs.slice(0, MAX_VISIBLE_LOGS);
  const hiddenCount = group.logs.length - visibleLogs.length;

  return (
    <LogItem isNew={isNew} bannerId={worn.banner}>
      {/* Name and Motivate share the top row; the activity rows run underneath at the card's full
          width, so what a row paid always lands on the same right edge. From `sm` up the rows start
          where the name does, leaving the avatar a column of its own. */}
      <div className='grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3'>
        <div className='flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1'>
          <span className='inline-flex min-w-0 items-center gap-2 font-semibold text-zinc-200'>
            <UserLink
              uid={uid}
              userName={userName}
              avatarUrl={avatarUrl ?? undefined}
              guildBadge={guildBadge}
              avatarEffect={worn.avatar}
              avatarClassName={AVATAR_SHRINK}
              nameClassName='text-[15px] text-zinc-100 sm:ml-2'
              guildBadgeClassName='hidden sm:inline-flex'
            />
          </span>
          <span className='hidden shrink-0 items-center gap-1.5 text-xs text-zinc-400 sm:flex'>
            {isNew && (
              <span
                aria-label={t("new_since_last_visit")}
                className='h-1.5 w-1.5 rounded-full bg-cyan-400'
              />
            )}
            {formatLogTime(date, new Date(), {
              locale: dateLocale,
              justNow: t("just_now"),
            })}
          </span>
        </div>

        {reactionLogId && (
          <LogReaction
            logId={reactionLogId}
            reactions={reactors}
            currentUserId={currentUserId}
            disabled={uid === currentUserId}
            fameAmount={fameAmount}
            awardedFame={awardedFame}
            recipientName={userName}
            showHint={showMotivateHint}
          />
        )}

        <div className='col-span-2 flex min-w-0 flex-col gap-5 sm:pl-14'>
          {visibleLogs.map((log, index) => (
            <GroupedLogLine
              key={
                (log as { id?: string }).id ??
                `${getLogTimestampMs(log)}-${index}`
              }
              log={log}
              type={getLogActivityType(log)}
              songTiers={songTiers}
              onPreview={onPreview}
              onViewRecording={onViewRecording}
              onOpenLeaderboard={onOpenLeaderboard}
            />
          ))}
          {hiddenCount > 0 && (
            <button
              type='button'
              onClick={() => setIsExpanded(true)}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "self-start",
              )}>
              {t("show_more_count", { count: hiddenCount })}
            </button>
          )}
        </div>
      </div>
    </LogItem>
  );
};

const Logs = ({
  logs,
  marksLogsAsRead,
  currentUserId,
  hasOlderLogs,
  hasMoreLogs,
  onLoadMoreLogs,
  showHighlights = false,
}: LogsBoxLayoutProps) => {
  const { t } = useTranslation("feed");
  const { isNewMessage } = useUnreadMessages();
  const isMobile = useResponsiveStore((state) => state.isMobile);
  const [activeRecordingId, setActiveRecordingId] = useState<string | null>(
    null,
  );
  const [preview, setPreview] = useState<ActivityPreview | null>(null);
  const [practicingLesson, setPracticingLesson] = useState<{
    title: string;
    videoId: string;
  } | null>(null);
  const [leaderboardExercise, setLeaderboardExercise] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const spanRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!spanRef.current) return;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          marksLogsAsRead();
        }
      },
      { threshold: 1, rootMargin: "-400px" },
    );

    observerRef.current.observe(spanRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []); // Empty dependency array since we handle cleanup manually

  // Donations from the last 24 hours are lifted to the front before grouping, so they open the
  // feed instead of sinking under the evening's practice reports. Everything else keeps the order
  // it streamed in.
  const now = useNow();
  const { groups, pinnedCount } = useMemo(() => {
    const { pinned, rest } = splitPinnedDonations(
      logs.filter((log) => !isExpiredDuelWaiting(log, now)),
    );

    const pinnedGroups = groupConsecutiveLogs(pinned);

    return {
      groups: [
        ...pinnedGroups,
        ...dropIncompleteTailGroup(
          groupConsecutiveLogs(rest),
          Boolean(hasOlderLogs),
        ),
      ],
      pinnedCount: pinnedGroups.length,
    };
  }, [logs, hasOlderLogs, now]);

  // Where each calendar day starts in the feed. Pinned donations sit above the stream out of
  // order, so they get no heading and don't count as the day before the first real one.
  const intlLocale = useIntlLocale();
  const dayHeadings = useMemo(
    () =>
      getFeedDayHeadings(
        groups.map((group, index) =>
          index < pinnedCount ? null : getLogTimestampMs(group.logs[0]),
        ),
        now,
        intlLocale,
      ),
    [groups, pinnedCount, now, intlLocale],
  );

  const songIds = useMemo(
    () =>
      logs
        .flatMap((log) => {
          const { songId, songs } = log as {
            songId?: string;
            songs?: { songId?: string }[];
          };
          return [songId, ...(songs ?? []).map((song) => song.songId)];
        })
        .filter((id): id is string => Boolean(id)),
    [logs],
  );
  const songTiers = useSongTiers(songIds);

  const shouldHintMotivate = useMotivateHint();

  // Someone who has already motivated a visible row clearly knows the button — no need to nudge.
  useEffect(() => {
    if (!shouldHintMotivate) return;
    if (groups.some((group) => getGroupReactors(group).includes(currentUserId)))
      markMotivateHintDone();
  }, [groups, shouldHintMotivate, currentUserId]);

  // Only the topmost row the user can actually motivate gets the nudge: one glowing button reads as
  // a hint, a whole feed of them reads as noise.
  const hintGroupIndex = useMemo(() => {
    if (!shouldHintMotivate) return -1;

    return groups.findIndex(
      (group) =>
        Boolean(group.uid) &&
        group.uid !== currentUserId &&
        Boolean(getGroupReactionAnchor(group)?.id),
    );
  }, [groups, shouldHintMotivate, currentUserId]);

  return (
    <>
      <div className='mb-2 mt-4 flex flex-wrap items-center gap-x-8 gap-y-2 px-3 empty:hidden lg:flex-nowrap lg:items-stretch'>
        <OnlineUsers onOpenActivity={setPreview} />
        {showHighlights && !isMobile && (
          <CommunityHighlights
            logs={logs}
            currentUserId={currentUserId}
            className='hidden lg:grid'
          />
        )}
      </div>
      <div ref={spanRef} className='h-1' />
      {groups.map((group, groupIndex) => {
        const representative = group.logs[0];
        const key =
          (representative as any).id ||
          String(getLogTimestampMs(representative)) +
            (representative as any).uid +
            (representative as any).userName ||
          "topPlayers";
        const isNew = isNewMessage(
          (representative as any).data || (representative as any).timestamp,
        );

        return (
          <div key={key} className='mr-2'>
            {dayHeadings[groupIndex] && (
              <h3 className='mb-1 mt-6 px-1 text-[13px] font-semibold text-zinc-400 first-letter:uppercase'>
                {dayHeadings[groupIndex]}
              </h3>
            )}
            {group.type === "topPlayers" ? (
              <FirebaseLogsTopPlayersItem
                log={representative as FirebaseLogsTopPlayersInterface}
                isNew={isNew}
              />
            ) : group.type === "guildLevel" ? (
              <FirebaseLogsGuildLevelItem
                log={representative as FirebaseLogsGuildLevelInterface}
                isNew={isNew}
              />
            ) : group.type === "duelResult" ? (
              <FirebaseLogsDuelResultItem
                log={representative as FirebaseLogsDuelResultInterface}
                isNew={isNew}
                currentUserId={currentUserId}
              />
            ) : group.type === "duelWaiting" ? (
              <FirebaseLogsDuelWaitingItem
                log={representative as FirebaseLogsDuelWaitingInterface}
                isNew={isNew}
              />
            ) : group.type === "supportAsk" ? (
              <FirebaseLogsSupportAskItem
                log={representative as FirebaseLogsSupportAskInterface}
                isNew={isNew}
              />
            ) : group.type === "discordPromo" ? (
              <DiscordPromoCard
                log={representative as FirebaseLogsDiscordPromoInterface}
                isNew={isNew}
              />
            ) : group.type === "donationReceived" ? (
              <FirebaseLogsDonationItem
                logs={group.logs as FirebaseLogsDonationInterface[]}
                isNew={isNew}
                currentUserId={currentUserId}
                showMotivateHint={groupIndex === hintGroupIndex}
              />
            ) : (
              <GroupedLogItem
                group={group}
                isNew={isNew}
                currentUserId={currentUserId}
                songTiers={songTiers}
                showMotivateHint={groupIndex === hintGroupIndex}
                onPreview={setPreview}
                onViewRecording={setActiveRecordingId}
                onOpenLeaderboard={(id, title) =>
                  setLeaderboardExercise({ id, title })
                }
              />
            )}
          </div>
        );
      })}

      {hasMoreLogs && onLoadMoreLogs && (
        <div className='mt-2 flex justify-center'>
          <button
            type='button'
            onClick={onLoadMoreLogs}
            className='rounded-lg bg-zinc-800/60 px-4 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white'>
            {t("show_more")}
          </button>
        </div>
      )}

      <RecordingViewModal
        isOpen={!!activeRecordingId}
        onClose={() => setActiveRecordingId(null)}
        recordingId={activeRecordingId}
      />

      {preview && (
        <ActivityStartModal
          preview={preview}
          onClose={() => setPreview(null)}
          onStartLesson={setPracticingLesson}
        />
      )}

      {/* The same practice window the AI Coach plays lessons in: the video with a stopwatch,
          logging the time on finish. */}
      {practicingLesson && (
        <LessonPracticeModal
          lesson={{
            videoId: practicingLesson.videoId,
            title: practicingLesson.title,
            channelName: "",
            thumbnailUrl: "",
          }}
          onFinish={() => setPracticingLesson(null)}
          onClose={() => setPracticingLesson(null)}
        />
      )}

      <EarTrainingLeaderboardDialog
        isOpen={!!leaderboardExercise}
        onClose={() => setLeaderboardExercise(null)}
        exerciseId={leaderboardExercise?.id ?? ""}
        exerciseTitle={leaderboardExercise?.title ?? ""}
      />
    </>
  );
};

export default Logs;
