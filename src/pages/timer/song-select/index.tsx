import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import { PageHeader } from "constants/PageHeader";
import { SongCard } from "feature/songs/components/SongsGrid/SongCard";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import type { Song, SongStatus } from "feature/songs/types/songs.type";
import { selectUserAuth } from "feature/user/store/userSlice";
import { motion } from "framer-motion";
import AppLayout from "layouts/AppLayout";
import { ArrowRight, Music, Search, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import type { ReactElement } from "react";
import { useEffect, useMemo, useState } from "react";
import { useAppSelector } from "store/hooks";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";
import { cn } from "assets/lib/utils";

const SongSelectPage: NextPageWithLayout = () => {
    const router = useRouter();
    const userId = useAppSelector(selectUserAuth);
    const [allSongs, setAllSongs] = useState<Song[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"all" | SongStatus>("all");

    useEffect(() => {
        const fetchSongs = async () => {
            if (!userId) return;
            try {
                const userSongs = await getUserSongs(userId);
                
                // Add status to each song for filtering
                const wantToLearn = userSongs.wantToLearn.map(s => ({ ...s, _status: "wantToLearn" }));
                const learning = userSongs.learning.map(s => ({ ...s, _status: "learning" }));
                const learned = userSongs.learned.map(s => ({ ...s, _status: "learned" }));
                
                const combined = [...learning, ...wantToLearn, ...learned];
                
                // Remove duplicates just in case
                const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
                setAllSongs(unique as any);
            } catch (error) {
                console.error("Failed to fetch songs", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSongs();
    }, [userId]);

    const filteredSongs = useMemo(() => {
        return allSongs.filter(song => {
            const matchesSearch = 
                song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                song.artist.toLowerCase().includes(searchQuery.toLowerCase());
            
            const matchesTab = activeTab === "all" || (song as any)._status === activeTab;
            
            return matchesSearch && matchesTab;
        });
    }, [allSongs, searchQuery, activeTab]);

    const handleSongSelect = (song: Song) => {
        router.push(`/timer/song/${song.id}`);
    };

    const tabs: { id: "all" | SongStatus; label: string }[] = [
        { id: "all", label: "All Songs" },
        { id: "learning", label: "Learning" },
        { id: "wantToLearn", label: "Want to Learn" },
        { id: "learned", label: "Learned" },
    ];

    return (
        <div className="container mx-auto max-w-6xl px-4 py-8">
            <PageHeader title="Select Song to Practice" onBack={() => router.push("/timer")} />
            
            <div className="mt-8 space-y-6">
                {/* Search and Filters */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-cyan-400 transition-colors" />
                        <Input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by title or artist..."
                            className="pl-11 h-12 bg-white/5 border-white/10 rounded-2xl focus:border-cyan-500/50 transition-all shadow-2xl"
                        />
                        {searchQuery && (
                            <button 
                                onClick={() => setSearchQuery("")}
                                className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 hover:text-white transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex p-1 bg-white/5 rounded-2xl border border-white/5 overflow-x-auto w-full md:w-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap",
                                    activeTab === tab.id 
                                        ? "bg-white text-black shadow-lg" 
                                        : "text-zinc-500 hover:text-zinc-300"
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse border border-white/5 shadow-2xl" />
                        ))}
                    </div>
                ) : filteredSongs.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredSongs.map(song => (
                            <motion.div 
                                key={song.id} 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => handleSongSelect(song)}
                                className="cursor-pointer"
                            >
                                <SongCard 
                                    song={song} 
                                    onOpenDetails={() => handleSongSelect(song)}
                                />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-700">
                        <div className="h-24 w-24 rounded-3xl bg-white/5 flex items-center justify-center mb-8 shadow-2xl border border-white/5">
                            <Music className="h-10 w-10 text-zinc-500" />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">
                            {searchQuery ? "No songs found" : "Your practice list is empty"}
                        </h2>
                        <p className="text-zinc-400 max-w-md mb-10 text-sm leading-relaxed">
                            {searchQuery 
                                ? "We couldn't find any songs matching your search. Try a different artist or title." 
                                : "Add songs to your collection in the library to start practicing them with the timer."}
                        </p>
                        {!searchQuery && (
                            <Link href="/songs?view=library">
                                <Button className="h-14 px-10 bg-white text-black hover:bg-zinc-100 font-black rounded-2xl flex items-center gap-3 transition-transform active:scale-95 shadow-2xl uppercase text-xs tracking-widest">
                                    Go to Library <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        )}
                        {searchQuery && (
                            <Button 
                                onClick={() => setSearchQuery("")}
                                variant="outline"
                                className="h-12 px-8 border-white/10 hover:bg-white/5 text-zinc-400 hover:text-white"
                            >
                                Clear Search
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

SongSelectPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId="exercise" subtitle="Select Song" variant="secondary">
      {page}
    </AppLayout>
  );
};

export default SongSelectPage;

export const getServerSideProps = withAuth({
    redirectIfUnauthenticated: "/login",
    translations: ["songs", "timer", "common"],
});
