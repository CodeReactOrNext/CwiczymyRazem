import type {
  DragEndEvent,
  DragStartEvent} from "@dnd-kit/core";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
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
  onExploreLibrary?: () => void;
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
        <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500 text-black shadow-lg shadow-cyan-500/20">
          <Plus size={18} strokeWidth={3} />
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
  
  const [activeId, setActiveId] = useState<string | null>(null);

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
      <div className="p-3 space-y-1">
        <button
          onClick={onExploreLibrary}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 border",
            isLibraryActive 
              ? "bg-cyan-500/10 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.1)] border-cyan-500/30" 
              : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border-white/5"
          )}
        >
          <div className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
            isLibraryActive ? "bg-cyan-500/20" : "bg-zinc-800/50"
          )}>
            <Search size={16} />
          </div>
          <div className="flex-1 flex items-center justify-between">
            <div className="flex flex-col items-start leading-none">
              <span className="text-sm font-bold">Explore Library</span>
              <span className="text-[10px] opacity-60 mt-1">Discover new songs</span>
            </div>
            <ChevronRight size={14} className={cn(
              "transition-all duration-300",
              isLibraryActive ? "translate-x-0.5 opacity-100 text-cyan-400" : "opacity-20 text-zinc-500"
            )} />
          </div>
        </button>
      </div>

      <div className="px-5 py-4">
         <h2 className="text-xs font-black text-zinc-600 uppercase tracking-[0.2em]">Your collection</h2>
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
        />
        <SongStatusCard
          id="learning"
          title={t("learning", "In Progress") as string}
          songs={filteredSongs.learning}
          onStatusChange={handleStatusChange}
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

      <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: "0.5",
              },
            },
          }),
        }}>
        {activeId && activeSong && (
          <div className="w-[280px] cursor-grabbing">
             <div className="flex items-center gap-3 rounded-xl border border-cyan-500/30 bg-zinc-900/90 p-3 shadow-2xl backdrop-blur-xl">
               <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden">
                 {activeSong.coverUrl ? (
                   <img src={activeSong.coverUrl} alt="" className="h-full w-full object-cover" />
                 ) : (
                   <Music className="h-5 w-5 text-zinc-600" />
                 )}
               </div>
               <div className="flex-1 min-w-0">
                 <p className="truncate text-xs font-bold text-white">{activeSong.title}</p>
                 <p className="truncate text-[10px] text-zinc-500">{activeSong.artist}</p>
               </div>
             </div>
          </div>
        )}
      </DragOverlay>
    </div>
  );
};
