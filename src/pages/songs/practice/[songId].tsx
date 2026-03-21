import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import type { Exercise, ExercisePlan } from "feature/exercisePlan/types/exercise.types";
import type { Song } from "feature/songs/types/songs.type";
import {
  getUserSongProgress,
  recordPracticeSession,
  type UserSongProgress,
} from "feature/songs/services/userSongProgress.service";
import { fetchGpFileAsFile } from "feature/songs/services/userGpFiles.service";
import { selectUserAuth, selectUserInfo } from "feature/user/store/userSlice";
import { useAppSelector } from "store/hooks";
import { Loader2, Music } from "lucide-react";
import { withAuth } from "utils/auth/serverAuth";

type PageState =
  | { status: "loading" }
  | { status: "ready"; plan: ExercisePlan; rawGpFile: File | undefined; progress: UserSongProgress | null }
  | { status: "error"; message: string };

export default function SongPracticePage() {
  const router = useRouter();
  const { songId } = router.query;
  const userId = useAppSelector(selectUserAuth);
  const userInfo = useAppSelector(selectUserInfo);
  const isPremium = userInfo?.role === "pro" || userInfo?.role === "master" || userInfo?.role === "admin";

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
        };

        setPageState({ status: "ready", plan, rawGpFile, progress });
      } catch {
        setPageState({ status: "error", message: "Failed to load practice session." });
      }
    };

    load();
  }, [songId, userId]);

  const handleFinish = async () => {
    setIsFinishing(true);
    // recordPracticeSession is called by PracticeSession internally via onFinish;
    // we just navigate to the report page.
    router.push("/report");
  };

  const handleClose = () => {
    router.push("/songs?view=management");
  };

  if (pageState.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020202]">
        <Head>
          <title>Loading Practice... | Riff Quest</title>
        </Head>
        <div className="flex flex-col items-center gap-4 text-zinc-500">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
          <span className="text-sm font-bold uppercase tracking-widest">Loading practice session…</span>
        </div>
      </div>
    );
  }

  if (pageState.status === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020202]">
        <Head>
          <title>Error | Riff Quest</title>
        </Head>
        <div className="flex flex-col items-center gap-4 text-zinc-500">
          <Music className="h-8 w-8 opacity-40" />
          <p className="text-sm font-bold">{pageState.message}</p>
          <button
            onClick={handleClose}
            className="text-xs font-bold uppercase tracking-widest text-cyan-500 hover:text-cyan-400"
          >
            Back to songs
          </button>
        </div>
      </div>
    );
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
