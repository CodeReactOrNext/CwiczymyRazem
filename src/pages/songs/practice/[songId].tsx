import { BackLink } from "components/BackLink/BackLink";
import type { Exercise, ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import { PracticeLoadingScreen } from "feature/exercisePlan/views/PracticeSession/components/PracticeLoadingScreen";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { ensureSongIsLearning } from "feature/songs/services/udateSongStatus";
import { fetchGpFileAsFile } from "feature/songs/services/userGpFiles.service";
import {
  getUserSongProgress,
  type UserSongProgress,
} from "feature/songs/services/userSongProgress.service";
import type { Song } from "feature/songs/types/songs.type";
import { selectUserAuth, selectUserAvatar } from "feature/user/store/userSlice";
import { doc, getDoc } from "firebase/firestore";
import { Music } from "lucide-react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";
import { withAuth } from "utils/auth/serverAuth";
import { db } from "utils/firebase/client/firebase.utils";

type PageState =
  | { status: "loading" }
  | { status: "ready"; song: Song; plan: ExercisePlan; rawGpFile: File | undefined; progress: UserSongProgress | null }
  | { status: "error"; message: string };

export default function SongPracticePage() {
  const router = useRouter();
  const { songId } = router.query;
  const userId = useAppSelector(selectUserAuth);
  const userAvatar = useAppSelector(selectUserAvatar);

  const [pageState, setPageState] = useState<PageState>({ status: "loading" });
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    if (!songId || typeof songId !== "string" || !userId) return;

    const load = async () => {
      setPageState({ status: "loading" });
      try {
        // Fetch song and progress in parallel
        const [songSnap, progress] = await Promise.all([
          getDoc(doc(db, "songs", songId)),
          getUserSongProgress(userId, songId),
        ]);

        if (!songSnap.exists()) {
          setPageState({ status: "error", message: "Song not found." });
          return;
        }

        const song = { id: songSnap.id, ...songSnap.data() } as Song;

        // Download attached GP file if present
        let rawGpFile: File | undefined;
        if (progress?.gpFileId && progress.gpFileName) {
          try {
            // We need the downloadUrl — fetch it from gpFiles subcollection
            const gpFileSnap = await getDoc(doc(db, "users", userId, "gpFiles", progress.gpFileId));
            if (gpFileSnap.exists()) {
              const { downloadUrl } = gpFileSnap.data() as { downloadUrl: string };
              rawGpFile = await fetchGpFileAsFile(downloadUrl, progress.gpFileName);
            }
          } catch {
            // GP file fetch failed — continue without it
          }
        }

        const exercise: Exercise = {
          id: `song-${songId}`,
          title: song.title,
          description: song.artist,
          difficulty: "medium",
          category: "mixed",
          timeInMinutes: 10,
          instructions: [],
          tips: [],
          metronomeSpeed: { min: 40, max: 240, recommended: 120 },
          relatedSkills: [],
          imageUrl: song.coverUrl || null,
        };

        const plan: ExercisePlan = {
          id: `song-practice-${songId}-${Date.now()}`,
          title: song.title,
          difficulty: "medium",
          description: song.artist,
          category: "mixed",
          exercises: [exercise],
          userId: "system",
          image: null,
          song: { id: song.id, title: song.title, artist: song.artist },
        };

        setPageState({ status: "ready", song, plan, rawGpFile, progress });
      } catch {
        setPageState({ status: "error", message: "Failed to load practice session." });
      }
    };

    load();
  }, [songId, userId]);

  const handleFinish = async () => {
    setIsFinishing(true);

    // Practising a song here moves it out of "want to learn" (or starts tracking
    // it) just like the free-practice timer does. PracticeSession has no songId,
    // so this session's time is not written to songProgress — only the status.
    if (pageState.status === "ready" && userId) {
      try {
        await ensureSongIsLearning(
          userId,
          pageState.song.id,
          pageState.song.title,
          pageState.song.artist,
          userAvatar || ""
        );
      } catch (error) {
        console.error("Failed to auto-update song status to learning", error);
      }
    }

    router.push("/report");
  };

  const handleClose = () => {
    // Return to wherever the user came from (favorites, songs board, …);
    // only fall back to the songs page when there's no history to go back to.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/songs?view=management");
    }
  };

  if (pageState.status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020202]">
        <Head>
          <title>Error | Riff Quest</title>
        </Head>
        <div className="flex flex-col items-center gap-4 text-zinc-500">
          <Music className="h-8 w-8 opacity-40" />
          <p className="text-sm font-bold">{pageState.message}</p>
          <BackLink label="Back to songs" onClick={handleClose} />
        </div>
      </div>
    );
  }

  if (pageState.status !== "ready") {
    return <PracticeLoadingScreen isReady={false} />;
  }

  return (
    <>
      <Head>
        <title>{pageState.plan.title} — Practice | Riff Quest</title>
      </Head>
      <PracticeSession
        plan={pageState.plan}
        rawGpFile={pageState.rawGpFile}
        onClose={handleClose}
        onFinish={handleFinish}
        isFinishing={isFinishing}
        autoReport={false}
        freeMode
      />
    </>
  );
}

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: ["exercises", "common"],
});
