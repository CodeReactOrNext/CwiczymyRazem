import { useActivityLog } from "components/ActivityLog/hooks/useActivityLog";
import { TimeSplitterModal } from "feature/practice/components/TimeSplitterModal";
import { updateSongStatus } from "feature/songs/services/udateSongStatus";
import type { Song } from "feature/songs/types/songs.type";
import { selectCurrentUserStats, selectPreviousUserStats, selectRaitingData,selectUserAuth, selectUserAvatar } from "feature/user/store/userSlice";
import { setActivity } from "feature/user/store/userSlice";
import { updateQuestProgress,updateUserStats } from "feature/user/store/userSlice.asyncThunk";
import type { ReportFormikInterface } from "feature/user/view/ReportView/ReportView.types";
import { doc, getDoc } from "firebase/firestore";
import useTimer from "hooks/useTimer";
import { useTranslation } from "hooks/useTranslation";
import AppLayout from "layouts/AppLayout";
import RatingPopUpLayout from "layouts/RatingPopUpLayout";
import { SongTimerLayout } from "layouts/TimerLayout/SongTimerLayout";
import { useRouter } from "next/router";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "store/hooks";
import type { NextPageWithLayout } from "types/page";
import { withAuth } from "utils/auth/serverAuth";
import { convertMsToHMS } from "utils/converter";
import { db } from "utils/firebase/client/firebase.utils";

const SongPracticeTimer: NextPageWithLayout = () => {
    const router = useRouter();
    const { songId } = router.query;
    
    const timer = useTimer();
    const dispatch = useAppDispatch();
    const userId = useAppSelector(selectUserAuth);
    const userAvatar = useAppSelector(selectUserAvatar);
    const currentUserStats = useAppSelector(selectCurrentUserStats);
    const previousUserStats = useAppSelector(selectPreviousUserStats);
    const raitingData = useAppSelector(selectRaitingData);
    const { reportList } = useActivityLog(userId as string);
    const { t } = useTranslation(["timer", "common", "report"]);
    
    const [song, setSong] = useState<Song | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSplitterOpen, setIsSplitterOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

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
        if (!song || isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        
        if (markAsLearned && userId) {
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
        
        // Calculate minutes independently of Redux, ensuring precision
        const totalMinutes = Math.round((techniqueTime + hearingTime) / 60000);
        const finalTotalMinutes = totalMinutes === 0 && (techniqueTime + hearingTime) > 30000 ? 1 : totalMinutes;
        
        const tMins = Math.round(finalTotalMinutes * (techniqueTime / (techniqueTime + hearingTime || 1)));
        const hMins = finalTotalMinutes - tMins;

        const inputData: ReportFormikInterface = {
            techniqueHours: "0",
            techniqueMinutes: tMins.toString(),
            theoryHours: "0",
            theoryMinutes: "0",
            hearingHours: "0",
            hearingMinutes: hMins.toString(),
            creativityHours: "0",
            creativityMinutes: "0",
            habbits: [],
            countBackDays: 0,
            reportTitle: `${t("timer:currently_exercising")} ${song.artist} - ${song.title}`,
            avatarUrl: userAvatar ?? null,
            songId: song.id,
            songTitle: song.title,
            songArtist: song.artist,
        };

        try {
            dispatch(updateQuestProgress({ type: 'practice_any_song' }));
            await dispatch(updateUserStats({ inputData })).unwrap();
            setIsSplitterOpen(false);
            setShowSuccess(true);
        } catch (error) {
            console.error("Failed to submit report:", error);
            toast.error("Failed to save practice session");
            setIsSplitterOpen(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBack = () => {
        if (timer.time > 0 && confirm("Abandon this session?")) {
            router.push("/timer/song-select");
        } else if (timer.time === 0) {
            router.push("/timer/song-select");
        }
    };

    // Update online activity
    useEffect(() => {
        if (userId && song) {
            dispatch(setActivity({
                planTitle: "Practicing Song",
                exerciseTitle: `${song.artist} - ${song.title}`,
                category: "technique", // Songs are mostly technique
                timestamp: Date.now()
            }));
        }

        return () => {
            dispatch(setActivity(null));
        };
    }, [userId, song, dispatch]);

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
             <div className="flex h-screen items-center justify-center">
                 <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-cyan-500" />
             </div>
         );
    }

    if (showSuccess && raitingData && currentUserStats && previousUserStats) {
        return (
            <RatingPopUpLayout
                onClick={() => router.push("/dashboard")}
                ratingData={raitingData}
                currentUserStats={currentUserStats}
                previousUserStats={previousUserStats}
                activityData={reportList as any}
            />
        );
    }

    return (
        <>
            <SongTimerLayout
                timer={timer}
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
                isLoading={isSubmitting}
            />
        </>
    );
};

SongPracticeTimer.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout pageId="exercise" subtitle="Practice Song" variant="secondary">
      {page}
    </AppLayout>
  );
};

export default SongPracticeTimer;

export const getServerSideProps = withAuth({
    redirectIfUnauthenticated: "/login",
    translations: ["common", "timer", "toast", "report"],
});
