"use client";

import { Button } from "assets/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "assets/components/ui/dialog";
import { selectUserAuth, selectUserName } from "feature/user/store/userSlice";
import { Bug, Lightbulb, HelpCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAppSelector } from "store/hooks";
import { toast } from "sonner";

type FeedbackCategory = "bug" | "idea" | "question";

const CATEGORIES: { value: FeedbackCategory; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: "bug",
    label: "Bug Report",
    icon: <Bug size={16} />,
    description: "Something isn't working",
  },
  {
    value: "idea",
    label: "Feature Idea",
    icon: <Lightbulb size={16} />,
    description: "Suggest an improvement",
  },
  {
    value: "question",
    label: "Question",
    icon: <HelpCircle size={16} />,
    description: "Ask us anything",
  },
];

const PLACEHOLDER: Record<FeedbackCategory, string> = {
  bug: "Describe what happened and what you expected...",
  idea: "What would you like to see added or improved?",
  question: "What would you like to know?",
};

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSent?: () => void;
  variant?: "default" | "prompt";
}

export const FeedbackModal = ({ isOpen, onClose, onSent, variant = "default" }: FeedbackModalProps) => {
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState<FeedbackCategory>("idea");
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const userName = useAppSelector(selectUserName);
  const userAuth = useAppSelector(selectUserAuth);

  const isPrompt = variant === "prompt";

  const send = async () => {
    if (!message.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          category: isPrompt ? "prompt" : category,
          page: pathname,
          userName: userName ?? "anonymous",
          userId: userAuth ?? undefined,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Thanks for your feedback!");
      setMessage("");
      setCategory("idea");
      onSent?.();
      onClose();
    } catch {
      toast.error("Something went wrong, please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg border-white/10 bg-zinc-900 text-white shadow-2xl pb-24 sm:pb-6">
        {isPrompt ? (
          <>
            <DialogHeader className="border-b border-white/5 pb-4">
              <DialogTitle className="text-xl font-bold text-white">
                Hey {userName ? `${userName},` : "there,"} got a minute? 👋
              </DialogTitle>
              <p className="text-sm leading-relaxed text-zinc-400">
                We&apos;re working hard to make Riff Quest the best practice tool for guitarists.
                To do that, we need to hear from real users — not assumptions.
              </p>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-white/5 bg-zinc-800/40 px-4 py-3 text-sm text-zinc-300 leading-relaxed space-y-2">
                <p>What bothers you about the app? What&apos;s missing? What do you wish worked differently?</p>
                <p className="hidden sm:flex items-center gap-2 text-zinc-500">
                  <span>💡</span> Got an idea?
                  <span>🐛</span> Found a bug?
                  <span>😤</span> Something annoys you?
                </p>
                <p className="text-xs text-zinc-600">
                  You can also share feedback anytime via the <span className="text-zinc-400 font-medium">Send Feedback</span> button in the sidebar.
                </p>
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tell us what's on your mind..."
                rows={5}
                autoFocus
                className="w-full resize-none rounded-xl border border-white/5 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 transition-colors"
              />

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={onClose} className="text-zinc-500 hover:text-white">
                  Maybe later
                </Button>
                <Button
                  onClick={send}
                  disabled={loading || !message.trim()}
                  className="bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-50"
                >
                  {loading ? "Sending..." : "Share feedback"}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="border-b border-white/5 pb-4">
              <DialogTitle className="text-xl font-bold text-white">
                Share your feedback
              </DialogTitle>
              <p className="text-sm text-zinc-400">
                Help us make Riff Quest better — every message is read.
              </p>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => {
                  const isActive = category === cat.value;
                  return (
                    <button
                      key={cat.value}
                      onClick={() => setCategory(cat.value)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all duration-150 ${
                        isActive
                          ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                          : "border-white/5 bg-zinc-800/50 text-zinc-400 hover:border-white/10 hover:bg-zinc-800 hover:text-zinc-300"
                      }`}
                    >
                      <span className={isActive ? "text-cyan-400" : "text-zinc-500"}>
                        {cat.icon}
                      </span>
                      <span className="text-xs font-semibold leading-none">{cat.label}</span>
                      <span className="text-[10px] leading-tight text-zinc-500">{cat.description}</span>
                    </button>
                  );
                })}
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={PLACEHOLDER[category]}
                rows={5}
                className="w-full resize-none rounded-xl border border-white/5 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 transition-colors"
              />

              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-600">
                  Sending as <span className="text-zinc-400 font-medium">{userName ?? "anonymous"}</span>
                </span>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={onClose} className="text-zinc-500 hover:text-white">
                    Cancel
                  </Button>
                  <Button
                    onClick={send}
                    disabled={loading || !message.trim()}
                    className="bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-50"
                  >
                    {loading ? "Sending..." : "Send Feedback"}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

FeedbackModal;
