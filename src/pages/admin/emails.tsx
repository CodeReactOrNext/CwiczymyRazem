import AdminLogin from "feature/admin/components/AdminLogin";
import { useAdminAuth } from "feature/admin/hooks/useAdminAuth";
import type { AdminEmailType } from "feature/admin/hooks/useAdminEmails";
import { useAdminEmails } from "feature/admin/hooks/useAdminEmails";
import AdminLayout from "feature/admin/layouts/AdminLayout";
import { doc, getDoc } from "firebase/firestore";
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  Check,
  Clock,
  Flag,
  Mail,
  RotateCw,
  Send,
  Sparkles,
  Trophy,
  UserPlus,
  X,
} from "lucide-react";
import type { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import type { ComponentType } from "react";
import { useState } from "react";
import { db } from "utils/firebase/client/firebase.utils";

import { authOptions } from "../api/auth/[...nextauth]";

interface EmailTypeCfg {
  type: AdminEmailType;
  label: string;
  description: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  color: "cyan" | "emerald" | "purple" | "yellow" | "red" | "orange";
}

const EMAIL_TYPES: EmailTypeCfg[] = [
  {
    type: "streak_d1",
    label: "Streak — Day 1",
    description: "Reminder for users who skipped exactly 1 day of practice.",
    icon: Flag,
    color: "yellow",
  },
  {
    type: "streak_d3",
    label: "Streak — Day 3",
    description: "Wake-up email for users gone 3 days.",
    icon: RotateCw,
    color: "orange",
  },
  {
    type: "season_start",
    label: "Season Start",
    description: "Invite previous-season participants to the new season.",
    icon: Sparkles,
    color: "cyan",
  },
  {
    type: "season_ending_soon",
    label: "Season Ending Soon",
    description: "Push current-season participants in the final 7 days.",
    icon: CalendarClock,
    color: "purple",
  },
  {
    type: "season_results",
    label: "Season Results",
    description: "Final standings for the previous season.",
    icon: Trophy,
    color: "emerald",
  },
  {
    type: "welcome",
    label: "Welcome",
    description: "Manual welcome email. Normally fires automatically on signup.",
    icon: UserPlus,
    color: "red",
  },
];

const COLOR_MAP = {
  cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/20", text: "text-cyan-400", icon: "text-cyan-500", btn: "bg-cyan-600 text-black hover:bg-cyan-500" },
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-400", icon: "text-emerald-500", btn: "bg-emerald-600 text-black hover:bg-emerald-500" },
  purple: { bg: "bg-purple-500/10", border: "border-purple-500/20", text: "text-purple-400", icon: "text-purple-500", btn: "bg-purple-600 text-white hover:bg-purple-500" },
  yellow: { bg: "bg-yellow-500/10", border: "border-yellow-500/20", text: "text-yellow-400", icon: "text-yellow-500", btn: "bg-yellow-600 text-black hover:bg-yellow-500" },
  red: { bg: "bg-red-500/10", border: "border-red-500/20", text: "text-red-400", icon: "text-red-500", btn: "bg-red-600 text-white hover:bg-red-500" },
  orange: { bg: "bg-orange-500/10", border: "border-orange-500/20", text: "text-orange-400", icon: "text-orange-500", btn: "bg-orange-600 text-black hover:bg-orange-500" },
};

const AdminEmailsPage = () => {
  const { password, setPassword, isAuth, handleLogin, handleLogout } = useAdminAuth(() => {});
  const {
    data,
    selectedUids,
    isLoading,
    isSending,
    lastResult,
    fetchRecipients,
    toggleRecipient,
    selectAll,
    deselectAll,
    sendSelected,
    reset,
  } = useAdminEmails(password);

  const [activeType, setActiveType] = useState<AdminEmailType | null>(null);

  if (!isAuth) {
    return (
      <AdminLayout onLogout={handleLogout}>
        <div className="flex min-h-[80vh] items-center justify-center p-4">
          <AdminLogin password={password} setPassword={setPassword} onLogin={handleLogin} />
        </div>
      </AdminLayout>
    );
  }

  const handlePickType = (type: AdminEmailType) => {
    setActiveType(type);
    fetchRecipients(type);
  };

  const handleBack = () => {
    setActiveType(null);
    reset();
  };

  const activeCfg = EMAIL_TYPES.find((e) => e.type === activeType);
  const c = activeCfg ? COLOR_MAP[activeCfg.color] : COLOR_MAP.cyan;
  const ActiveIcon = activeCfg?.icon;

  return (
    <AdminLayout onLogout={handleLogout}>
      <div className="space-y-8 p-8 animate-in fade-in duration-700">
        <header className="flex flex-col gap-2">
          <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">
            Email Center
          </h2>
          <p className="text-sm font-medium text-zinc-500">
            Manually trigger transactional emails. Same email type won&apos;t fire to the same user within 7 days.
          </p>
        </header>

        {!activeType && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {EMAIL_TYPES.map((cfg) => {
              const cc = COLOR_MAP[cfg.color];
              const Icon = cfg.icon;
              return (
                <button
                  key={cfg.type}
                  onClick={() => handlePickType(cfg.type)}
                  className={`group flex flex-col gap-4 rounded-3xl border bg-zinc-950/50 p-6 text-left backdrop-blur-xl transition-all hover:scale-[1.02] ${cc.border}`}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${cc.bg}`}>
                    <Icon className={`h-6 w-6 ${cc.icon}`} />
                  </div>
                  <div>
                    <h3 className={`text-lg font-black tracking-tight ${cc.text}`}>{cfg.label}</h3>
                    <p className="mt-1 text-xs text-zinc-500">{cfg.description}</p>
                  </div>
                  <span className="mt-auto text-[10px] font-bold uppercase tracking-widest text-zinc-600 group-hover:text-zinc-400">
                    Load recipients →
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {activeType && activeCfg && ActiveIcon && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 transition-colors hover:text-white"
              >
                <ArrowLeft size={14} />
                Back
              </button>
              <button
                onClick={() => fetchRecipients(activeType)}
                disabled={isLoading}
                className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 transition-colors hover:text-cyan-400 disabled:opacity-40"
              >
                {isLoading ? "Loading..." : "Refresh"}
              </button>
            </div>

            <div className={`rounded-3xl border bg-zinc-950/50 p-6 backdrop-blur-xl ${c.border}`}>
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${c.bg}`}>
                  <ActiveIcon className={`h-6 w-6 ${c.icon}`} />
                </div>
                <div className="flex-1">
                  <h3 className={`text-xl font-black ${c.text}`}>{activeCfg.label}</h3>
                  <p className="mt-1 text-sm text-zinc-400">
                    {data?.description ?? activeCfg.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3 text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                    {data?.context?.seasonName && (
                      <span className="rounded-lg border border-white/5 bg-zinc-900 px-2.5 py-1">
                        {data.context.seasonName}
                      </span>
                    )}
                    {data?.context?.daysInSeason != null && (
                      <span className="rounded-lg border border-white/5 bg-zinc-900 px-2.5 py-1">
                        {data.context.daysInSeason} days
                      </span>
                    )}
                    {data?.context?.top3 && data.context.top3.length > 0 && (
                      <span className="rounded-lg border border-white/5 bg-zinc-900 px-2.5 py-1">
                        Top 3: {data.context.top3.map((t) => t.displayName).join(" / ")}
                      </span>
                    )}
                    {data && data.cooldownExcluded > 0 && (
                      <span className="flex items-center gap-1 rounded-lg border border-yellow-500/20 bg-yellow-500/10 px-2.5 py-1 text-yellow-400">
                        <Clock size={11} />
                        {data.cooldownExcluded} on cooldown (hidden)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center rounded-3xl border border-dashed border-white/5 py-16 text-zinc-600">
                <Mail className="mr-2 h-5 w-5 animate-pulse" />
                <span className="text-sm font-bold">Loading recipients...</span>
              </div>
            )}

            {!isLoading && data && data.recipients.length === 0 && (
              <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-white/5 py-16 text-zinc-600">
                <AlertCircle className="h-10 w-10 opacity-30" />
                <p className="text-sm font-bold text-zinc-500">No eligible recipients</p>
                <p className="text-xs">
                  {data.cooldownExcluded > 0
                    ? `${data.cooldownExcluded} matching user${data.cooldownExcluded === 1 ? "" : "s"} on cooldown.`
                    : "Nobody currently matches this email's criteria."}
                </p>
              </div>
            )}

            {!isLoading && data && data.recipients.length > 0 && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/5 bg-zinc-950/50 p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                      {selectedUids.size} / {data.recipients.length} selected
                    </span>
                    <button
                      onClick={selectAll}
                      className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-cyan-400"
                    >
                      Select all
                    </button>
                    <button
                      onClick={deselectAll}
                      className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-red-400"
                    >
                      Deselect all
                    </button>
                  </div>
                  <button
                    onClick={sendSelected}
                    disabled={isSending || selectedUids.size === 0}
                    className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${c.btn}`}
                  >
                    <Send size={14} />
                    {isSending ? "Sending..." : `Send to ${selectedUids.size}`}
                  </button>
                </div>

                <div className="space-y-2">
                  {data.recipients.map((r) => {
                    const isSelected = selectedUids.has(r.uid);
                    const resultRow = lastResult?.results.find((res) => res.uid === r.uid);
                    return (
                      <label
                        key={r.uid}
                        className={`flex cursor-pointer items-center gap-4 rounded-2xl border bg-zinc-950/60 p-4 transition-colors ${
                          isSelected
                            ? "border-white/10 hover:border-white/20"
                            : "border-white/5 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRecipient(r.uid)}
                          className="h-4 w-4 accent-cyan-500"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-white">
                            {r.displayName || "(no name)"}
                          </p>
                          <p className="truncate text-xs text-zinc-500">{r.email}</p>
                        </div>
                        {r.extras?.streakDays != null && (
                          <span className="hidden shrink-0 rounded-lg border border-white/5 bg-zinc-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400 sm:inline-flex">
                            🔥 {String(r.extras.streakDays)}d
                          </span>
                        )}
                        {r.extras?.place != null && (
                          <span className="hidden shrink-0 rounded-lg border border-white/5 bg-zinc-900 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400 sm:inline-flex">
                            #{String(r.extras.place)}
                          </span>
                        )}
                        {resultRow && (
                          <span
                            className={`flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-bold ${
                              resultRow.ok
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                                : resultRow.cooldown
                                ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-400"
                                : "border-red-500/20 bg-red-500/10 text-red-400"
                            }`}
                            title={resultRow.error}
                          >
                            {resultRow.ok ? (
                              <Check size={11} />
                            ) : resultRow.cooldown ? (
                              <Clock size={11} />
                            ) : (
                              <X size={11} />
                            )}
                            {resultRow.ok
                              ? "Sent"
                              : resultRow.cooldown
                              ? "Cooldown"
                              : "Failed"}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>

                {lastResult && (
                  <div className="rounded-2xl border border-white/5 bg-zinc-950/50 p-4 text-xs">
                    <div className="flex flex-wrap gap-4">
                      <span className="font-bold text-emerald-400">
                        ✓ Sent: {lastResult.sent}
                      </span>
                      {lastResult.cooldownSkipped > 0 && (
                        <span className="font-bold text-yellow-400">
                          ⏱ Cooldown: {lastResult.cooldownSkipped}
                        </span>
                      )}
                      {lastResult.failed - lastResult.cooldownSkipped > 0 && (
                        <span className="font-bold text-red-400">
                          ✗ Failed: {lastResult.failed - lastResult.cooldownSkipped}
                        </span>
                      )}
                    </div>
                    {lastResult.failed - lastResult.cooldownSkipped > 0 && (
                      <div className="mt-3 space-y-1 border-t border-white/5 pt-3">
                        {lastResult.results
                          .filter((r) => !r.ok && !r.cooldown)
                          .map((r) => (
                            <p key={r.uid} className="font-mono text-[10px] text-red-400/80">
                              {r.email}: {r.error ?? "Unknown error"}
                            </p>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session?.user) return { notFound: true };

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

export default AdminEmailsPage;
