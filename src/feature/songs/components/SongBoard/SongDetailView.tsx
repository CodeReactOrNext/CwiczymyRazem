import { useQueryClient } from "@tanstack/react-query";
import { Button, PRESSABLE_KEY } from "assets/components/ui/button";
import { Chip } from "assets/components/ui/chip";
import { Textarea } from "assets/components/ui/textarea";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "assets/components/ui/tooltip";
import { cn } from "assets/lib/utils";
import { BackLink } from "components/BackLink/BackLink";
import { ConfirmDialog } from "components/ConfirmDialog/ConfirmDialog";
import { GuitarPatternBackground } from "components/GuitarPatternBackground/GuitarPatternBackground";
import { Segment, SegmentGroup } from "components/SegmentedControl/SegmentedControl";
import Avatar from "components/UI/Avatar/Avatar";
import { SongRecordingsSection } from "feature/recordings/components/SongRecordingsSection";
import { ArrangementStrip } from "feature/songs/components/Arrangements/ArrangementStrip";
import { SongPartMarks } from "feature/songs/components/SongPartMarks/SongPartMarks";
import { MasteryBadge } from "feature/songs/components/SongSections/MasteryBadge";
import { STATUS_CONFIG } from "feature/songs/constants/statusConfig";
import { useVerifiedSongSectionMaps } from "feature/songs/hooks/useVerifiedSongSectionMaps";
import { getUserSongMeta, saveUserSongMeta } from "feature/songs/services/songSections.service";
import type { Song, SongArrangement, SongPart } from "feature/songs/types/songs.type";
import type { MasteryLevel,SongSection } from "feature/songs/types/songSection.type";
import { MASTERY_LABELS } from "feature/songs/types/songSection.type";
import {
  ARRANGEMENT_META,
  getSectionMastery,
  getSectionsMasteryPct,
  setSectionMastery,
} from "feature/songs/utils/arrangements.utils";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { SONG_COVER_STYLE, songCoverLayoutId } from "feature/songs/utils/songCoverLayout";
import { selectUserAuth } from "feature/user/store/userSlice";
import { rateSong } from "feature/user/store/userSlice.asyncThunk";
import { updateQuestProgress } from "feature/user/store/userSlice.questActions";
import { collection, documentId, getDocs, query, where } from "firebase/firestore";
import { motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { readableText } from "lib/colorTheme/colorTheme";
import { useIntlLocale } from "lib/i18n/dateLocale";
import { transitions } from "lib/motion/motion";
import { useSharedElement } from "lib/motion/useSharedElement";
import type { LucideIcon } from "lucide-react";
import {
  Check,
  FileText,
  ListMusic,
  MessageSquare,
  Music,
  Play,
  Plus,
  Save,
  Sparkles,
  Star,
  Target,
  Trash2,
  TrendingUp,
  Users} from "lucide-react";
import { useRouter } from "next/router";
import type { ReactNode } from "react";
import { useEffect, useMemo,useState } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { db } from "utils/firebase/client/firebase.utils";

import { TierBadge } from "../SongsGrid/TierBadge";
import { SpotifyPlayer } from "../SpotifyPlayer";

interface SongDetailViewProps {
  song: Song;
  progress: any; 
  status: any; 
  onPractice: (song: Song) => void;
  onRemove: (songId: string) => void;
  onStatusChange: (songId: string, status: any, title: string, artist: string) => void;
  /** `arrangement` set = the marks of that arrangement; unset = the song-level marks. */
  onPartsChange?: (songId: string, parts: SongPart[], arrangement?: SongArrangement | null) => void;
  onBack?: () => void;
  /** Text on the back button. Defaults to the library context. */
  backLabel?: string;
  /** Show the back button on desktop too (used when the detail is nested, e.g. inside a playlist). */
  showBackOnDesktop?: boolean;
}

const StarRatingDisplay = ({ rating, color, size = 12, onRate }: { rating: number; color: string; size?: number; onRate?: (rating: number) => void }) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  return (
    <div className="flex flex-wrap items-center justify-end gap-1 group/stars">
      {[...Array(10)].map((_, i) => {
        const starValue = i + 1;
        const isActive = hoverRating !== null ? starValue <= hoverRating : starValue <= Math.round(rating);
        
        return (
          <Star 
            key={i} 
            size={size} 
            onClick={() => onRate?.(starValue)}
            onMouseEnter={() => onRate && setHoverRating(starValue)}
            onMouseLeave={() => onRate && setHoverRating(null)}
            className={cn(
              "transition-all",
              onRate ? "cursor-pointer active:scale-90" : "",
              isActive ? "opacity-100 fill-current" : "opacity-20 text-zinc-600"
            )}
            style={isActive ? { color } : {}}
          />
        );
      })}
    </div>
  );
};

const InfoRow = ({ label, value, icon: Icon }: { label: string; value: ReactNode; icon: LucideIcon }) => (
  <div className="flex items-center justify-between gap-4 py-1.5">
    <div className="flex min-w-0 items-center gap-3">
       <Icon className="h-4 w-4 shrink-0 text-zinc-500" />
       <span className="text-sm text-zinc-400">{label}</span>
    </div>
    <span className="max-w-[160px] truncate text-right text-sm font-semibold tabular-nums text-zinc-100">{value}</span>
  </div>
);

/** One header for every card on this page: grey icon, light label, optional right side. */
const CardHeader = ({ icon: Icon, title, children }: { icon: LucideIcon; title: ReactNode; children?: ReactNode }) => (
  <div className="flex items-center justify-between gap-3">
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-zinc-500" />
      <span className="text-sm font-semibold text-zinc-200">{title}</span>
    </div>
    {children}
  </div>
);

export const SongDetailView = ({ song, progress, status, onPractice, onRemove, onStatusChange, onPartsChange, onBack, backLabel, showBackOnDesktop = false }: SongDetailViewProps) => {
  const { t } = useTranslation("songs");
  const intlLocale = useIntlLocale();
  const { layoutDependency, runAfterSnapshot } = useSharedElement();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const userAuth = useAppSelector(selectUserAuth);
  const { bySongId: verifiedSectionMaps } = useVerifiedSongSectionMaps();
  const communityMap = verifiedSectionMaps.get(song.id);
  const [isRating, setIsRating] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [sections, setSections] = useState<SongSection[]>([]);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [raterProfiles, setRaterProfiles] = useState<Record<string, { displayName: string; avatar: string; lvl: number }>>({});
  
  const [optimisticRating, setOptimisticRating] = useState<number | null>(null);
  // Keyed by song so switching songs falls back to the whole-song view
  // without a reset effect.
  const [arrangementPick, setArrangementPick] = useState<{
    songId: string;
    arrangement: SongArrangement | null;
  } | null>(null);
  const selectedArrangement =
    arrangementPick?.songId === song.id ? arrangementPick.arrangement : null;
  const arrangementParts = selectedArrangement
    ? progress?.arrangements?.[selectedArrangement]?.parts
    : progress?.parts;
  const selectedParts = useMemo<SongPart[]>(() => arrangementParts ?? [], [arrangementParts]);

  const avgDifficulty = song.avgDifficulty || 0;
  const persistedRating = song.difficulties?.find(d => d.userId === userAuth)?.rating;
  // Show the optimistic value immediately, fall back to what the store has persisted.
  const userRating = optimisticRating ?? persistedRating;
  const tier = getSongTier(song.tier || avgDifficulty);

  // Reset the optimistic override when switching to a different song,
  // otherwise the previous song's rating would linger in the box.
  useEffect(() => {
    setOptimisticRating(null);
  }, [song.id]);

  // Once the store catches up with our optimistic value, drop the local override.
  useEffect(() => {
    if (optimisticRating !== null && persistedRating === optimisticRating) {
      setOptimisticRating(null);
    }
  }, [persistedRating, optimisticRating]);

  const handleRate = async (rating: number) => {
    if (!userAuth || !song.id || isRating) return;
    const isNewRating = !persistedRating;
    setIsRating(true);
    setOptimisticRating(rating);
    try {
      await dispatch(rateSong({
        songId: song.id,
        rating,
        title: song.title,
        artist: song.artist,
        tier: tier.tier
      }));
      if (isNewRating) {
        dispatch(updateQuestProgress({ type: 'rate_song' }));
        dispatch(updateQuestProgress({ type: 'rate_multiple_songs' }));
      }
      // Drop the cached song lists so re-opening this song shows the fresh rating
      // instead of a stale snapshot (react-query caches songs for 5 min).
      queryClient.invalidateQueries({ queryKey: ["songs"] });
      queryClient.invalidateQueries({ queryKey: ["user-songs"] });
    } catch (error) {
      console.error("Error rating song:", error);
      setOptimisticRating(null); // rollback on failure
    } finally {
      setIsRating(false);
    }
  };

  useEffect(() => {
    if (userAuth && song.id) {
      getUserSongMeta(userAuth, song.id).then(meta => {
        setSections(meta.sections || []);
        setNotes(meta.notes || "");
      });
    }
  }, [userAuth, song.id]);

  useEffect(() => {
    if (!userAuth || !song.id) return;
    
    const timeout = setTimeout(async () => {
      setIsSaving(true);
      try {
        await saveUserSongMeta(userAuth, song.id, {
          notes,
          sections,
        });
      } finally {
        setIsSaving(false);
      }
    }, 1500);

    return () => clearTimeout(timeout);
  }, [notes, sections, userAuth, song.id]);

  useEffect(() => {
    const fetchRaterProfiles = async () => {
      const raters = song.difficulties?.map(d => d.userId) || [];
      if (raters.length === 0) return;

      try {
        const uniqueRaters = Array.from(new Set(raters)).slice(0, 10);
        const usersRef = collection(db, "users");
        const q = query(usersRef, where(documentId(), "in", uniqueRaters));
        const snapshot = await getDocs(q);
        
        const profiles: Record<string, any> = {};
        snapshot.docs.forEach(d => {
          const data = d.data();
          profiles[d.id] = {
            displayName: data.displayName || "Musician",
            avatar: data.avatar || "",
            lvl: data.lvl || 0
          };
        });
        setRaterProfiles(profiles);
      } catch (error) {
        console.error("Error fetching rater profiles:", error);
      }
    };

    fetchRaterProfiles();
  }, [song.difficulties]);

  const masteryData = useMemo(() => {
    if (!sections || sections.length === 0) return null;
    const levels = sections.map((s) => getSectionMastery(s, selectedArrangement));
    const totalSections = sections.length;
    const masteredCount = levels.filter((level) => level === 3).length;
    const counts = ([0, 1, 2, 3] as MasteryLevel[]).map(level => ({
      level,
      name: MASTERY_LABELS[level],
      value: levels.filter((l) => l === level).length
    })).filter(c => c.value > 0);

    const progressPct = getSectionsMasteryPct(sections, selectedArrangement) ?? 0;

    return { counts, progressPct, totalSections, masteredCount };
  }, [sections, selectedArrangement]);

  const handleSectionMasteryChange = (id: string, mastery: MasteryLevel) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? setSectionMastery(s, selectedArrangement, mastery) : s))
    );
  };

  // Auto-mark the coarse "can play" flags once section mastery implies them:
  // any mastered section counts as a riff/fragment, a mastered section named
  // "solo" covers the solo mark, and mastering every section covers the whole song.
  // Scoped to the arrangement on screen — mastering the lead's solo marks the lead.
  useEffect(() => {
    if (!onPartsChange || !status || sections.length === 0) return;
    const isMastered = (s: SongSection) => getSectionMastery(s, selectedArrangement) === 3;
    const impliedParts = new Set<SongPart>(selectedParts);

    if (sections.some(isMastered)) impliedParts.add("riff");
    if (sections.some((s) => isMastered(s) && s.name.toLowerCase().includes("solo"))) {
      impliedParts.add("solo");
    }
    if (sections.every(isMastered)) impliedParts.add("wholeSong");

    if (impliedParts.size > selectedParts.length) {
      onPartsChange(song.id, Array.from(impliedParts), selectedArrangement);
    }
  }, [sections, selectedParts, selectedArrangement, onPartsChange, status, song.id]);

  const totalHours = progress ? Math.floor(progress.totalPracticeMs / 3600000) : 0;
  const totalMinutes = progress ? Math.floor((progress.totalPracticeMs % 3600000) / 60000) : 0;

  return (
    <div className="relative w-full flex flex-col">
      {/* Header Section */}
      <div className="relative shrink-0 overflow-hidden bg-zinc-900/50">
         <div className="absolute inset-0 overflow-hidden">
            {song.coverUrl && (
              <img src={song.coverUrl} className="w-full h-full object-cover blur-xl opacity-30" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
         </div>

         {/* Back button — mobile always; desktop only when nested (e.g. inside a playlist) */}
         {onBack && (
           <div className={cn("relative z-20 pt-4 px-4", !showBackOnDesktop && "xl:hidden")}>
              <BackLink
                label={backLabel ?? t("detail.back_to_library")}
                onClick={() => runAfterSnapshot(onBack)}
              />
           </div>
         )}

         <div className="relative flex flex-row items-center p-6 md:p-8 gap-5 md:gap-8">
            {/* Shares its layoutId with the cover in the row/card that opened it:
                the small cover grows into this one, and shrinks back on close. */}
            <motion.div
              layoutId={songCoverLayoutId(song.id)}
              layoutDependency={layoutDependency}
              transition={transitions.move}
              style={SONG_COVER_STYLE}
              className="h-20 w-20 sm:h-32 sm:w-32 md:h-36 md:w-36 shrink-0 overflow-hidden shadow-2xl bg-zinc-900"
            >
              {song.coverUrl ? (
                <img src={song.coverUrl} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                   <Music className="h-8 w-8 sm:h-10 sm:w-10 text-zinc-700" />
                </div>
              )}
            </motion.div>

            <div className="flex min-w-0 flex-1 flex-col items-start gap-2 text-left">
               <Chip color='gray' size='sm' className="capitalize">
                 {song.genres?.[0] || t("detail.guitar_track")}
               </Chip>
               <div className="flex flex-col gap-1">
                 <h2 className="font-display text-xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl md:text-4xl">{song.title}</h2>
                 <p className="text-sm font-semibold text-zinc-400 sm:text-lg">{song.artist}</p>
               </div>
            </div>

            <div className="shrink-0 hidden sm:flex">
               <TierBadge song={song} className="h-16 w-16 md:h-20 md:w-20" />
            </div>
         </div>

         <div className="relative flex flex-col gap-6 px-6 pb-8 md:px-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex w-full flex-col gap-6 sm:flex-row sm:items-center sm:gap-10 lg:w-auto">
               {/* Primary Action Button */}
               <Button
                 onClick={() => {
                   if (!status) {
                     onStatusChange(song.id, "wantToLearn", song.title, song.artist);
                   } else {
                     onPractice(song);
                   }
                 }}
                 size="xl"
                 className="w-full sm:w-auto"
               >
                 {status
                   ? <Play className="fill-current" />
                   : <Music />}
                 <span>{status ? "Start practice" : "Add to library"}</span>
               </Button>

               {/* Steam-style Info Boxes */}
               <div className="grid grid-cols-3 gap-8 sm:flex">
                  <div className="flex flex-col gap-1">
                     <span className="text-xs text-zinc-400">{t("board.sessions")}</span>
                     <span className="text-base font-semibold tabular-nums text-zinc-100">{progress?.sessionCount || 0}</span>
                  </div>

                  <div className="flex flex-col gap-1">
                     <span className="text-xs text-zinc-400">{t("detail.last_practiced")}</span>
                     <span className="text-base font-semibold tabular-nums text-zinc-100">
                        {progress?.lastPracticedAt ? progress.lastPracticedAt.toLocaleDateString(intlLocale) : t("detail.never")}
                     </span>
                  </div>

                  <div className="flex flex-col gap-1">
                     <span className="text-xs text-zinc-400">{t("board.play_time")}</span>
                     <span className="text-base font-semibold tabular-nums text-zinc-100">{totalHours}h {totalMinutes} min</span>
                  </div>
               </div>
            </div>

            <div className="flex items-center gap-3 lg:justify-end">
               <SegmentGroup aria-label={t("add_modal.title_status")}>
                  {(["wantToLearn", "learning", "learned"] as const).map((s) => {
                    const config = STATUS_CONFIG[s];
                    const Icon = config.icon;
                    const isActive = status === s;

                    return (
                      <TooltipProvider key={s} delayDuration={150}>
                        <Tooltip>
                          {/* Segment doesn't forward the trigger's handlers, so a span carries them. */}
                          <TooltipTrigger asChild>
                            <span className="inline-flex">
                              <Segment
                                active={isActive}
                                onClick={() => onStatusChange(song.id, s, song.title, song.artist)}
                                className="w-11 justify-center px-0 sm:w-[34px]">
                                <Icon size={18} className={isActive ? config.color : undefined} />
                                <span className="sr-only">{t(`status.${s}` as any)}</span>
                              </Segment>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p className="text-xs font-bold">{t(`status.${s}` as any)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
               </SegmentGroup>

               <Button
                 onClick={() => setShowRemoveConfirm(true)}
                 variant="ghost"
                 size="icon"
                 aria-label={t("detail.remove_title")}
                 className="text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400"
               >
                 <Trash2 size={16} />
               </Button>

               <ConfirmDialog
                 open={showRemoveConfirm}
                 onOpenChange={setShowRemoveConfirm}
                 title={t("detail.remove_title")}
                 description={t("detail.remove_body")}
                 cancelLabel={t("cancel")}
                 confirmLabel={t("sortable.remove")}
                 onConfirm={() => {
                   setShowRemoveConfirm(false);
                   onRemove(song.id);
                 }}
                 destructive
               />
            </div>
         </div>
      </div>

      {/* Content Section */}
      <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8">
         {status && (
           <ArrangementStrip
             progress={progress}
             sections={sections}
             selected={selectedArrangement}
             onSelect={(arrangement) => setArrangementPick({ songId: song.id, arrangement })}
           />
         )}

         {/* Spotify Preview */}
         {song.spotifyId && (
           <div className="max-w-md animate-in fade-in slide-in-from-top-4 duration-slow">
             <div className="rounded-lg bg-zinc-800/40 p-1">
                <SpotifyPlayer trackId={song.spotifyId} height={80} />
             </div>
           </div>
         )}

         {/* Second Row: Detailed Info & Progress */}
         <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">

            {/* Column 1: Your Progress */}
            <div className="flex flex-col gap-6 rounded-lg bg-zinc-800/40 p-6">
               <CardHeader icon={TrendingUp} title={t("your_progress")} />

               <TooltipProvider>
                  <Tooltip>
                     <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between gap-3">
                           <p className="text-sm text-zinc-400">{t("detail.my_rating")}</p>
                           {isRating ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                                 <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-500" />
                                 {t("detail.saving")}
                              </span>
                           ) : userRating !== undefined ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                                 <Check size={12} strokeWidth={3} />
                                 {t("detail.rated")}
                              </span>
                           ) : (
                              <span className="text-xs text-zinc-500">{t("detail.set_rating")}</span>
                           )}
                        </div>
                        <TooltipTrigger asChild>
                           <div className="-mx-1 flex cursor-pointer flex-wrap items-center justify-between gap-3 rounded-lg px-1 py-1 transition-colors hover:bg-white/5">
                              <span className={cn(
                                 "shrink-0 text-4xl font-extrabold leading-none transition-colors",
                                 userRating !== undefined ? "text-white" : "text-zinc-600"
                              )}>
                                 {userRating !== undefined ? userRating : "--"}
                              </span>
                              <StarRatingDisplay
                                 rating={userRating || 0}
                                 color={userRating !== undefined ? getSongTier(userRating).color : "#52525b"}
                                 size={16}
                                 onRate={handleRate}
                              />
                           </div>
                        </TooltipTrigger>
                     </div>
                     <TooltipContent>
                        {userRating !== undefined
                           ? t("detail.rated_tooltip", { rating: userRating })
                           : t("detail.rate_tooltip")}
                     </TooltipContent>
                  </Tooltip>
               </TooltipProvider>

               <div className="flex flex-col">
                  <InfoRow label={t("detail.mastery_progress")} value={`${song.masteryProgress || 0}%`} icon={Target} />
                  <InfoRow label={t("detail.attached_file")} value={progress?.gpFileName || t("detail.none")} icon={FileText} />
               </div>
            </div>

            {/* Column 2: Song Info */}
            <div className="flex flex-col gap-6 rounded-lg bg-zinc-800/40 p-6">
               <CardHeader icon={Music} title={t("detail.song_data")} />

               <div className="flex flex-col">
                  <InfoRow label={t("detail.total_sections")} value={song.totalSections || 0} icon={FileText} />
                  <InfoRow label={t("detail.practicing_users")} value={song.practicingUsers?.length || 0} icon={Users} />
               </div>
            </div>

            {/* Column 3: Community & Ratings */}
            <div className="flex flex-col gap-6 rounded-lg bg-zinc-800/40 p-6">
               <CardHeader icon={Star} title={t("detail.community_ratings")} />

               <div className="flex flex-col gap-3">
                  <p className="text-sm text-zinc-400">{t("detail.avg_difficulty")}</p>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                     <div className="flex shrink-0 items-center gap-3">
                        <TierBadge song={song} className="h-8 w-8 rounded text-sm" />
                        <span className="text-4xl font-extrabold leading-none text-white">{avgDifficulty.toFixed(1)}</span>
                     </div>
                     <StarRatingDisplay rating={avgDifficulty} color={tier.color} size={16} />
                  </div>
               </div>

               <div className="flex-1">
                  <div className="flex flex-wrap gap-3">
                     {song.difficulties && song.difficulties.length > 0 ? (
                       song.difficulties.slice(0, 15).map((diff, i) => {
                         const profile = raterProfiles[diff.userId];
                         const raterTier = getSongTier(diff.rating);
                         
                         return (
                           <div key={diff.userId || i} className="relative group/avatar hover:z-20">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="relative">
                                       <Avatar
                                         name={profile?.displayName || t("detail.musician")}
                                         avatarURL={profile?.avatar}
                                         size="sm"
                                       />
                                       <div
                                         className="absolute -bottom-1.5 -right-1.5 z-20 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[11px] font-bold shadow-lg ring-2 ring-zinc-900"
                                         style={{ backgroundColor: raterTier.color, color: "#09090b" }}
                                       >
                                         {diff.rating}
                                       </div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="tooltip-ink p-3">
                                    <div className="space-y-1">
                                       <p className="text-xs font-black">{profile?.displayName || t("detail.unknown_musician")}</p>
                                       <p className="text-xs text-black/60">{t("detail.rating_label")} <span className="font-bold" style={{ color: readableText(raterTier.color) }}>{diff.rating}/10</span></p>
                                       <p className="text-xs text-black/60">{t("detail.tier_label")} <span className="font-bold" style={{ color: readableText(raterTier.color) }}>{raterTier.label}</span></p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                           </div>
                         );
                       })
                     ) : (
                       <p className="text-sm text-zinc-500">{t("detail.no_ratings")}</p>
                     )}
                     {song.difficulties && song.difficulties.length > 15 && (
                       <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-[11px] font-semibold text-zinc-400">
                         +{song.difficulties.length - 15}
                       </div>
                     )}
                  </div>
               </div>


            </div>
         </div>

         {/* Recordings for this song */}
         <SongRecordingsSection songId={song.id} songTitle={song.title} songArtist={song.artist} />

         {/* Full Width Bottom: Integrated Mastery Timeline Box */}
         <div className="rounded-lg bg-zinc-800/40 p-6 animate-in fade-in slide-in-from-bottom-4 duration-slow">
             {/* Mastery Summary (Timeline) */}
             <div className="flex w-full flex-col gap-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                   <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
                         {selectedArrangement && (
                           <span
                             aria-hidden
                             className={cn("h-2 w-2 rounded-full", ARRANGEMENT_META[selectedArrangement].dot)}
                           />
                         )}
                         {selectedArrangement
                           ? t("detail.arrangement_mastery", {
                               arrangement: t(
                                 `arrangements.${selectedArrangement}.label`,
                                 ARRANGEMENT_META[selectedArrangement].label,
                               ),
                             })
                           : t("detail.song_mastery")}
                      </span>
                      <p className="text-xs text-zinc-500">
                         {masteryData ? t("detail.progression") : t("detail.map_to_track")}
                      </p>
                   </div>
                   <div className="flex items-center gap-4">
                      {masteryData && (
                        <span className="text-sm font-semibold tabular-nums text-zinc-300">
                           {t("detail.sections_progress", {
  done: masteryData.masteredCount,
  total: masteryData.totalSections,
  pct: masteryData.progressPct,
})}
                        </span>
                      )}
                      {status && (
                        <SongPartMarks
                           parts={selectedParts}
                           onChange={
                             onPartsChange
                               ? (parts) => onPartsChange(song.id, parts, selectedArrangement)
                               : undefined
                           }
                           size="lg"
                        />
                      )}
                   </div>
                </div>

                {!masteryData && (
                  <div className="relative overflow-hidden rounded-lg bg-gradient-to-b from-cyan-500/[0.07] to-transparent">
                     <div className="pointer-events-none absolute inset-0">
                        <div className="absolute left-1/2 top-0 h-28 w-[32rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-cyan-500/10 blur-3xl" />
                        <GuitarPatternBackground opacity={0.025} scale={0.75} />
                     </div>

                     <div className="relative z-10 flex flex-col items-center gap-3 px-6 py-6 text-center sm:py-7">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-500/10">
                           <ListMusic className="h-5 w-5 text-cyan-400" />
                        </div>

                        <div className="space-y-1">
                           <p className="text-base font-bold text-white">{t("detail.unlock_sections")}</p>
                           <p className="max-w-sm text-sm text-zinc-400">
                              {t("detail.unlock_sections_body")}
                           </p>
                        </div>

                        <Button
                           onClick={() => router.push(`/timer/song/${song.id}`)}
                           size="lg"
                           className="mt-1"
                        >
                           <ListMusic />
                           {t("detail.map_song")}
                        </Button>

                        {communityMap && (
                          <div className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300">
                             <Sparkles className="h-3.5 w-3.5 shrink-0" />
                             {t("detail.community_mapped", { count: communityMap.contributorCount })}
                          </div>
                        )}
                     </div>
                  </div>
                )}

                {masteryData && (
                  <div className="flex w-full flex-col gap-2">
                     {sections
                       .slice()
                       .sort((a, b) => a.startTime - b.startTime)
                       .map((s) => (
                         <div
                           key={s.id}
                           className={cn(
                             "flex items-center gap-3 rounded-lg px-4 py-3 transition-colors",
                             getSectionMastery(s, selectedArrangement) === 3 ? "bg-green-500/[0.07]" : "bg-zinc-900/60"
                           )}
                         >
                            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                            <span className="flex-1 truncate text-sm font-semibold text-zinc-200">{s.name}</span>
                            <MasteryBadge
                               mastery={getSectionMastery(s, selectedArrangement)}
                               onChange={(m) => handleSectionMasteryChange(s.id, m)}
                            />
                         </div>
                       ))}

                     <button
                        type="button"
                        onClick={() => router.push(`/timer/song/${song.id}`)}
                        className={cn(PRESSABLE_KEY, "mt-1 flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-800 py-3 text-sm font-semibold text-zinc-300 transition-colors hover:bg-zinc-700")}
                     >
                        <Plus className="h-4 w-4" />
                        {t("detail.add_section")}
                     </button>
                  </div>
                )}
             </div>
           </div>

         {/* Practice Notes — its own card, not nested inside the mastery box */}
         <div className="flex flex-col gap-4 rounded-lg bg-zinc-800/40 p-6">
            <CardHeader icon={MessageSquare} title={t("detail.practice_notes")}>
               <div className="flex items-center gap-3">
                  {isSaving && (
                     <div className="flex animate-pulse items-center gap-1.5">
                        <Save size={12} className="text-zinc-500" />
                        <span className="text-xs text-zinc-500">{t("detail.saving")}</span>
                     </div>
                  )}
                  <span className={cn(
                    "text-xs tabular-nums",
                    notes.length > 450 ? "text-amber-500" : "text-zinc-500"
                  )}>
                    {t("detail.characters", { count: notes.length })}
                  </span>
               </div>
            </CardHeader>

            <Textarea
               value={notes}
               onChange={(e) => {
                 if (e.target.value.length <= 500) {
                    setNotes(e.target.value);
                 }
               }}
               placeholder={t("detail.notes_placeholder")}
               className="min-h-[160px] resize-none p-4 leading-relaxed"
            />
         </div>
      </div>
    </div>
  );
};
