import { selectTimerData, updateTimerTime } from "feature/user/store/userSlice";
import useTimer from "hooks/useTimer";
import { SongTimerLayout } from "layouts/TimerLayout/SongTimerLayout";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { convertMsToHMS } from "utils/converter";
import AppLayout from "layouts/AppLayout";
import { withAuth } from "utils/auth/serverAuth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import type { Song } from "feature/songs/types/songs.type";
import { TimeSplitterModal } from "feature/practice/components/TimeSplitterModal";
import { toast } from "sonner";
import { selectUserAuth, selectUserAvatar } from "feature/user/store/userSlice";
import { updateSongStatus } from "feature/songs/services/udateSongStatus";

const SongPracticeTimer: NextPage = () => {
    const router = useRouter();
    const { songId } = router.query;
    
    const timer = useTimer();
    const dispatch = useAppDispatch();
    const timerData = useAppSelector(selectTimerData);
    const userId = useAppSelector(selectUserAuth);
    const userAvatar = useAppSelector(selectUserAvatar);
    const { t } = useTranslation(["timer", "common"]);
    
    const [song, setSong] = useState<Song | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSplitterOpen, setIsSplitterOpen] = useState(false);

    useEffect(() => {
        const fetchSong = async () => {
            if (!songId || typeof songId !== 'string') return;
            try {
                const docRef = doc(db, "songs", songId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setSong({ id: docSnap.id, ...docSnap.data() } as Song);
                } else {
                    toast.error("Song not found");
                    router.push("/timer/song-select");
                }
            } catch (error) {
                console.error("Error fetching song:", error);
                toast.error("Failed to load song");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSong();
    }, [songId, router]);

    const timerSubmitHandler = () => {
        timer.stopTimer();
        if (timer.time < 1000) {
            toast.warning("Practice more than 1 second to save!");
            return;
        }
        setIsSplitterOpen(true);
    };

    const handleConfirmSplit = async (hearingTime: number, techniqueTime: number, markAsLearned: boolean) => {
        if (hearingTime > 0) {
            dispatch(updateTimerTime({ type: "hearing", time: hearingTime }));
        }
        if (techniqueTime > 0) {
            dispatch(updateTimerTime({ type: "technique", time: techniqueTime }));
        }
        
        if (markAsLearned && userId && song) {
            try {
                 await updateSongStatus(
                     userId,
                     song.id,
                     song.title,
                     song.artist,
                     "learned",
                     userAvatar || "" 
                 );
                 toast.success("Song marked as learned!");
            } catch (error) {
                console.error("Failed to update song status", error);
                toast.error("Failed to mark as learned");
            }
        }
        
        setIsSplitterOpen(false);
        router.push("/report");
    };

    const handleBack = () => {
        if (timer.time > 0 && confirm("Abandon this session?")) {
            router.push("/timer/song-select");
        } else if (timer.time === 0) {
            router.push("/timer/song-select");
        }
    };

    // Update document title
    useEffect(() => {
        if (timer.timerEnabled && song) {
            document.title = `${convertMsToHMS(timer.time)} - ${song.title}`;
        } else {
            document.title = "Practice Song - Riff Quest";
        }
        return () => { document.title = "Riff Quest"; };
    }, [timer.time, timer.timerEnabled, song]);

    if (isLoading || !song) {
         return (
             <AppLayout pageId="exercise" subtitle="Loading..." variant="secondary">
                 <div className="flex h-screen items-center justify-center">
                     <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-cyan-500" />
                 </div>
             </AppLayout>
         );
    }

    return (
        <AppLayout pageId="exercise" subtitle="Practice Song" variant="secondary">
            <SongTimerLayout
                timer={timer}
                timerData={timerData}
                song={song}
                timerSubmitHandler={timerSubmitHandler}
                onBack={handleBack}
            />
            
            <TimeSplitterModal 
                isOpen={isSplitterOpen}
                totalTime={timer.time}
                songTitle={song.title}
                onConfirm={handleConfirmSplit}
                onCancel={() => setIsSplitterOpen(false)}
            />
        </AppLayout>
    );
};

export default SongPracticeTimer;

export const getServerSideProps = withAuth({
    redirectIfUnauthenticated: "/login",
    translations: ["common", "timer", "toast"],
});
