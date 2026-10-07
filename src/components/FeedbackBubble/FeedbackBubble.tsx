"use client";

import { useTranslation } from "hooks/useTranslation";
import { Button } from "assets/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "assets/components/ui/dialog";
import { selectUserAuth, selectUserName } from "feature/user/store/userSlice";
import { Interpolate } from "lib/i18n/Interpolate";
import { Bug, HelpCircle,Lightbulb } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useAppSelector } from "store/hooks";

type FeedbackCategory = "bug" | "idea" | "question";

const CATEGORIES: { value: FeedbackCategory; icon: React.ReactNode }[] = [
  { value: "bug", icon: <Bug size={16} /> },
  { value: "idea", icon: <Lightbulb size={16} /> },
  { value: "question", icon: <HelpCircle size={16} /> },
];

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSent?: () => void;
  variant?: "default" | "prompt";
}

export const FeedbackModal = ({ isOpen, onClose, onSent, variant = "default" }: FeedbackModalProps) => {
  const { t } = useTranslation("feedback");
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
      toast.success(t("thanks"));
      setMessage("");
      setCategory("idea");
      onSent?.();
      onClose();
    } catch {
      toast.error(t("error"));
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
                {userName
                  ? t("prompt.title_named", { name: userName })
                  : t("prompt.title")}
              </DialogTitle>
              <p className="text-sm leading-relaxed text-zinc-400">
                {t("prompt.intro")}
              </p>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              <div className="rounded-xl border border-white/5 bg-zinc-800/40 px-4 py-3 text-sm text-zinc-300 leading-relaxed space-y-2">
                <p>{t("prompt.questions")}</p>
                <p className="hidden sm:flex items-center gap-2 text-zinc-500">
                  <span>💡</span> {t("prompt.got_idea")}
                  <span>🐛</span> {t("prompt.found_bug")}
                  <span>😤</span> {t("prompt.annoys")}
                </p>
                <p className="text-xs text-zinc-600">
                  <Interpolate
                    text={t("prompt.anytime")}
                    values={{
                      button: (
                        <span className="text-zinc-400 font-medium">{t("send_feedback")}</span>
                      ),
                    }}
                  />
                </p>
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("prompt.placeholder")}
                rows={5}
                autoFocus
                className="w-full resize-none rounded-xl border border-white/5 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 transition-colors"
              />

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={onClose} className="text-zinc-500 hover:text-white">
                  {t("prompt.maybe_later")}
                </Button>
                <Button
                  onClick={send}
                  disabled={loading || !message.trim()}
                  className="bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-50"
                >
                  {loading ? t("sending") : t("prompt.share")}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="border-b border-white/5 pb-4">
              <DialogTitle className="text-xl font-bold text-white">
                {t("title")}
              </DialogTitle>
              <p className="text-sm text-zinc-400">
                {t("subtitle")}
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
                      <span className="text-xs font-semibold leading-none">{t(`categories.${cat.value}.label`)}</span>
                      <span className="text-[10px] leading-tight text-zinc-500">{t(`categories.${cat.value}.description`)}</span>
                    </button>
                  );
                })}
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t(`categories.${category}.placeholder`)}
                rows={5}
                className="w-full resize-none rounded-xl border border-white/5 bg-zinc-800/50 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-500 focus:border-cyan-500/40 focus:outline-none focus:ring-1 focus:ring-cyan-500/40 transition-colors"
              />

              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-600">
                  <Interpolate
                    text={t("sending_as")}
                    values={{
                      name: (
                        <span className="text-zinc-400 font-medium">{userName ?? t("anonymous")}</span>
                      ),
                    }}
                  />
                </span>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={onClose} className="text-zinc-500 hover:text-white">
                    {t("cancel")}
                  </Button>
                  <Button
                    onClick={send}
                    disabled={loading || !message.trim()}
                    className="bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-50"
                  >
                    {loading ? t("sending") : t("send_feedback")}
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
