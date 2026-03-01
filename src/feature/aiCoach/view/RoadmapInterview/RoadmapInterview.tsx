import React, { useState, useEffect, useRef } from "react";
import { Send, MessageSquare, Sparkles } from "lucide-react";
import type { RoadmapMilestone } from "../../types/roadmap.types";
import {
  getNextInterviewQuestion,
  generateRoadmapFromInterview,
  type InterviewMessage,
  type InterviewQuestion,
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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [phase, setPhase] = useState<GenerationPhase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
  };

  const applyQuestion = (q: InterviewQuestion) => {
    setMessages((prev) => [...prev, { role: "assistant", content: q.question }]);
    setSuggestions(q.suggestions);
  };

  // First question on mount
  useEffect(() => {
    const init = async () => {
      setIsTyping(true);
      try {
        const q = await getNextInterviewQuestion(apiKey, []);
        applyQuestion(q);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Błąd połączenia z AI");
      } finally {
        setIsTyping(false);
      }
    };
    init();
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
    setSuggestions([]);
    const nextStep = step + 1;
    setStep(nextStep);

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
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Błąd generowania planu");
        setIsGenerating(false);
      }
      return;
    }

    setIsTyping(true);
    try {
      const q = await getNextInterviewQuestion(apiKey, newHistory);
      applyQuestion(q);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Błąd połączenia z AI");
    } finally {
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Clicking a suggestion fills the input — user can edit before sending
  const handleSuggestionClick = (s: string) => {
    setInput(s);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const progressPct = (Math.min(step, TOTAL_STEPS) / TOTAL_STEPS) * 100;
  const remaining = TOTAL_STEPS - step;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/25">
            <MessageSquare className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-100">Wywiad przed planem</div>
            <div className="text-xs text-zinc-500">
              Pytanie {Math.min(step + 1, TOTAL_STEPS)} z {TOTAL_STEPS}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={isGenerating}
          className="text-xs text-zinc-600 transition hover:text-zinc-400 disabled:opacity-40"
        >
          Anuluj
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 w-full bg-zinc-800">
        <div
          className="h-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Chat area */}
      <div className="flex min-h-[280px] flex-col gap-3 overflow-y-auto p-5">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[88%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
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

        {/* Typing indicator */}
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

        {/* Generation progress */}
        {isGenerating && (
          <div className="flex flex-col items-center justify-center gap-4 py-10">
            <div className="relative flex h-14 w-14 items-center justify-center">
              <div className="absolute h-14 w-14 animate-spin rounded-full border-2 border-transparent border-t-emerald-500" />
              <div className="h-8 w-8 rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/30" />
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <div className="text-sm font-medium text-zinc-200">
                {phase === "drafting" && "Tworzenie szkieletu planu…"}
                {phase === "detailing" && "Rozbudowywanie etapów…"}
                {phase === "finalizing" && "Składanie planu…"}
                {!phase && "Generowanie roadmapy…"}
              </div>
              <div className="text-xs text-zinc-600">
                {phase === "drafting" && "Krok 1/3 · Szkielet planu"}
                {phase === "detailing" && "Krok 2/3 · Szczegóły etapów"}
                {phase === "finalizing" && "Krok 3/3 · Finalizacja"}
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

      {/* Input area */}
      {!isGenerating && step < TOTAL_STEPS && (
        <div className="flex flex-col gap-2.5 border-t border-zinc-800 p-4">

          {/* AI-generated suggestions */}
          {suggestions.length > 0 && !isTyping && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                <Sparkles className="h-3 w-3" />
                Przykłady — kliknij żeby wypełnić
              </div>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSuggestionClick(s)}
                    className="rounded-xl border border-zinc-700/80 bg-zinc-800/60 px-3 py-1.5 text-left text-xs text-zinc-400 transition hover:border-emerald-700/50 hover:bg-emerald-950/20 hover:text-emerald-300"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Text input */}
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              placeholder="Twoja odpowiedź…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isTyping}
              autoFocus
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-500 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>

          {remaining > 0 && (
            <div className="text-center text-xs text-zinc-700">
              Enter aby wysłać · {remaining} {remaining === 1 ? "pytanie" : "pytania"} do wygenerowania planu
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RoadmapInterview;
