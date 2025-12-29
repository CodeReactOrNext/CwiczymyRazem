import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "assets/components/ui/sheet";
import { Button } from "assets/components/ui/button";
import { SongRating } from "feature/songs/components/SongsTable/components/SongRating";
import type { Song, SongStatus } from "feature/songs/types/songs.type";
import { getSongTier } from "feature/songs/utils/getSongTier";
import { 
  Music, 
  BookOpen, 
  CheckCircle, 
  Users, 
  ShieldCheck, 
  Star,
  Info,
  ExternalLink,
  HelpCircle,
  Loader2
} from "lucide-react";
import { cn } from "assets/lib/utils";
import { doc, getDoc, collection, query, where, getDocs, documentId } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "assets/components/ui/tooltip";
import { SpotifyPlayer } from "../SpotifyPlayer";

interface SongSheetProps {
  song: Song | null;
  isOpen: boolean;
  onClose: () => void;
  status?: SongStatus;
  onStatusChange: (status: SongStatus | undefined) => Promise<void>;
  onRatingChange: () => void;
}

interface PractitionerProfile {
  id: string;
  displayName: string;
  avatar: string;
}

const STATUS_OPTIONS = [
  { 
    id: "wantToLearn", 
    label: "Want to Learn", 
    icon: Music, 
    color: "text-blue-400", 
    bg: "bg-blue-500/10",
    desc: "Add to your bucket list"
  },
  { 
    id: "learning", 
    label: "Learning", 
    icon: BookOpen, 
    color: "text-amber-400", 
    bg: "bg-amber-500/10",
    desc: "Currently practicing"
  },
  { 
    id: "learned", 
    label: "Learned", 
    icon: CheckCircle, 
    color: "text-emerald-400", 
    bg: "bg-emerald-500/10",
    desc: "Mastered this song"
  },
];

const SongSheet = ({
  song,
  isOpen,
  onClose,
  status,
  onStatusChange,
  onRatingChange,
}: SongSheetProps) => {
  const [practitioners, setPractitioners] = useState<PractitionerProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchPractitioners = async () => {
      if (!song?.practicingUsers || song.practicingUsers.length === 0) {
        setPractitioners([]);
        return;
      }

      setIsLoadingUsers(true);
      try {
        const userIds = song.practicingUsers.slice(0, 10); // Limit to 10 for performance
        const usersRef = collection(db, "users");
        const q = query(usersRef, where(documentId(), "in", userIds));
        const snapshot = await getDocs(q);
        
        const profiles = snapshot.docs.map(d => ({
          id: d.id,
          displayName: d.data().displayName || "Unknown Musician",
          avatar: d.data().avatar || ""
        }));
        
        setPractitioners(profiles);
      } catch (error) {
        console.error("Error fetching practitioners:", error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    if (isOpen && song) {
      fetchPractitioners();
    }
  }, [isOpen, song]);

  const handleStatusUpdate = async (newStatus: SongStatus) => {
    setIsUpdatingStatus(newStatus);
    try {
      await onStatusChange(newStatus);
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  if (!song) return null;

  const avgDifficulty = song.avgDifficulty || 0;
  const tier = getSongTier(song.tier || avgDifficulty);

  return (
    <Sheet open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md border-l border-white/5 bg-zinc-950 p-0 shadow-2xl overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* Hero Section with Cover */}
          <div className="relative aspect-video w-full overflow-hidden">
            {song.coverUrl ? (
              <>
                <img 
                  src={song.coverUrl} 
                  alt={song.title} 
                  className="h-full w-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-zinc-900">
                <Music className="h-12 w-12 text-zinc-800" />
              </div>
            )}
            
            <div className="absolute bottom-6 left-6 right-6">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-black tracking-tight text-white leading-tight drop-shadow-lg">
                    {song.title}
                  </h2>
                  {song.isVerified && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <ShieldCheck className="h-5 w-5 text-cyan-500 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="bg-zinc-900 border-white/10 text-zinc-300">
                          <p>Native Verification: This song's existence is confirmed.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <p className="text-lg font-bold text-zinc-400 drop-shadow-md">{song.artist}</p>
                
                {/* Genres List */}
                {song.genres && song.genres.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {song.genres.map(g => (
                      <span key={g} className="px-2 py-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-black uppercase tracking-widest text-cyan-400">
                        {g}
                      </span>
                    ))}
                  </div>
                )}
            </div>

            <div 
              className="absolute top-6 right-12 flex h-12 w-12 items-center justify-center rounded-2xl border-2 text-lg font-black shadow-2xl backdrop-blur-xl"
              style={{
                borderColor: `${tier.color}90`,
                backgroundColor: `rgba(10, 10, 10, 0.6)`,
                color: tier.color,
              }}
            >
              {tier.tier}
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Spotify Player */}
            {song.spotifyId && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-3">Continue listening on Spotify</p>
                <SpotifyPlayer trackId={song.spotifyId} height={152} />
              </div>
            )}

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/[0.03] p-4 border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Popularity</p>
                <div className="flex items-center gap-2 text-white">
                  <Users className="h-4 w-4 text-cyan-500" />
                  <span className="text-lg font-black">{song.popularity || 0}</span>
                </div>
              </div>
              <div className="rounded-2xl bg-white/[0.03] p-4 border border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Difficulty</p>
                <div className="flex items-center gap-2 text-white">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500/20" />
                  <span className="text-lg font-black">{avgDifficulty.toFixed(1)}</span>
                </div>
              </div>
            </div>

            {/* Practitioners Section */}
            <div className="space-y-4">
               <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Who's practicing</h4>
               {isLoadingUsers ? (
                 <div className="flex gap-2">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-10 w-10 rounded-full bg-white/5 animate-pulse" />
                    ))}
                 </div>
               ) : practitioners.length > 0 ? (
                 <div className="flex flex-wrap gap-3">
                   {practitioners.map(user => (
                     <div key={user.id} className="group/user relative">
                        {user.avatar ? (
                          <img 
                            src={user.avatar} 
                            alt={user.displayName}
                            className="h-10 w-10 rounded-full border-2 border-white/10 object-cover transition-transform group-hover/user:scale-110"
                            title={user.displayName}
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/10 bg-zinc-800 text-xs font-bold text-zinc-500 transition-transform group-hover/user:scale-110">
                            {user.displayName.charAt(0)}
                          </div>
                        )}
                     </div>
                   ))}
                   {song.practicingUsers && song.practicingUsers.length > 10 && (
                     <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/10 bg-zinc-900 text-[10px] font-bold text-zinc-500">
                        +{song.practicingUsers.length - 10}
                     </div>
                   )}
                 </div>
               ) : (
                 <p className="text-[11px] font-medium text-zinc-600 italic">No one practicing yet. Be the first!</p>
               )}
            </div>

            {/* Rating Section */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3 w-3 cursor-help text-cyan-500" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-zinc-900 border-white/10 text-zinc-300">
                      <p>Rate how difficult this song is to play for you.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                Rate Playback Difficulty
              </h4>
              <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 backdrop-blur-sm transition-all hover:bg-white/[0.05]">
                <SongRating 
                  song={song} 
                  refreshTable={onRatingChange} 
                  tierColor={tier.color} 
                />
              </div>
            </div>

            {/* Status Options */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Music Library Status</h4>
              <div className="grid gap-2">
                {STATUS_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  const isActive = status === opt.id;
                  const isPending = isUpdatingStatus === opt.id;

                  return (
                    <button
                      key={opt.id}
                      disabled={!!isUpdatingStatus}
                      onClick={() => handleStatusUpdate(opt.id as SongStatus)}
                      className={cn(
                        "flex items-center justify-between rounded-xl p-4 transition-all active:scale-[0.98]",
                        "border border-white/5 bg-zinc-900/60 hover:bg-white/5",
                        isActive ? "ring-2 ring-cyan-500 border-transparent bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.15)]" : "",
                        isUpdatingStatus && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-xl bg-black/40 transition-colors", 
                          isActive ? opt.color : "text-zinc-600",
                          opt.id === "remove" && !isActive && "group-hover/remove:text-red-400"
                        )}>
                          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                        </div>
                        <div className="text-left">
                          <p className={cn(
                            "text-xs font-black uppercase tracking-widest transition-colors", 
                            isActive ? "text-white" : "text-zinc-400",
                            opt.id === "remove" && !isActive && "group-hover/remove:text-red-300"
                          )}>
                            {opt.label}
                          </p>
                          <p className="text-[10px] font-medium text-zinc-600">{opt.desc}</p>
                          
                          {/* Active Indicator Underline */}
                          {isActive && (
                            <motion.div 
                              layoutId="activeStatus"
                              className="mt-1 h-0.5 w-8 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" 
                            />
                          )}
                        </div>
                      </div>
                      {isActive && !isPending && <CheckCircle className="h-4 w-4 text-cyan-500" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-white/5 bg-zinc-950/80 backdrop-blur-xl">
          <Button 
              onClick={onClose}
              className="h-14 w-full rounded-2xl bg-zinc-900 border border-white/5 font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-cyan-400 hover:bg-zinc-800 transition-all shadow-2xl"
          >
            Finished
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SongSheet;
