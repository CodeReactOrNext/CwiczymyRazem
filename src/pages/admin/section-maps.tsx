import { formatDistanceToNow } from "date-fns";
import AdminLogin from "feature/admin/components/AdminLogin";
import { useAdminAuth } from "feature/admin/hooks/useAdminAuth";
import type { AdminSectionMapRow } from "feature/admin/hooks/useAdminSectionMaps";
import { useAdminSectionMaps } from "feature/admin/hooks/useAdminSectionMaps";
import AdminLayout from "feature/admin/layouts/AdminLayout";
import { doc, getDoc } from "firebase/firestore";
import { ChevronDown, ListMusic, RefreshCw, Users } from "lucide-react";
import type { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { useEffect, useState } from "react";
import { db } from "utils/firebase/client/firebase.utils";

import { authOptions } from "../api/auth/[...nextauth]";

const STATUS_STYLES: Record<string, string> = {
  verified: "bg-emerald-500/15 text-emerald-300",
  pending: "bg-amber-500/15 text-amber-300",
};

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-lg bg-zinc-900/40 p-5">
    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">
      {label}
    </p>
    <p className="mt-2 text-2xl font-black text-white">{value}</p>
  </div>
);

const SectionMapRow = ({ row }: { row: AdminSectionMapRow }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-lg bg-zinc-900/40">
      <button
        type="button"
        onClick={() => setIsExpanded((v) => !v)}
        className="flex w-full items-center gap-4 p-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-zinc-100">
            {row.title}
          </p>
          <p className="truncate text-xs text-zinc-500">{row.artist}</p>
        </div>

        <span
          className={`shrink-0 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
            STATUS_STYLES[row.status] ?? "bg-zinc-800 text-zinc-400"
          }`}
        >
          {row.status}
        </span>

        <div className="flex shrink-0 items-center gap-1.5 text-xs text-zinc-400">
          <Users className="h-3.5 w-3.5" />
          {row.contributorCount}
        </div>

        <span className="shrink-0 text-xs text-zinc-600">
          {row.sectionCount} section{row.sectionCount === 1 ? "" : "s"}
        </span>

        <span className="hidden shrink-0 text-xs text-zinc-600 sm:inline">
          {row.updatedAt
            ? formatDistanceToNow(new Date(row.updatedAt), { addSuffix: true })
            : "—"}
        </span>

        <ChevronDown
          className={`h-4 w-4 shrink-0 text-zinc-600 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {isExpanded && (
        <div className="space-y-2 border-t border-white/5 p-4 pt-3">
          {row.contributors.map((c) => (
            <div
              key={c.userId}
              className="flex items-center justify-between text-xs text-zinc-500"
            >
              <span className="font-semibold text-zinc-300">
                {c.username}
              </span>
              <span>{c.sectionCount} sections</span>
              <span>
                {c.submittedAt
                  ? formatDistanceToNow(new Date(c.submittedAt), {
                      addSuffix: true,
                    })
                  : "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AdminSectionMapsPage = () => {
  const { password, setPassword, isAuth, handleLogin, handleLogout } =
    useAdminAuth(() => {});
  const { data, isLoading, fetchSectionMaps } = useAdminSectionMaps(password);

  useEffect(() => {
    if (isAuth) fetchSectionMaps();
  }, [isAuth, fetchSectionMaps]);

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

  return (
    <AdminLayout onLogout={handleLogout}>
      <div className="space-y-8 p-6 lg:p-12 animate-in fade-in duration-700">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-black italic tracking-tight text-white uppercase">
              Section Maps
            </h2>
            <p className="text-sm font-medium text-zinc-500">
              Community-submitted YouTube section timings, auto-shared from
              practice sessions.
            </p>
          </div>
          <button
            onClick={() => fetchSectionMaps()}
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-700 hover:text-white disabled:opacity-40"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </header>

        {data && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Total maps" value={data.stats.total} />
            <StatCard label="Verified" value={data.stats.verified} />
            <StatCard label="Pending" value={data.stats.pending} />
          </div>
        )}

        <div className="space-y-2">
          {!data && !isLoading && (
            <div className="flex flex-col items-center gap-2 py-20 text-zinc-700">
              <ListMusic className="h-10 w-10 opacity-30" />
              <p className="text-sm">No data loaded yet.</p>
            </div>
          )}

          {data?.rows.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-20 text-zinc-700">
              <ListMusic className="h-10 w-10 opacity-30" />
              <p className="text-sm">No community section maps yet.</p>
            </div>
          )}

          {data?.rows.map((row) => (
            <SectionMapRow key={row.mapId} row={row} />
          ))}
        </div>
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

export default AdminSectionMapsPage;
