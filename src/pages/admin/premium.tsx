import AdminLogin from "feature/admin/components/AdminLogin";
import { useAdminAuth } from "feature/admin/hooks/useAdminAuth";
import type { PremiumUser } from "feature/admin/hooks/useAdminPremium";
import { useAdminPremium } from "feature/admin/hooks/useAdminPremium";
import AdminLayout from "feature/admin/layouts/AdminLayout";
import { doc, getDoc } from "firebase/firestore";
import {
  CalendarDays,
  Clock,
  Crown,
  Shield,
  Trash2,
  User,
  XCircle,
  Zap,
} from "lucide-react";
import type { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { useState } from "react";
import { db } from "utils/firebase/client/firebase.utils";
import { authOptions } from "../api/auth/[...nextauth]";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDaysLeft(premiumUntil: string | null): number | null {
  if (!premiumUntil) return null;
  return Math.ceil(
    (new Date(premiumUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
}

type Status = "forever" | "active" | "expiring" | "expired";

function getStatus(premiumUntil: string | null): Status {
  const days = getDaysLeft(premiumUntil);
  if (days === null) return "forever";
  if (days < 0) return "expired";
  if (days <= 7) return "expiring";
  return "active";
}

const STATUS_CFG: Record<Status, { label: string; cls: string }> = {
  forever:  { label: "Forever",       cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  active:   { label: "Active",        cls: "bg-cyan-500/10    text-cyan-400    border-cyan-500/20"    },
  expiring: { label: "Expiring soon", cls: "bg-yellow-500/10  text-yellow-400  border-yellow-500/20"  },
  expired:  { label: "Expired",       cls: "bg-red-500/10     text-red-400     border-red-500/20"     },
};

// ─── Plan badge ───────────────────────────────────────────────────────────────

const PLAN_CFG = {
  pro:    { label: "Pro",    icon: Zap,    cls: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"        },
  master: { label: "Master", icon: Shield, cls: "bg-purple-500/10 text-purple-400 border-purple-500/20"  },
} as const;

// ─── User row ─────────────────────────────────────────────────────────────────

function PremiumUserRow({
  user,
  onRevoke,
}: {
  user: PremiumUser;
  onRevoke: () => void;
}) {
  const status  = getStatus(user.premiumUntil);
  const days    = getDaysLeft(user.premiumUntil);
  const expiry  = user.premiumUntil ? new Date(user.premiumUntil) : null;
  const cfg     = STATUS_CFG[status];
  const plan    = PLAN_CFG[user.role] ?? PLAN_CFG.pro;
  const PlanIcon = plan.icon;

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-zinc-950/60 p-4 transition-colors hover:border-white/10">
      {/* Avatar */}
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-zinc-800">
        {user.avatar ? (
          <img src={user.avatar} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-600">
            <User size={16} />
          </div>
        )}
      </div>

      {/* Name + ID */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-white">{user.displayName}</p>
        <p className="truncate font-mono text-[10px] text-zinc-600">{user.id}</p>
      </div>

      {/* Plan badge */}
      <span className={`hidden shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-bold sm:inline-flex ${plan.cls}`}>
        <PlanIcon size={10} />
        {plan.label}
      </span>

      {/* Expiry date */}
      <div className="hidden shrink-0 text-right sm:block">
        {expiry ? (
          <>
            <p className="text-xs font-medium text-zinc-400">
              {expiry.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <p className={`text-[10px] ${days !== null && days < 0 ? "text-red-400" : "text-zinc-600"}`}>
              {days !== null && days >= 0 ? `${days}d remaining` : "Expired"}
            </p>
          </>
        ) : (
          <p className="text-xs font-medium text-zinc-500">No expiry</p>
        )}
      </div>

      {/* Status chip */}
      <span className={`hidden shrink-0 rounded-lg border px-2.5 py-1 text-[10px] font-bold sm:inline-flex ${cfg.cls}`}>
        {status === "expiring" && days !== null ? `${days}d left` : cfg.label}
      </span>

      {/* Revoke */}
      <button
        onClick={onRevoke}
        className="shrink-0 rounded-lg border border-white/5 px-3 py-1.5 text-xs font-bold text-zinc-600 transition-all hover:border-red-500/20 hover:text-red-400"
      >
        <span className="hidden sm:inline">Revoke</span>
        <Trash2 size={13} className="sm:hidden" />
      </button>
    </div>
  );
}

// ─── Grant form ───────────────────────────────────────────────────────────────

function GrantPremiumForm({
  onGrant,
}: {
  onGrant: (userId: string, plan: "pro" | "master", premiumUntil?: string) => Promise<void>;
}) {
  const [userId, setUserId]             = useState("");
  const [plan, setPlan]                 = useState<"pro" | "master">("pro");
  const [premiumUntil, setPremiumUntil] = useState("");
  const [loading, setLoading]           = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) return;
    setLoading(true);
    await onGrant(userId.trim(), plan, premiumUntil || undefined);
    setUserId("");
    setPremiumUntil("");
    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-white/5 bg-zinc-950/50 p-6 backdrop-blur-xl"
    >
      <h3 className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
        Grant Premium Access
      </h3>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-zinc-600">
            Firebase User ID
          </label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="e.g. abc123xyz..."
            className="w-full rounded-xl border border-white/5 bg-zinc-900 px-3 py-2.5 font-mono text-sm text-zinc-200 placeholder:text-zinc-700 focus:border-cyan-500/40 focus:outline-none"
          />
        </div>
        <div className="sm:w-40">
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-zinc-600">
            Plan
          </label>
          <div className="flex h-[42px] overflow-hidden rounded-xl border border-white/5 bg-zinc-900">
            <button
              type="button"
              onClick={() => setPlan("pro")}
              className={`flex flex-1 items-center justify-center gap-1.5 text-xs font-bold transition-colors ${
                plan === "pro"
                  ? "bg-cyan-600 text-black"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Zap size={11} />
              Pro
            </button>
            <button
              type="button"
              onClick={() => setPlan("master")}
              className={`flex flex-1 items-center justify-center gap-1.5 text-xs font-bold transition-colors ${
                plan === "master"
                  ? "bg-purple-600 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Shield size={11} />
              Master
            </button>
          </div>
        </div>
        <div className="sm:w-44">
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-zinc-600">
            Expires (optional)
          </label>
          <input
            type="date"
            value={premiumUntil}
            onChange={(e) => setPremiumUntil(e.target.value)}
            className="w-full rounded-xl border border-white/5 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-200 focus:border-cyan-500/40 focus:outline-none [color-scheme:dark]"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={!userId.trim() || loading}
            className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto ${
              plan === "master"
                ? "bg-purple-600 text-white hover:bg-purple-500"
                : "bg-cyan-600 text-black hover:bg-cyan-500"
            }`}
          >
            <Crown size={14} />
            {loading ? "Granting..." : "Grant"}
          </button>
        </div>
      </div>
      <p className="mt-2 text-[10px] text-zinc-700">
        Leave expiry empty for permanent (forever) access.
      </p>
    </form>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const AdminPremiumPage = () => {
  const { password, setPassword, isAuth, handleLogin, handleLogout } =
    useAdminAuth((pass) => fetchPremiumUsers(pass));

  const { users, isLoading, fetchPremiumUsers, grantPremium, revokePremium } =
    useAdminPremium(password);

  if (!isAuth) {
    return (
      <AdminLayout onLogout={handleLogout}>
        <div className="flex min-h-[80vh] items-center justify-center p-4">
          <AdminLogin
            password={password}
            setPassword={setPassword}
            onLogin={handleLogin}
          />
        </div>
      </AdminLayout>
    );
  }

  // ── Stats ──
  const total    = users.length;
  const proCount = users.filter((u) => u.role === "pro").length;
  const masterCount = users.filter((u) => u.role === "master").length;
  const expiring = users.filter((u) => getStatus(u.premiumUntil) === "expiring").length;
  const expired  = users.filter((u) => getStatus(u.premiumUntil) === "expired").length;

  const statCards = [
    { label: "Total Premium",  value: total,        icon: Crown,    color: "cyan"    },
    { label: "Pro",            value: proCount,     icon: Zap,      color: "emerald" },
    { label: "Master",         value: masterCount,  icon: Shield,   color: "purple"  },
    { label: "Expiring Soon",  value: expiring,     icon: Clock,    color: "yellow"  },
    { label: "Expired",        value: expired,      icon: XCircle,  color: "red"     },
  ] as const;

  const colorMap = {
    cyan:    { bg: "bg-cyan-500/10",    icon: "text-cyan-500",    border: "border-cyan-500/20",    num: "text-cyan-400"    },
    emerald: { bg: "bg-emerald-500/10", icon: "text-emerald-500", border: "border-emerald-500/20", num: "text-emerald-400" },
    purple:  { bg: "bg-purple-500/10",  icon: "text-purple-500",  border: "border-purple-500/20",  num: "text-purple-400"  },
    yellow:  { bg: "bg-yellow-500/10",  icon: "text-yellow-500",  border: "border-yellow-500/20",  num: "text-yellow-400"  },
    red:     { bg: "bg-red-500/10",     icon: "text-red-500",     border: "border-red-500/20",     num: "text-red-400"     },
  };

  return (
    <AdminLayout onLogout={handleLogout}>
      <div className="space-y-8 p-8 animate-in fade-in duration-700">

        {/* Header */}
        <header className="flex flex-col gap-2">
          <h2 className="text-3xl font-black italic uppercase tracking-tight text-white">
            Premium Members
          </h2>
          <p className="text-sm font-medium text-zinc-500">
            Manage premium access for registered guitarists.
          </p>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {statCards.map(({ label, value, icon: Icon, color }) => {
            const c = colorMap[color];
            return (
              <div
                key={label}
                className={`flex flex-col gap-3 rounded-3xl border bg-zinc-950/50 p-6 backdrop-blur-xl ${c.border}`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${c.bg}`}>
                  <Icon className={`h-5 w-5 ${c.icon}`} />
                </div>
                <div>
                  <div className={`text-4xl font-black tabular-nums ${isLoading ? "text-zinc-700" : c.num}`}>
                    {isLoading ? "—" : value}
                  </div>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600">
                    {label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Grant form */}
        <GrantPremiumForm onGrant={(userId, plan, premiumUntil) => grantPremium(userId, plan, premiumUntil)} />

        {/* Users list */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
              <CalendarDays size={13} />
              Premium Users
            </h3>
            <button
              onClick={() => fetchPremiumUsers()}
              disabled={isLoading}
              className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 hover:text-cyan-400 transition-colors disabled:opacity-40"
            >
              {isLoading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[66px] animate-pulse rounded-2xl border border-white/5 bg-zinc-950/40" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-white/5 py-16 text-zinc-700">
              <Crown className="h-10 w-10 opacity-20" />
              <p className="text-sm font-bold">No premium members yet</p>
              <p className="text-xs text-zinc-600">Use the form above to grant premium access</p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => (
                <PremiumUserRow
                  key={user.id}
                  user={user}
                  onRevoke={() => revokePremium(user.id)}
                />
              ))}
            </div>
          )}
        </div>

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

export default AdminPremiumPage;
