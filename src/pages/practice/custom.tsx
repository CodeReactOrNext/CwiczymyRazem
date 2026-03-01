import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { ImportTablature } from "feature/songs/components/ImportTablature/ImportTablature";
import { MyGpFiles } from "feature/songs/components/MyGpFiles/MyGpFiles";
import { PracticeSession } from "feature/exercisePlan/views/PracticeSession/PracticeSession";
import { TablatureMeasure, Exercise, ExercisePlan, BackingTrack } from "feature/exercisePlan/types/exercise.types";
import { Button } from "assets/components/ui/button";
import { ArrowLeft, Music, Zap, Upload, FolderOpen, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "assets/lib/utils";
import { uploadUserGpFile } from "feature/songs/services/userGpFiles.service";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useAppSelector } from "store/hooks";
import { toast } from "sonner";
import { withAuth } from "utils/auth/serverAuth";

type Tab = "import" | "library";

interface StagedFile {
  exercise: Exercise;
  rawFile: File | null; // present only when imported locally (not from library)
  tempo: number;
}

export default function CustomPracticePage() {
  const router = useRouter();
  const userId = useAppSelector(selectUserAuth);

  const [activeTab, setActiveTab] = useState<Tab>("import");
  const [sessionPlan, setSessionPlan] = useState<ExercisePlan | null>(null);
  const [sessionRawFile, setSessionRawFile] = useState<File | null>(null);
  const [staged, setStaged] = useState<StagedFile | null>(null);
  const [lastImportedFile, setLastImportedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const buildExercise = (
    measures: TablatureMeasure[],
    fileName: string,
    tempo: number,
    trackName: string,
    allTracks: BackingTrack[]
  ): Exercise => ({
    id: `custom-${Date.now()}`,
    title: trackName ? `${fileName.replace(/\.gp\w*$/i, "")} - ${trackName}` : fileName.replace(/\.gp\w*$/i, ""),
    description: `Custom practice session imported at ${tempo} BPM`,
    difficulty: "medium",
    category: "mixed",
    timeInMinutes: 10,
    instructions: ["Practice this imported tablature at your own pace."],
    tips: ["Slow down if you make mistakes.", "Focus on clean notes."],
    metronomeSpeed: { min: 40, max: 240, recommended: tempo },
    tablature: measures,
    backingTracks: allTracks,
    relatedSkills: [],
  });

  const handleImported = (
    measures: TablatureMeasure[],
    fileName: string,
    tempo: number,
    trackName: string,
    allTracks: BackingTrack[],
    rawFile?: File
  ) => {
    setStaged({
      exercise: buildExercise(measures, fileName, tempo, trackName, allTracks),
      rawFile: rawFile ?? null,
      tempo,
    });
  };

  const handleLibraryLoad = (
    measures: TablatureMeasure[],
    fileName: string,
    tempo: number,
    trackName: string,
    allTracks: BackingTrack[]
  ) => {
    setStaged({
      exercise: buildExercise(measures, fileName, tempo, trackName, allTracks),
      rawFile: null,
      tempo,
    });
  };

  const handleSaveToLibrary = async () => {
    if (!staged?.rawFile || !userId) return;
    setIsSaving(true);
    try {
      await uploadUserGpFile(userId, staged.rawFile, ({ progress }) => {
        // Could show a progress bar here if desired
      });
      toast.success("Plik zapisano w bibliotece!");
      setLastImportedFile(null);
    } catch {
      toast.error("Nie udało się zapisać pliku");
    } finally {
      setIsSaving(false);
    }
  };

  const startSession = () => {
    if (!staged) return;
    const tempPlan: ExercisePlan = {
      id: "quick_session_" + Date.now(),
      title: "Quick Practice: " + staged.exercise.title,
      difficulty: "medium",
      description: "Temporary practice plan from imported file",
      category: "mixed",
      exercises: [staged.exercise],
      userId: "system",
      image: null,
    };
    setSessionPlan(tempPlan);
    setSessionRawFile(staged.rawFile);
  };

  if (sessionPlan) {
    return (
      <PracticeSession
        plan={sessionPlan}
        rawGpFile={sessionRawFile ?? undefined}
        onClose={() => { setSessionPlan(null); setSessionRawFile(null); }}
        onFinish={() => {
          setIsFinishing(true);
          router.push("/report");
        }}
        isFinishing={isFinishing}
        autoReport={false}
      />
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof Upload }[] = [
    { id: "import", label: "Importuj nowy", icon: Upload },
    { id: "library", label: "Moje pliki", icon: FolderOpen },
  ];

  return (
    <div className="min-h-screen bg-[#020202] text-white">
      <Head>
        <title>Quick Practice | Import GP5 | Riff Quest</title>
      </Head>

      <div className="container mx-auto px-4 py-20 max-w-2xl">
        <Link
          href="/exercises"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors mb-12"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Library
        </Link>

        <div className="text-center mb-12">
          <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 mb-6 border border-cyan-500/20">
            <Zap className="h-8 w-8 text-cyan-400" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4 italic">
            Quick <span className="text-cyan-400">Practice</span>
          </h1>
          <p className="text-zinc-400 text-lg">
            Upload your Guitar Pro file to start an interactive practice session immediately.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/5 border border-white/5 mb-6">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setStaged(null); }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                activeTab === id
                  ? "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400"
                  : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="bg-zinc-950 border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Music className="h-32 w-32" />
          </div>

          <div className="relative z-10 space-y-6">
            {activeTab === "import" && (
              <>
                <ImportTablature
                  onImported={(measures, fileName, tempo, trackName, allTracks, rawFile) =>
                    handleImported(measures, fileName, tempo, trackName, allTracks, rawFile)
                  }
                />

                {staged && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Save to library button */}
                    {staged.rawFile && userId && (
                      <Button
                        variant="ghost"
                        onClick={handleSaveToLibrary}
                        disabled={isSaving}
                        className="w-full h-10 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 text-xs font-bold uppercase tracking-widest"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                            Zapisywanie...
                          </>
                        ) : (
                          <>
                            <Save className="h-3.5 w-3.5 mr-2" />
                            Zapisz w bibliotece
                          </>
                        )}
                      </Button>
                    )}

                    <Button
                      onClick={startSession}
                      className="w-full h-14 rounded-2xl bg-cyan-500 text-black font-bold text-lg hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all group"
                    >
                      Start Practice Session
                      <Zap className="h-5 w-5 ml-2 fill-current group-hover:scale-125 transition-transform" />
                    </Button>

                    <p className="text-center text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold">
                      Ready to practice: {staged.exercise.title}
                    </p>
                  </div>
                )}

                {!staged && (
                  <div className="pt-6 border-t border-white/5">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-500 mb-4">
                      How it works
                    </h3>
                    <ul className="space-y-3">
                      {[
                        "Upload any .gp5 file from your computer",
                        "Choose from all detected instrument tracks",
                        "All interactive features (Metronome, Audio, Speed scaling) will be available",
                      ].map((text, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-zinc-400">
                          <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-cyan-500" />
                          {text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            {activeTab === "library" && userId && (
              <>
                <MyGpFiles
                  userId={userId}
                  onLoad={(measures, fileName, tempo, trackName, allTracks) =>
                    handleLibraryLoad(measures, fileName, tempo, trackName, allTracks)
                  }
                />

                {staged && (
                  <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Button
                      onClick={startSession}
                      className="w-full h-14 rounded-2xl bg-cyan-500 text-black font-bold text-lg hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all group"
                    >
                      Start Practice Session
                      <Zap className="h-5 w-5 ml-2 fill-current group-hover:scale-125 transition-transform" />
                    </Button>
                    <p className="text-center text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold">
                      Ready to practice: {staged.exercise.title}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps = withAuth({
  redirectIfUnauthenticated: "/login",
  translations: ["exercises", "common"],
});
