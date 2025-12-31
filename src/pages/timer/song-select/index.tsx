import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useTranslation } from "react-i18next";
import { getUserSongs } from "feature/songs/services/getUserSongs";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useAppSelector } from "store/hooks";
import { Song } from "feature/songs/types/songs.type";
import AppLayout from "layouts/AppLayout";
import { PageHeader } from "constants/PageHeader";
import { SongCard } from "feature/songs/components/SongsGrid/SongCard";
import Link from "next/link";
import { Button } from "assets/components/ui/button";
import { Music, ArrowRight } from "lucide-react";
import { withAuth } from "utils/auth/serverAuth";

import { ReactElement } from "react";
import type { NextPageWithLayout } from "types/page";

const SongSelectPage: NextPageWithLayout = () => {
    const { t } = useTranslation(["songs", "timer", "common"]);
    const router = useRouter();
    const userId = useAppSelector(selectUserAuth);
    const [songs, setSongs] = useState<Song[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSongs = async () => {
            if (!userId) return;
            try {
                const userSongs = await getUserSongs(userId);
                // Combine Want to Learn and Learning
                const combined = [...userSongs.wantToLearn, ...userSongs.learning];
                // Remove duplicates just in case
                const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
                setSongs(unique);
            } catch (error) {
                console.error("Failed to fetch songs", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSongs();
    }, [userId]);

    const handleSongSelect = (song: Song) => {
        router.push(`/timer/song/${song.id}`);
    };

    return (
        <div className="container mx-auto max-w-6xl px-4 py-8">
           <PageHeader title="Select Song to Practice" onBack={() => router.push("/timer")} />
           
           {isLoading ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                   {[...Array(6)].map((_, i) => (
                       <div key={i} className="h-40 rounded-xl bg-white/5 animate-pulse" />
                   ))}
               </div>
           ) : songs.length > 0 ? (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
                   {songs.map(song => (
                       <div key={song.id} onClick={() => handleSongSelect(song)}>
                           <SongCard 
                               song={song} 
                               onOpenDetails={() => handleSongSelect(song)}
                               // We could pass userStatus here if we calculated it, but not strictly necessary for selection
                           />
                       </div>
                   ))}
               </div>
           ) : (
               <div className="flex flex-col items-center justify-center py-20 text-center">
                   <div className="h-20 w-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                       <Music className="h-10 w-10 text-zinc-500" />
                   </div>
                   <h2 className="text-2xl font-bold text-white mb-2">Your practice list is empty</h2>
                   <p className="text-zinc-400 max-w-md mb-8">
                       Add songs to "Want to Learn" or "Learning" in your library to see them here.
                   </p>
                   <Link href="/songs?view=library">
                       <Button className="h-12 px-8 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl flex items-center gap-2">
                           Go to Library <ArrowRight className="h-4 w-4" />
                       </Button>
                   </Link>
               </div>
           )}
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
