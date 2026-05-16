import type {
  DragEndEvent,
  DragStartEvent} from "@dnd-kit/core";
import {
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "assets/components/ui/tabs";
import { cn } from "assets/lib/utils";
import { SongStatusCard } from "feature/songs/components/SongStatusCard";
import { STATUS_CONFIG } from "feature/songs/constants/statusConfig";
import { useSongsStatusChange } from "feature/songs/hooks/useSongsStatusChange";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import { updateUserSongOrder } from "feature/songs/services/updateUserSongOrder";
import type { UserSongProgress } from "feature/songs/services/userSongProgress.service";
import type { Song, SongStatus } from "feature/songs/types/songs.type";
import { getAllTiers } from "feature/songs/utils/getSongTier";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import {
  Search,
  X,
  Library,
  ChevronRight,
} from "lucide-react";
import { Music, Plus } from "lucide-react";
import Link from "next/link";
import posthog from "posthog-js";
import { useEffect, useMemo,useState } from "react";
import { useAppSelector } from "store/hooks";

interface SongLearningSectionProps {
  isLanding: boolean;
  userSongs: {
    wantToLearn: Song[];
    learning: Song[];
    learned: Song[];
  };
  onChange: ({
    wantToLearn,
    learned,
    learning,
  }: {
    wantToLearn: Song[];
    learning: Song[];
    learned: Song[];
  }) => void;
  onStatusChange?: () => void;
  progressMap?: Record<string, UserSongProgress>;
  isPremium?: boolean;
  onPracticeWithGp?: (song: Song) => void;
  onOpenDetails?: (song: Song) => void;
  onExploreLibrary?: (view: 'board' | 'explore') => void;
  isLibraryActive?: boolean;
  activeId?: string | null;
  disableDnd?: boolean;
  isMobile?: boolean;
}

const FilterBar = ({ 
  searchQuery, 
  setSearchQuery, 
  t 
}: { 
  searchQuery: string; 
  setSearchQuery: (v: string) => void; 
  t: any;
}) => {
  return (
    <div className="mb-6 px-4 shrink-0">
      <div className="relative group/search">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-3.5 w-3.5 text-zinc-600 group-focus-within/search:text-cyan-500 transition-colors" />
        </div>
        <Input 
          placeholder="Search songs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 w-full border-white/5 bg-zinc-950/40 pl-9 text-[12px] text-white placeholder:text-zinc-600 transition-all focus:border-cyan-500/30 focus:bg-zinc-950/60 focus:ring-4 focus:ring-cyan-500/5 rounded-lg"
        />
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-white/5 bg-zinc-900/10 p-12 text-center backdrop-blur-sm animate-in fade-in zoom-in duration-500">
     <div className="relative mb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-zinc-800/50 text-zinc-500">
          <Music size={40} />
        </div>
     </div>
     <h3 className="text-xl font-bold text-white mb-2">Build your practice list</h3>
     <p className="max-w-md text-sm text-zinc-400 mb-8">
       Your song board is empty. Add songs from the library to track your progress and manage your learning journey.
     </p>
      <Link href="/songs?view=library">
        <button 
          onClick={() => posthog.capture("song_management_action", { action: "browse_library_empty" })}
          className="h-12 rounded-xl bg-cyan-500 hover:bg-cyan-600 px-8 text-black font-bold transition-all active:scale-95 shadow-lg shadow-cyan-500/10"
        >
          Browse Library
        </button>
      </Link>
  </div>
);

export const SongLearningSection = ({
  userSongs,
  onChange,
  isLanding,
  onStatusChange,
  progressMap = {},
  isPremium = false,
  onPracticeWithGp,
  onOpenDetails,
  onExploreLibrary,
  isLibraryActive,
  activeId,
  disableDnd = false,
  isMobile = false,
}: SongLearningSectionProps) => {
  const { t } = useTranslation("songs");
  const userId = useAppSelector(selectUserAuth);
  const { handleStatusChange, handleSongRemoval } = useSongsStatusChange({
    onChange,
    userSongs,
    onTableStatusChange: onStatusChange,
  });
  
   // --- Filtering State ---
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilters, setTierFilters] = useState<string[]>([]);
  const _hasActiveFilters = searchQuery.length > 0 || tierFilters.length > 0;

  const filteredSongs = useMemo(() => {
    if (!userSongs) {
      return { wantToLearn: [], learning: [], learned: [] };
    }

    const query = searchQuery.toLowerCase().trim();
    const hasTierFilters = tierFilters.length > 0;

    const filterFn = (song: Song) => {
      // 1. Text Search
      const matchesSearch =
        !query ||
        song.title.toLowerCase().includes(query) ||
        song.artist.toLowerCase().includes(query);

      // 2. Tier Filter
      const matchesTier =
        !hasTierFilters || (song.tier && tierFilters.includes(song.tier));

      return matchesSearch && matchesTier;
    };

    return {
      wantToLearn: userSongs.wantToLearn.filter(filterFn),
      learning: userSongs.learning.filter(filterFn),
      learned: userSongs.learned.filter(filterFn),
    };
  }, [userSongs, searchQuery, tierFilters]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      const timer = setTimeout(() => {
        posthog.capture("song_management_action", { action: "search", query: searchQuery });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  const [activeOverContainer, setActiveOverContainer] = useState<SongStatus | null>(null);
  
  const getActiveSong = () => {
      if (!activeId) return null;
      const allSongs = [...userSongs.wantToLearn, ...userSongs.learning, ...userSongs.learned];
      return allSongs.find(s => s.id === activeId);
  }
  
  const activeSong = getActiveSong();

  if (!userId) {
    return null;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <div className="flex p-1 rounded-xl bg-zinc-900/50 border border-white/5">
          <button
            onClick={() => onExploreLibrary?.('board')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all",
              !isLibraryActive 
                ? "bg-zinc-800 text-white shadow-lg border border-white/5" 
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Music size={14} className={!isLibraryActive ? "text-cyan-500" : ""} />
            My Board
          </button>
          <button
            onClick={() => onExploreLibrary?.('explore')}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all",
              isLibraryActive 
                ? "bg-zinc-800 text-white shadow-lg border border-white/5" 
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            <Search size={14} className={isLibraryActive ? "text-cyan-500" : ""} />
            Library
          </button>
        </div>
      </div>

      <div className="px-5 py-4">
         <h2 className="text-xs font-bold text-zinc-500">Your collection</h2>
      </div>
      <FilterBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} t={t} />



      <div className="flex-1 overflow-y-auto pb-10 space-y-4 overscroll-contain scroll-smooth">
        <SongStatusCard
          id="wantToLearn"
          title={t("want_to_learn", "Want to Learn") as string}
          songs={filteredSongs.wantToLearn}
          onStatusChange={handleStatusChange}
          progressMap={progressMap}
          isPremium={isPremium}
          onPracticeWithGp={onPracticeWithGp}
          onOpenDetails={onOpenDetails}
          activeOverContainer={activeOverContainer}
          isCollapsedInitially={false}
          disableDnd={disableDnd}
          isMobile={isMobile}
          onSongRemove={handleSongRemoval}
        />
        <SongStatusCard
          id="learning"
          title={t("learning", "In Progress") as string}
          songs={filteredSongs.learning}
          onStatusChange={handleStatusChange}
          onSongRemove={handleSongRemoval}
          progressMap={progressMap}
          isPremium={isPremium}
          onPracticeWithGp={onPracticeWithGp}
          onOpenDetails={onOpenDetails}
          activeOverContainer={activeOverContainer}
          isCollapsedInitially={false}
          disableDnd={disableDnd}
          isMobile={isMobile}
        />
        <SongStatusCard
          id="learned"
          title={t("learned", "Mastered") as string}
          songs={filteredSongs.learned}
          onStatusChange={handleStatusChange}
          onSongRemove={handleSongRemoval}
          progressMap={progressMap}
          isPremium={isPremium}
          onPracticeWithGp={onPracticeWithGp}
          onOpenDetails={onOpenDetails}
          activeOverContainer={activeOverContainer}
          isCollapsedInitially={true}
          disableDnd={disableDnd}
          isMobile={isMobile}
        />
      </div>

    </div>
  );
};
