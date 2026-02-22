import React, { useState, useEffect, useRef } from "react";
import { Send, Loader2, Map, MessageSquare } from "lucide-react";
import type { RoadmapMilestone } from "../../types/roadmap.types";
import {
  getNextInterviewQuestion,
  generateRoadmapFromInterview,
  type InterviewMessage,
  type GenerationPhase,
} from "../../services/interviewRoadmap";

const TOTAL_STEPS = 5;

interface RoadmapInterviewProps {
  apiKey: string;
  userAuth: string;
  onComplete: (milestones: RoadmapMilestone[]) => void;
  onCancel: () => void;
}

const RoadmapInterview: React.FC<RoadmapInterviewProps> = ({
  apiKey,
  userAuth,
  onComplete,
  onCancel,
}) => {
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [phase, setPhase] = useState<GenerationPhase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const askFirstQuestion = async () => {
    setIsTyping(true);
    try {
      const q = await getNextInterviewQuestion(apiKey, []);
      setMessages([{ role: "assistant", content: q }]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    askFirstQuestion();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isGenerating]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping || isGenerating) return;

    const userMsg: InterviewMessage = { role: "user", content: trimmed };
    const newHistory: InterviewMessage[] = [...messages, userMsg];
    setMessages(newHistory);
    setInput("");
    setStep((s) => s + 1);

    const nextStep = step + 1;

    if (nextStep >= TOTAL_STEPS) {
      setIsGenerating(true);
      try {
        const milestones = await generateRoadmapFromInterview(
          apiKey,
          newHistory,
          userAuth,
          (p) => setPhase(p)
        );
        onComplete(milestones);
      } catch (e: any) {
        setError(e.message);
        setIsGenerating(false);
      }
      return;
    }

    setIsTyping(true);
    try {
      const nextQ = await getNextInterviewQuestion(apiKey, newHistory);
      setMessages((prev) => [...prev, { role: "assistant", content: nextQ }]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsTyping(false);
    }

    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const answeredSteps = Math.min(step, TOTAL_STEPS);
  const progressPct = (answeredSteps / TOTAL_STEPS) * 100;

  return (
    <div className="flex flex-col gap-0 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/25">
            <MessageSquare className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-100">Wywiad przed planem</div>
            <div className="text-xs text-zinc-500">Krok {Math.min(answeredSteps + 1, TOTAL_STEPS)}/{TOTAL_STEPS}</div>
          </div>
        </div>
        <button
          onClick={onCancel}
          className="text-xs text-zinc-600 transition hover:text-zinc-400"
          disabled={isGenerating}
        >
          Anuluj
        </button>
      </div>

      <div className="h-1 w-full bg-zinc-800">
        <div
          className="h-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <div className="flex min-h-[320px] flex-col gap-4 overflow-y-auto p-5">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
              style={
                msg.role === "assistant"
                  ? {
                      background: "rgba(39,39,42,0.9)",
                      border: "1px solid rgba(63,63,70,0.6)",
                      color: "#e4e4e7",
                      borderRadius: "4px 16px 16px 16px",
                    }
                  : {
                      background: "rgba(16,185,129,0.12)",
                      border: "1px solid rgba(16,185,129,0.25)",
                      color: "#d1fae5",
                      borderRadius: "16px 4px 16px 16px",
                    }
              }
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div
              className="flex items-center gap-1.5 rounded-2xl px-4 py-3"
              style={{
                background: "rgba(39,39,42,0.9)",
                border: "1px solid rgba(63,63,70,0.6)",
                borderRadius: "4px 16px 16px 16px",
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {isGenerating && (
          <div className="flex flex-col items-center justify-center gap-4 py-10">
            <div className="relative flex h-14 w-14 items-center justify-center">
              <div className="absolute h-14 w-14 animate-spin rounded-full border-2 border-transparent border-t-emerald-500" />
              <div className="h-8 w-8 rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/30" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="text-sm font-medium text-zinc-200">
                {phase === "analyzing" && "Profilowanie ucznia…"}
                {phase === "drafting" && "Tworzenie planu narracyjnego…"}
                {phase === "enriching" && "Wzbogacanie w BPM, triggery, ćwiczenia…"}
                {phase === "finalizing" && "Strukturyzowanie JSON…"}
                {!phase && "Generowanie roadmapy…"}
              </div>
              <div className="text-xs text-zinc-600">
                {phase === "analyzing" && "Krok 1/4 · Chain-of-thought: profil ucznia"}
                {phase === "drafting" && "Krok 2/4 · Narracyjny plan etapów"}
                {phase === "enriching" && "Krok 3/4 · Ekspert dodaje metryki i triggery"}
                {phase === "finalizing" && "Krok 4/4 · Finalna struktura roadmapy"}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-900/40 bg-red-900/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {!isGenerating && step < TOTAL_STEPS && (
        <div className="border-t border-zinc-800 p-4">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="Twoja odpowiedź..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
              autoFocus
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-500 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-2 text-center text-xs text-zinc-700">
            Naciśnij Enter aby wysłać · {TOTAL_STEPS - step} {TOTAL_STEPS - step === 1 ? "odpowiedź" : "odpowiedzi"} do generowania planu
          </div>
        </div>
      )}
    </div>
  );
};

export default RoadmapInterview;
