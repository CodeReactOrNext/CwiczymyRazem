import { selectUserAuth } from "feature/user/store/userSlice";
import { Bot, ChevronDown, ChevronUp, Eye, EyeOff, KeySquare, Loader2, Map, MessageSquare,Sparkles } from "lucide-react";
import posthog from "posthog-js";
import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";
import { v4 as uuidv4 } from "uuid";

import { generateAiSummary } from "../services/generateAiSummary";
import { firebaseGetUserRoadmaps,firebaseSaveRoadmap } from "../services/roadmap.service";
import type { Roadmap, RoadmapMilestone } from "../types/roadmap.types";
import RoadmapInterview from "./RoadmapInterview/RoadmapInterview";
import RoadmapView from "./RoadmapView/RoadmapView";

const AiCoachView = () => {
  const userAuth = useAppSelector(selectUserAuth);

  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [goal, setGoal] = useState("");
  const [activeTab, setActiveTab] = useState<"summary" | "roadmap">("summary");

  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loadingRoadmaps, setLoadingRoadmaps] = useState(false);
  const [showInterview, setShowInterview] = useState(false);

  const [apiKeyOpen, setApiKeyOpen] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem("openai_api_key");
    if (savedKey) {
      setApiKey(savedKey);
    } else {
      setApiKeyOpen(true);
    }
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

  const handleSaveKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem("openai_api_key", key);
  };

  const handleGenerateSummary = async () => {
    if (!apiKey) { toast.error("Wprowadź klucz API OpenAI."); setApiKeyOpen(true); return; }
    if (!userAuth) return;
    setLoadingSummary(true);
    setSummary(null);
    setActiveTab("summary");
    try {
      const result = await generateAiSummary({ apiKey, goal, userAuth: userAuth as string });
      setSummary(result);
      toast.success("Podsumowanie wygenerowane!");
    } catch (err: any) {
      toast.error(err.message || "Błąd generowania");
      console.error(err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleStartInterview = () => {
    if (!apiKey) { toast.error("Wprowadź klucz API OpenAI."); setApiKeyOpen(true); return; }
    posthog.capture("ai_coach_roadmap_started", { has_goal: !!goal });
    setShowInterview(true);
    setActiveTab("roadmap");
  };

  const handleInterviewComplete = async (milestones: RoadmapMilestone[]) => {
    if (!userAuth) return;
    if (!milestones || milestones.length === 0) {
      toast.error("AI nie wygenerowało roadmapy. Spróbuj ponownie.");
      setShowInterview(false);
      return;
    }

    const newRoadmap: Roadmap = {
      id: uuidv4(),
      userId: userAuth as string,
      title: goal ? `Plan: ${goal.slice(0, 40)}` : `Plan ${new Date().toLocaleDateString("pl-PL")}`,
      goal: goal || "Ogólny rozwój",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      milestones,
    };

    setRoadmaps((prev) => [newRoadmap, ...prev]);
    setShowInterview(false);
    setActiveTab("roadmap");
    toast.success("Roadmapa wygenerowana!");

    try {
      await firebaseSaveRoadmap(newRoadmap);
    } catch (err) {
      console.error("Firebase save failed:", err);
      toast.error("Nie udało się zapisać w chmurze — odśwież stronę.");
    }
  };

  return (
    <div className="mx-auto flex w-full flex-col gap-6 p-4 pt-16 sm:p-6 sm:pt-20 md:gap-8 md:p-10 md:pt-24 lg:p-12 lg:pt-28">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/30">
            <Sparkles className="h-5 w-5 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">AI Coach</h1>
        </div>
        <p className="pl-[46px] text-sm text-zinc-500">
          Analizuj postępy i buduj swoją ścieżkę do mistrzostwa.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
        <button
          className="flex w-full items-center justify-between px-5 py-4 text-left"
          onClick={() => setApiKeyOpen((v) => !v)}
        >
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
            <KeySquare className="h-4 w-4 text-zinc-500" />
            Klucz API OpenAI
            {apiKey && (
              <span className="ml-2 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-500 ring-1 ring-emerald-500/20">
                ✓ Zapisany
              </span>
            )}
          </div>
          {apiKeyOpen ? <ChevronUp className="h-4 w-4 text-zinc-600" /> : <ChevronDown className="h-4 w-4 text-zinc-600" />}
        </button>

        {apiKeyOpen && (
          <div className="flex flex-col gap-3 border-t border-zinc-800 px-5 pb-5 pt-4">
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => handleSaveKey(e.target.value)}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800 py-2.5 pl-4 pr-10 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
                onClick={() => setShowKey((v) => !v)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-zinc-600">Klucz zapisany lokalnie — nie trafia na nasz serwer.</p>
          </div>
        )}
      </div>

      {!showInterview && (
        <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
          <label className="text-sm font-medium text-zinc-300">Twój cel lub priorytet (opcjonalne)</label>
          <textarea
            className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            rows={2}
            placeholder="Np. Chcę nauczyć się improwizacji, albo poprawić technikę..."
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              onClick={handleGenerateSummary}
              disabled={loadingSummary}
              className="flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-zinc-700 disabled:opacity-40"
            >
              {loadingSummary ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bot className="h-4 w-4" />}
              Analizuj postępy
            </button>

            <button
              onClick={handleStartInterview}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500"
            >
              <MessageSquare className="h-4 w-4" />
              Stwórz Roadmapę (Wywiad AI)
            </button>
          </div>
        </div>
      )}

      {showInterview && (
        <RoadmapInterview
          apiKey={apiKey}
          userAuth={userAuth as string}
          onComplete={handleInterviewComplete}
          onCancel={() => setShowInterview(false)}
        />
      )}

      <div className="flex gap-1 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1">
        {(["summary", "roadmap"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all"
            style={{
              background: activeTab === tab ? "rgba(16,185,129,0.12)" : "transparent",
              color: activeTab === tab ? "#10b981" : "#71717a",
              border: activeTab === tab ? "1px solid rgba(16,185,129,0.25)" : "1px solid transparent",
            }}
          >
            {tab === "summary" ? <Bot className="h-4 w-4" /> : <Map className="h-4 w-4" />}
            {tab === "summary" ? "Podsumowanie AI" : `Roadmapy (${roadmaps.length})`}
          </button>
        ))}
      </div>

      {activeTab === "summary" && (
        <div>
          {loadingSummary ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-600">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              <span className="text-sm">AI analizuje Twoje postępy...</span>
            </div>
          ) : summary ? (
            <div
              className="rounded-2xl border p-6"
              style={{ borderColor: "rgba(16,185,129,0.2)", background: "rgba(16,185,129,0.04)" }}
            >
              <div className="prose prose-sm prose-invert max-w-none prose-emerald prose-headings:text-emerald-400 prose-headings:font-semibold prose-strong:text-emerald-300 prose-p:text-zinc-300 prose-li:text-zinc-300">
                <ReactMarkdown>{summary}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-700">
              <Bot className="h-10 w-10 opacity-30" />
              <span className="text-sm">Kliknij "Analizuj postępy", aby otrzymać ocenę od AI.</span>
            </div>
          )}
        </div>
      )}

      {activeTab === "roadmap" && !showInterview && (
        <div className="flex flex-col gap-6">
          {loadingRoadmaps ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
            </div>
          ) : roadmaps.length > 0 ? (
            roadmaps.map((rm) => (
              <RoadmapView
                key={rm.id}
                roadmap={rm}
                onRefresh={fetchUserRoadmaps}
                onDelete={() => setRoadmaps((prev) => prev.filter((r) => r.id !== rm.id))}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-zinc-700">
              <Map className="h-10 w-10 opacity-30" />
              <span className="text-sm">Brak roadmap. Stwórz pierwszą przez Wywiad AI!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AiCoachView;
