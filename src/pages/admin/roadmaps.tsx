import roadmaps from "data/roadmaps";
import AdminLogin from "feature/admin/components/AdminLogin";
import { useAdminAuth } from "feature/admin/hooks/useAdminAuth";
import AdminLayout from "feature/admin/layouts/AdminLayout";
import { generateAiRoadmap } from "feature/aiCoach/services/generateRoadmap";
import type { Roadmap, RoadmapPhase, RoadmapStep, StaticRoadmap } from "feature/aiCoach/types/roadmap.types";
import { doc, getDoc } from "firebase/firestore";
import {
  CheckCircle2,
  Circle,
  Download,
  Dumbbell,
  Loader2,
  Map,
  Play,
  Plus,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";
import type { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { useRef, useState } from "react";
import { FaYoutube } from "react-icons/fa6";
import { toast } from "sonner";
import { db } from "utils/firebase/client/firebase.utils";
import { v4 as uuidv4 } from "uuid";

import { authOptions } from "../api/auth/[...nextauth]";

const LEVELS = ["Absolute Beginner", "Beginner", "Intermediate", "Advanced"] as const;
type Level = (typeof LEVELS)[number];

const LEVEL_COLORS: Record<string, string> = {
  "Absolute Beginner": "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30",
  Beginner: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
  Intermediate: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
  Advanced: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30",
};

const LEVEL_BAR: Record<string, string> = {
  "Absolute Beginner": "bg-sky-500",
  Beginner: "bg-emerald-500",
  Intermediate: "bg-amber-500",
  Advanced: "bg-violet-500",
};

// ─── toStaticRoadmap ──────────────────────────────────────────────────────────

const toStaticRoadmap = (roadmap: Roadmap): StaticRoadmap => ({
  id: roadmap.id,
  title: roadmap.title,
  goal: roadmap.goal,
  level: roadmap.level,
  phases: roadmap.phases.map((phase) => ({
    ...phase,
    steps: phase.steps.map(({ sessionsCompleted: _sc, ...step }) => step),
  })),
});

const exportRoadmap = (roadmap: Roadmap) => {
  const staticRoadmap = toStaticRoadmap(roadmap);
  const slug = staticRoadmap.goal.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
  const blob = new Blob([JSON.stringify(staticRoadmap, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`Downloaded ${slug}.json — add it to src/data/roadmaps/ and import in index.ts`);
};

// ─── Queue types ─────────────────────────────────────────────────────────────

type QueueStatus = "pending" | "running" | "done" | "error";

interface StageInfo {
  label: string;
  done: number;
  total: number;
}

interface QueueItem {
  id: string;
  goal: string;
  level: Level;
  status: QueueStatus;
  stage: StageInfo;
  progress: number; // 0–100
  roadmap: Roadmap | null;
  error?: string;
}

// ─── Pipeline ────────────────────────────────────────────────────────────────

async function runPipeline(
  item: QueueItem,
  onUpdate: (patch: Partial<QueueItem>) => void
) {
  const update = (patch: Partial<QueueItem>) => onUpdate(patch);

  try {
    // ── 1. Generate structure ──
    update({ status: "running", progress: 2, stage: { label: "Generating roadmap structure…", done: 0, total: 1 } });
    const phases = await generateAiRoadmap({ goal: item.goal, level: item.level });

    let roadmap: Roadmap = {
      id: uuidv4(),
      userId: "admin",
      title: item.goal.slice(0, 80),
      goal: item.goal,
      level: item.level,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      phases,
    };
    update({ roadmap, progress: 15 });

    // ── 2. Descriptions ──
    const allSteps: { step: RoadmapStep; phase: RoadmapPhase; stepIdx: number; phaseIdx: number }[] = [];
    roadmap.phases.forEach((phase, phaseIdx) => {
      phase.steps.forEach((step, stepIdx) => allSteps.push({ step, phase, stepIdx, phaseIdx }));
    });

    let descDone = 0;
    update({ stage: { label: "Generating descriptions", done: 0, total: allSteps.length } });

    for (let i = 0; i < allSteps.length; i += 3) {
      const batch = allSteps.slice(i, i + 3);
      const results = await Promise.all(
        batch.map(async ({ step, phase, stepIdx, phaseIdx }) => {
          try {
            const res = await fetch("/api/generate-step-detail", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                goal: item.goal,
                level: item.level,
                phaseIndex: phaseIdx,
                phaseName: phase.title,
                totalPhases: roadmap.phases.length,
                stepTitle: step.title,
                prevSteps: phase.steps.slice(0, stepIdx).map((s) => s.title),
                nextSteps: phase.steps.slice(stepIdx + 1).map((s) => s.title),
                allPhases: roadmap.phases.map((p) => ({ title: p.title, steps: p.steps.map((s) => s.title) })),
              }),
            });
            const data = await res.json();
            return { stepId: step.id, phaseId: phase.id, data };
          } catch {
            return { stepId: step.id, phaseId: phase.id, data: null };
          }
        })
      );

      // Apply batch results sequentially to avoid overwrites
      for (const { stepId, phaseId, data } of results) {
        if (!data) continue;
        roadmap = {
          ...roadmap,
          phases: roadmap.phases.map((p) =>
            p.id !== phaseId ? p : {
              ...p,
              steps: p.steps.map((s) =>
                s.id !== stepId ? s : {
                  ...s,
                  description: data.description || "",
                  successCriteria: data.successCriteria || "",
                  sessionsRequired: Number(data.sessionsRequired) || 8,
                }
              ),
            }
          ),
        };
      }
      descDone += batch.length;
      update({
        roadmap,
        progress: 15 + Math.round((descDone / allSteps.length) * 45),
        stage: { label: "Generating descriptions", done: descDone, total: allSteps.length },
      });
    }

    // ── 3. Exercises ──
    let exDone = 0;
    update({ progress: 60, stage: { label: "Finding exercises", done: 0, total: allSteps.length } });

    for (let i = 0; i < allSteps.length; i += 3) {
      const batch = allSteps.slice(i, i + 3);
      const results = await Promise.all(
        batch.map(async ({ step, phase }) => {
          try {
            const res = await fetch("/api/search-exercise", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                stepTitle: step.title,
                description: roadmap.phases.flatMap(p => p.steps).find(s => s.id === step.id)?.description || "",
                goal: item.goal,
                level: item.level,
              }),
            });
            const data = await res.json();
            const firstId: string | undefined = data.exercise_ids?.[0];
            return { stepId: step.id, phaseId: phase.id, exerciseId: firstId ?? null };
          } catch {
            return { stepId: step.id, phaseId: phase.id, exerciseId: null };
          }
        })
      );

      for (const { stepId, phaseId, exerciseId } of results) {
        if (!exerciseId) continue;
        roadmap = {
          ...roadmap,
          phases: roadmap.phases.map((p) =>
            p.id !== phaseId ? p : {
              ...p,
              steps: p.steps.map((s) => s.id !== stepId ? s : { ...s, suggestedExerciseId: exerciseId }),
            }
          ),
        };
      }
      exDone += batch.length;
      update({
        roadmap,
        progress: 60 + Math.round((exDone / allSteps.length) * 20),
        stage: { label: "Finding exercises", done: exDone, total: allSteps.length },
      });
    }

    // ── 4. YouTube lessons ──
    const stepsWithDesc = allSteps.filter(({ step }) =>
      roadmap.phases.flatMap((p) => p.steps).find((s) => s.id === step.id)?.description
    );
    let lessDone = 0;
    update({ progress: 80, stage: { label: "Finding lessons", done: 0, total: stepsWithDesc.length } });

    for (let i = 0; i < stepsWithDesc.length; i += 3) {
      const batch = stepsWithDesc.slice(i, i + 3);
      const results = await Promise.all(
        batch.map(async ({ step, phase }) => {
          try {
            const enrichedStep = roadmap.phases.flatMap((p) => p.steps).find((s) => s.id === step.id);
            const res = await fetch("/api/search-youtube-lessons", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                stepTitle: step.title,
                stepDescription: enrichedStep?.description || "",
                roadmapGoal: item.goal,
                roadmapLevel: item.level,
              }),
            });
            const data = await res.json();
            const lessons: { videoId: string }[] = data.lessons ?? [];
            return { stepId: step.id, phaseId: phase.id, lessonIds: lessons.map((l) => l.videoId) };
          } catch {
            return { stepId: step.id, phaseId: phase.id, lessonIds: [] };
          }
        })
      );

      for (const { stepId, phaseId, lessonIds } of results) {
        if (!lessonIds.length) continue;
        roadmap = {
          ...roadmap,
          phases: roadmap.phases.map((p) =>
            p.id !== phaseId ? p : {
              ...p,
              steps: p.steps.map((s) => s.id !== stepId ? s : { ...s, suggestedLessonIds: lessonIds }),
            }
          ),
        };
      }
      lessDone += batch.length;
      update({
        roadmap,
        progress: 80 + Math.round((lessDone / stepsWithDesc.length) * 20),
        stage: { label: "Finding lessons", done: lessDone, total: stepsWithDesc.length },
      });
    }

    update({ status: "done", progress: 100, roadmap, stage: { label: "Complete", done: 1, total: 1 } });
  } catch (err: any) {
    update({ status: "error", stage: { label: err.message || "Error", done: 0, total: 0 }, error: err.message });
  }
}

// ─── QueueView ────────────────────────────────────────────────────────────────

const QueueView = () => {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState<Level>("Intermediate");
  const [running, setRunning] = useState(false);
  const runningRef = useRef(false);

  const updateItem = (id: string, patch: Partial<QueueItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };

  const addItem = () => {
    if (!goal.trim()) { toast.error("Enter a goal."); return; }
    const item: QueueItem = {
      id: uuidv4(),
      goal: goal.trim(),
      level,
      status: "pending",
      stage: { label: "Waiting…", done: 0, total: 0 },
      progress: 0,
      roadmap: null,
    };
    setItems((prev) => [...prev, item]);
    setGoal("");
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const startQueue = async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);

    // Snapshot pending IDs at start time
    const pendingIds = items.filter((i) => i.status === "pending").map((i) => i.id);

    for (const id of pendingIds) {
      const item = items.find((i) => i.id === id);
      if (!item) continue;
      await runPipeline(item, (patch) => updateItem(id, patch));
    }

    runningRef.current = false;
    setRunning(false);
  };

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const doneCount = items.filter((i) => i.status === "done").length;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Add form ── */}
      <div className="rounded-lg bg-zinc-900/60 p-5 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Guitar goal</label>
          <textarea
            rows={2}
            maxLength={500}
            placeholder="e.g. Play in the style of SRV, learn blues improvisation…"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addItem(); } }}
            className="w-full resize-none rounded-lg bg-zinc-800 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:ring-1 focus:ring-zinc-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                level === l
                  ? "bg-zinc-700 text-white"
                  : "bg-zinc-800 text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {l}
            </button>
          ))}
          <button
            onClick={addItem}
            className="ml-auto flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
          >
            <Plus className="h-4 w-4" />
            Add to queue
          </button>
        </div>
      </div>

      {/* ── Start button ── */}
      {items.length > 0 && (
        <div className="flex items-center gap-4">
          <button
            onClick={startQueue}
            disabled={running || pendingCount === 0}
            className="flex items-center gap-2 rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-500 disabled:opacity-40"
          >
            {running ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Running…</>
            ) : (
              <><Play className="h-4 w-4" /> Start Queue ({pendingCount} pending)</>
            )}
          </button>
          {doneCount > 0 && (
            <span className="text-xs text-zinc-500">{doneCount}/{items.length} complete</span>
          )}
        </div>
      )}

      {/* ── Queue list ── */}
      {items.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-zinc-700">
          <Sparkles className="h-8 w-8 opacity-30" />
          <p className="text-sm">Add goals above to build the queue.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const barColor = LEVEL_BAR[item.level] ?? "bg-zinc-500";
          const isPending = item.status === "pending";
          const isRunning = item.status === "running";
          const isDone = item.status === "done";
          const isError = item.status === "error";

          return (
            <div
              key={item.id}
              className={`rounded-lg p-4 transition-all ${
                isRunning
                  ? "bg-zinc-800/80 ring-1 ring-zinc-600"
                  : isDone
                  ? "bg-zinc-900/60"
                  : isError
                  ? "bg-red-950/20"
                  : "bg-zinc-900/40"
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Status icon */}
                <div className="mt-0.5 shrink-0">
                  {isPending && <Circle className="h-4 w-4 text-zinc-600" />}
                  {isRunning && <Loader2 className="h-4 w-4 animate-spin text-zinc-300" />}
                  {isDone && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                  {isError && <XCircle className="h-4 w-4 text-red-400" />}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 space-y-2">
                  {/* Header row */}
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-zinc-100">{item.goal}</p>
                    <span className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold ${LEVEL_COLORS[item.level] ?? ""}`}>
                      {item.level}
                    </span>
                  </div>

                  {/* Stage + mini icons */}
                  {(isRunning || isDone || isError) && (
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span>{item.stage.label}</span>
                      {item.stage.total > 1 && (
                        <span className="tabular-nums text-zinc-600">
                          {item.stage.done}/{item.stage.total}
                        </span>
                      )}
                      {isRunning && (
                        <div className="ml-auto flex items-center gap-2 text-zinc-600">
                          {item.stage.label.includes("desc") && <Sparkles className="h-3 w-3" />}
                          {item.stage.label.includes("exerc") && <Dumbbell className="h-3 w-3" />}
                          {item.stage.label.includes("less") && <FaYoutube className="h-3 w-3" />}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Progress bar */}
                  {(isRunning || isDone) && (
                    <div className="h-0.5 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${isDone ? "bg-emerald-500" : barColor}`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}

                  {/* Done: stats + export */}
                  {isDone && item.roadmap && (
                    <div className="flex items-center gap-3 pt-1">
                      <span className="text-xs text-zinc-600">
                        {item.roadmap.phases.length} phases ·{" "}
                        {item.roadmap.phases.flatMap((p) => p.steps).length} steps ·{" "}
                        {item.roadmap.phases.flatMap((p) => p.steps).filter((s) => s.description).length} described ·{" "}
                        {item.roadmap.phases.flatMap((p) => p.steps).filter((s) => s.suggestedExerciseId).length} exercises ·{" "}
                        {item.roadmap.phases.flatMap((p) => p.steps).filter((s) => s.suggestedLessonIds?.length).length} lessons
                      </span>
                      <button
                        onClick={() => exportRoadmap(item.roadmap!)}
                        className="ml-auto flex items-center gap-1.5 rounded-lg bg-zinc-700 px-3 py-1.5 text-xs font-bold text-zinc-100 transition hover:bg-zinc-600"
                      >
                        <Download className="h-3.5 w-3.5" />
                        Export JSON
                      </button>
                    </div>
                  )}

                  {/* Error */}
                  {isError && (
                    <p className="text-xs text-red-400">{item.error}</p>
                  )}
                </div>

                {/* Remove button (pending only) */}
                {isPending && (
                  <button
                    onClick={() => removeItem(item.id)}
                    className="shrink-0 text-zinc-700 transition hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Library ─────────────────────────────────────────────────────────────────

const LibraryView = () => {
  if (roadmaps.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-20 text-zinc-700">
        <Map className="h-10 w-10 opacity-30" />
        <p className="text-sm">No roadmaps in src/data/roadmaps/ yet.</p>
        <p className="text-xs text-zinc-600">Generate one and export the JSON, then import it in index.ts.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {roadmaps.map((rm) => {
        const allSteps = rm.phases.flatMap((p) => p.steps);
        return (
          <div key={rm.id} className="rounded-lg bg-zinc-900/40 p-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-bold text-zinc-100 leading-snug">{rm.title}</p>
              <span className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-semibold ${LEVEL_COLORS[rm.level] ?? "bg-zinc-800 text-zinc-400"}`}>
                {rm.level}
              </span>
            </div>
            <p className="text-xs text-zinc-500 line-clamp-2">{rm.goal}</p>
            <p className="text-xs text-zinc-600">
              {rm.phases.length} phases · {allSteps.length} steps
            </p>
          </div>
        );
      })}
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = "library" | "queue";

const AdminRoadmapsPage = () => {
  const [tab, setTab] = useState<Tab>("queue");

  const { password, setPassword, isAuth, handleLogin, handleLogout } =
    useAdminAuth(() => {});

  if (!isAuth) {
    return (
      <AdminLayout onLogout={handleLogout}>
        <div className="flex min-h-[80vh] items-center justify-center p-4">
          <AdminLogin password={password} setPassword={setPassword} onLogin={handleLogin} />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout onLogout={handleLogout}>
      <div className="space-y-8 p-6 lg:p-12 animate-in fade-in duration-700">
        <header className="flex flex-col gap-1">
          <h2 className="text-3xl font-black italic tracking-tight text-white uppercase">
            AI Roadmaps
          </h2>
          <p className="text-sm font-medium text-zinc-500">
            Queue goals, generate everything automatically, export to JSON.
          </p>
        </header>

        {/* Tabs */}
        <div className="flex gap-1 rounded-lg bg-zinc-900/40 p-1 w-fit">
          {(["queue", "library"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold capitalize transition ${
                tab === t ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-200"
              }`}
            >
              {t === "library" ? <Map className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {t === "library" ? `Library (${roadmaps.length})` : "Generate Queue"}
            </button>
          ))}
        </div>

        {tab === "library" ? <LibraryView /> : <QueueView />}
      </div>
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session || !session.user) return { notFound: true };

  try {
    const userId = (session.user as any).id;
    if (!userId) return { notFound: true };
    const snap = await getDoc(doc(db, "users", userId));
    const data = snap.data();
    if (!data || data.role !== "admin") return { notFound: true };
    return { props: {} };
  } catch {
    return { notFound: true };
  }
};

export default AdminRoadmapsPage;
