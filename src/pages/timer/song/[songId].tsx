import { useActivityLog } from "components/ActivityLog/hooks/useActivityLog";
import { TimeSplitterModal } from "feature/practice/components/TimeSplitterModal";
import { updateSongStatus } from "feature/songs/services/udateSongStatus";
import type { Song } from "feature/songs/types/songs.type";
import { selectCurrentUserStats, selectPreviousUserStats, selectRaitingData,selectUserAuth, selectUserAvatar } from "feature/user/store/userSlice";
import { setActivity } from "feature/user/store/userSlice";
import { updateUserStats } from "feature/user/store/userSlice.asyncThunk";
import { updateQuestProgress } from "feature/user/store/userSlice.questActions";
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
        if (timer.getTime() < 1000) {
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
            reportTitle: `Song: ${song.artist} - ${song.title}`,
            avatarUrl: userAvatar ?? null,
            songId: song.id,
            songTitle: song.title,
            songArtist: song.artist,
        };

        try {
            dispatch(updateQuestProgress({ type: 'practice_any_song' }));
            
            const totalMins = Math.floor(tMins + hMins);
            if (totalMins > 0) {
               dispatch(updateQuestProgress({ type: 'practice_total_time', amount: totalMins }));
               dispatch(updateQuestProgress({ type: 'long_session', amount: totalMins }));
            }
            if (tMins > 0) {
               dispatch(updateQuestProgress({ type: 'practice_technique_time', amount: tMins }));
            }
            if (hMins > 0) {
               dispatch(updateQuestProgress({ type: 'practice_hearing_time', amount: hMins }));
            }

            // A song session counts technique + hearing as practice categories,
            // so it should feed the combo quests just like a plan session does.
            const songActiveCategories = [tMins, hMins].filter((m) => m > 0).length;
            if (songActiveCategories > 0) {
               dispatch(updateQuestProgress({ type: 'well_rounded', amount: songActiveCategories }));
            }
            const songCategoriesOverFive = [tMins, hMins].filter((m) => m >= 5).length;
            if (songCategoriesOverFive > 0) {
               dispatch(updateQuestProgress({ type: 'two_categories_min', amount: songCategoriesOverFive }));
            }

            // Record session for the specific song progress first, so the time
            // from this session counts towards the practice-time threshold that
            // gates the "learned" points awarded below.
            if (userId) {
                const { recordPracticeSession } = await import("feature/songs/services/userSongProgress.service");
                await recordPracticeSession(userId, song.id, techniqueTime + hearingTime, null, null);
            }

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
        // Return to wherever the user came from (favorites, songs board, …);
        // only fall back to song-select when there's no history to go back to.
        const leave = () => {
            if (typeof window !== "undefined" && window.history.length > 1) {
                router.back();
            } else {
                router.push("/timer/song-select");
            }
        };
        if (timer.getTime() > 0) {
            if (confirm("Abandon this session?")) leave();
        } else {
            leave();
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
        if (!song) {
            document.title = "Practice Song - Riff Quest";
            return () => { document.title = "Riff Quest"; };
        }
        
        if (timer.timerEnabled) {
            document.title = `${convertMsToHMS(timer.getTime())} - ${song.title}`;
            const unsubscribe = timer.subscribe((time) => {
                document.title = `${convertMsToHMS(time)} - ${song.title}`;
            });
            return () => {
                unsubscribe();
                document.title = "Riff Quest";
            };
        } else {
            document.title = "Practice Song - Riff Quest";
        }
        return () => { document.title = "Riff Quest"; };
    }, [timer.timerEnabled, song, timer]);

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
                userId={userId as string}
                songId={song.id}
            />
            
            <TimeSplitterModal 
                isOpen={isSplitterOpen}
                totalTime={timer.getTime()}
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
