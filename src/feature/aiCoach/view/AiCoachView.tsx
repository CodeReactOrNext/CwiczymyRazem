import { selectUserAuth } from "feature/user/store/userSlice";
import { ArrowLeft, Loader2, Map, Plus, Sparkles } from "lucide-react";
import posthog from "posthog-js";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";
import { v4 as uuidv4 } from "uuid";

import { generateAiRoadmap } from "../services/generateRoadmap";
import { firebaseDeleteRoadmap, firebaseGetUserRoadmaps, firebaseSaveRoadmap } from "../services/roadmap.service";
import type { Roadmap } from "../types/roadmap.types";
import RoadmapCard from "./RoadmapCard/RoadmapCard";
import RoadmapView from "./RoadmapView/RoadmapView";

const PLAN_GEN_MESSAGES = [
  "Planning your learning journey...",
  "Structuring phases & milestones...",
  "Tailoring content to your level...",
  "Organizing step progression...",
  "Selecting key techniques...",
  "Finalizing your roadmap...",
];

const PlanGeneratingOverlay: React.FC<{ goal: string }> = ({ goal }) => {
  const [msgIdx, setMsgIdx] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMsgIdx((i) => (i + 1) % PLAN_GEN_MESSAGES.length);
        setFade(true);
      }, 300);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center gap-5 py-6">
      <div className="relative flex items-center justify-center">
        <span className="absolute h-20 w-20 animate-ping rounded-full bg-emerald-500/8" />
        <span className="absolute h-14 w-14 animate-pulse rounded-full bg-emerald-500/15" />
        <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-500/40">
          <Sparkles className="h-6 w-6 text-emerald-400" />
        </div>
      </div>

      <div className="flex flex-col items-center gap-1.5 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-500/70">
          Roadmap is building your plan
        </p>
        <p
          className="text-sm text-zinc-400 transition-opacity duration-300"
          style={{ opacity: fade ? 1 : 0 }}
        >
          {PLAN_GEN_MESSAGES[msgIdx]}
        </p>
      </div>

      <div className="w-full max-w-xs rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-center">
        <p className="truncate text-xs text-zinc-500">"{goal}"</p>
      </div>

      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-emerald-500/60"
            style={{ animation: `aicoach-bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes aicoach-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

const LEVELS = ["Absolute Beginner", "Beginner", "Intermediate", "Advanced"] as const;
type Level = typeof LEVELS[number];

const LEVEL_TOOLTIPS: Record<Level, string> = {
  "Absolute Beginner": "Never touched a guitar before. We start from zero — posture, how to hold a pick, first notes.",
  "Beginner": "Less than 1 year of playing. You know a few open chords and basic strumming patterns.",
  "Intermediate": "1–3 years of playing. Comfortable with chords and basic scales, working on technique.",
  "Advanced": "3+ years of playing. Strong technique, familiar with scales and music theory.",
};

const AiCoachView = () => {
  const userAuth = useAppSelector(selectUserAuth);

  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loadingRoadmaps, setLoadingRoadmaps] = useState(false);

  // Detail view
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [goal, setGoal] = useState("");
  const [level, setLevel] = useState<Level>("Beginner");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (userAuth) fetchUserRoadmaps();
  }, [userAuth]);

  const fetchUserRoadmaps = async () => {
    if (!userAuth) return;
    setLoadingRoadmaps(true);
    try {
      const data = await firebaseGetUserRoadmaps(userAuth as string);
      setRoadmaps(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRoadmaps(false);
    }
  };

  const handleGenerate = async () => {
    if (!goal.trim()) {
      toast.error("Enter your guitar goal.");
      return;
    }
    if (!userAuth) {
      toast.error("You must be logged in.");
      return;
    }

    setGenerating(true);
    posthog.capture("ai_coach_roadmap_started", { level });

    try {
      const phases = await generateAiRoadmap({ goal: goal.trim(), level });

      const newRoadmap: Roadmap = {
        id: uuidv4(),
        userId: userAuth as string,
        title: `Plan: ${goal.trim().slice(0, 40)}`,
        goal: goal.trim(),
        level,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        phases,
      };

      setRoadmaps((prev) => [newRoadmap, ...prev]);
      setGoal("");
      setShowForm(false);
      toast.success("Plan generated! Click a step to see details.");

      await firebaseSaveRoadmap(newRoadmap);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate plan. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (roadmapId: string) => {
    if (!window.confirm("Delete this roadmap? This action cannot be undone.")) return;
    try {
      await firebaseDeleteRoadmap(roadmapId);
      setRoadmaps((prev) => prev.filter((r) => r.id !== roadmapId));
      if (selectedId === roadmapId) setSelectedId(null);
      toast.success("Roadmap deleted.");
    } catch {
      toast.error("Failed to delete.");
    }
  };

  const selectedRoadmap = roadmaps.find((r) => r.id === selectedId) ?? null;

  // ─── Detail view ───
  if (selectedRoadmap) {
    return (
      <div className="mx-auto flex w-full flex-col gap-6 p-4 pt-16 sm:p-6 sm:pt-20 md:gap-8 md:p-10 md:pt-24 lg:p-12 lg:pt-28">
        <button
          onClick={() => setSelectedId(null)}
          className="flex w-fit items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all plans
        </button>

        <RoadmapView
          roadmap={selectedRoadmap}
          onDelete={() => handleDelete(selectedRoadmap.id)}
          onUpdate={(updated) =>
            setRoadmaps((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
          }
        />
      </div>
    );
  }

  // ─── List view ───
  return (
    <div className="mx-auto flex w-full flex-col gap-6 p-4 pt-16 sm:p-6 sm:pt-20 md:gap-8 md:p-10 md:pt-24 lg:p-12 lg:pt-28">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/30">
              <Sparkles className="h-5 w-5 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Roadmap</h1>
          </div>
          <p className="pl-[46px] text-sm text-zinc-500">
            Your personalized guitar learning plans.
          </p>
        </div>

        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500"
        >
          <Plus className="h-4 w-4" />
          New plan
        </button>
      </div>

      {/* Generate form */}
      {showForm && (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          {generating ? (
            <PlanGeneratingOverlay goal={goal} />
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-300">Your guitar goal</label>
                <textarea
                  className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  rows={3}
                  placeholder="E.g. I want to learn blues improvisation, play solos like SRV..."
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-zinc-300">Skill level</label>
                <div className="flex flex-wrap gap-2">
                  {LEVELS.map((l) => (
                    <div key={l} className="group relative">
                      <button
                        onClick={() => setLevel(l)}
                        className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                          level === l
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                            : "border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
                        }`}
                      >
                        {l}
                      </button>
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-56 -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs leading-relaxed text-zinc-300 opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100">
                        {LEVEL_TOOLTIPS[l]}
                        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-zinc-700" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setShowForm(false); setGoal(""); }}
                  className="rounded-xl border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate plan
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Roadmap cards */}
      {loadingRoadmaps ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
        </div>
      ) : roadmaps.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roadmaps.map((rm) => (
            <RoadmapCard
              key={rm.id}
              roadmap={rm}
              onOpen={() => setSelectedId(rm.id)}
              onDelete={() => handleDelete(rm.id)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-zinc-700">
          <Map className="h-10 w-10 opacity-30" />
          <span className="text-sm">No plans yet.</span>
          <button
            onClick={() => setShowForm(true)}
            className="mt-1 flex items-center gap-2 rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-500 transition hover:border-zinc-700 hover:text-zinc-300"
          >
            <Plus className="h-4 w-4" />
            Create your first plan
          </button>
        </div>
      )}
    </div>
  );
};

export default AiCoachView;
