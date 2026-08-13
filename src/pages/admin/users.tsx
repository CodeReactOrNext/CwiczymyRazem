import AdminLogin from "feature/admin/components/AdminLogin";
import { useAdminAuth } from "feature/admin/hooks/useAdminAuth";
import type { SupportSearchResult } from "feature/admin/hooks/useAdminSupport";
import { useAdminSupport } from "feature/admin/hooks/useAdminSupport";
import { useAdminUsers } from "feature/admin/hooks/useAdminUsers";
import AdminLayout from "feature/admin/layouts/AdminLayout";
import { SupportAvatarRing } from "feature/supportTeam/components/SupportAvatarRing";
import { SupportBadge } from "feature/supportTeam/components/SupportBadge";
import type { SupportTeamMember } from "feature/supportTeam/types/supportTeam.types";
import { DEFAULT_SUPPORT_TITLE } from "feature/supportTeam/utils/supportTeam.utils";
import { doc, getDoc } from "firebase/firestore";
import { Heart, Search, Trash2, User, Users } from "lucide-react";
import type { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { useEffect, useState } from "react";
import { db } from "utils/firebase/client/firebase.utils";

import { authOptions } from "../api/auth/[...nextauth]";

// ─── Shared bits ──────────────────────────────────────────────────────────────

const UserAvatar = ({
  avatar,
  size = "h-10 w-10",
}: {
  avatar: string | null;
  size?: string;
}) => (
  <div className={`${size} shrink-0 overflow-hidden rounded-full bg-zinc-800`}>
    {avatar ? (
      <img src={avatar} alt='' className='h-full w-full object-cover' />
    ) : (
      <div className='flex h-full w-full items-center justify-center text-zinc-600'>
        <User size={16} />
      </div>
    )}
  </div>
);

// ─── Search result row ────────────────────────────────────────────────────────

const SearchResultRow = ({
  user,
  onMark,
  onRemove,
}: {
  user: SupportSearchResult;
  onMark: (title: string) => Promise<void>;
  onRemove: () => Promise<void>;
}) => {
  const [title, setTitle] = useState(user.title ?? "");
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    await action();
    setBusy(false);
  };

  return (
    <div className='flex flex-wrap items-center gap-4 rounded-2xl border border-white/5 bg-zinc-950/60 p-4 transition-colors hover:border-white/10'>
      <UserAvatar avatar={user.avatar} />

      <div className='min-w-0 flex-1'>
        <p className='flex items-center gap-2 truncate text-sm font-bold text-white'>
          {user.displayName}
          {user.isSupport && <SupportBadge member={user} />}
        </p>
        <p className='truncate font-mono text-[10px] text-zinc-600'>{user.uid}</p>
      </div>

      <input
        type='text'
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={DEFAULT_SUPPORT_TITLE}
        className='w-32 rounded-xl border border-white/5 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-700 focus:border-amber-500/40 focus:outline-none'
      />

      <button
        onClick={() => run(() => onMark(title))}
        disabled={busy}
        className='flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-40'>
        <Heart size={12} fill='currentColor' />
        {user.isSupport ? "Update" : "Mark as supporter"}
      </button>

      {user.isSupport && (
        <button
          onClick={() => run(onRemove)}
          disabled={busy}
          className='rounded-xl border border-white/5 px-3 py-2 text-xs font-bold text-zinc-600 transition-all hover:border-red-500/20 hover:text-red-400 disabled:opacity-40'>
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
};

// ─── Team member row ──────────────────────────────────────────────────────────

const TeamMemberRow = ({
  member,
  onRemove,
}: {
  member: SupportTeamMember;
  onRemove: () => void;
}) => (
  <div className='flex items-center gap-4 rounded-2xl border border-white/5 bg-zinc-950/60 p-4 transition-colors hover:border-amber-500/20'>
    <SupportAvatarRing>
      <UserAvatar avatar={member.avatar} />
    </SupportAvatarRing>

    <div className='min-w-0 flex-1'>
      <p className='truncate text-sm font-bold text-white'>{member.displayName}</p>
      <p className='truncate font-mono text-[10px] text-zinc-600'>{member.uid}</p>
    </div>

    <SupportBadge member={member} />

    <button
      onClick={onRemove}
      className='shrink-0 rounded-lg border border-white/5 px-3 py-1.5 text-xs font-bold text-zinc-600 transition-all hover:border-red-500/20 hover:text-red-400'>
      <span className='hidden sm:inline'>Remove</span>
      <Trash2 size={13} className='sm:hidden' />
    </button>
  </div>
);

// ─── Page ─────────────────────────────────────────────────────────────────────

const AdminUsersPage = () => {
  const { password, setPassword, isAuth, handleLogin, handleLogout } =
    useAdminAuth(() => {});

  const { isLoading, userStats, fetchUsers } = useAdminUsers(password);
  const {
    members,
    results,
    isSearching,
    fetchSupportTeam,
    searchUsers,
    markAsSupport,
    removeSupport,
  } = useAdminSupport(password);

  const [term, setTerm] = useState("");

  useEffect(() => {
    if (!isAuth || !password) return;
    fetchUsers(password);
    fetchSupportTeam(password);
  }, [isAuth, password, fetchUsers, fetchSupportTeam]);

  // Typing a name should not fire a query per keystroke — the search hits
  // Firestore directly. An empty term resolves locally, without a request.
  useEffect(() => {
    const timeout = setTimeout(() => searchUsers(term), 400);
    return () => clearTimeout(timeout);
  }, [term, searchUsers]);

  if (!isAuth) {
    return (
      <AdminLayout onLogout={handleLogout}>
        <div className='flex min-h-[80vh] items-center justify-center p-4'>
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
      <div className='space-y-10 p-8 animate-in fade-in duration-700'>
        <header className='flex flex-col gap-2'>
          <h2 className='text-3xl font-black italic uppercase tracking-tight text-white'>
            User Community
          </h2>
          <p className='text-sm font-medium text-zinc-500'>
            Managing the ecosystem of registered guitarists.
          </p>
        </header>

        {/* Stats */}
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='flex items-center gap-6 rounded-3xl border border-cyan-500/20 bg-zinc-950/50 p-8 backdrop-blur-xl'>
            <div className='flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10'>
              <Users className='h-7 w-7 text-cyan-500' />
            </div>
            <div>
              <div className='text-4xl font-black tabular-nums text-white'>
                {isLoading ? "—" : userStats.totalUsers}
              </div>
              <p className='mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600'>
                Registered players
              </p>
            </div>
          </div>

          <div className='flex items-center gap-6 rounded-3xl border border-amber-500/20 bg-zinc-950/50 p-8 backdrop-blur-xl'>
            <div className='flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10'>
              <Heart className='h-7 w-7 text-amber-400' fill='currentColor' />
            </div>
            <div>
              <div className='text-4xl font-black tabular-nums text-white'>
                {members.length}
              </div>
              <p className='mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-600'>
                Supporters
              </p>
            </div>
          </div>
        </div>

        {/* Search + mark */}
        <section className='space-y-4'>
          <div className='flex flex-col gap-1'>
            <h3 className='text-xs font-black uppercase tracking-[0.2em] text-zinc-500'>
              Mark a user as a supporter
            </h3>
            <p className='text-xs text-zinc-600'>
              Search by display name or paste a user ID. The optional label
              replaces &quot;{DEFAULT_SUPPORT_TITLE}&quot; on their badge.
            </p>
          </div>

          <div className='relative'>
            <Search
              size={15}
              className='pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600'
            />
            <input
              type='text'
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder='e.g. jenny or a user ID…'
              className='w-full rounded-2xl border border-white/5 bg-zinc-900 py-3 pl-11 pr-4 text-sm text-zinc-200 placeholder:text-zinc-700 focus:border-amber-500/40 focus:outline-none'
            />
          </div>

          {isSearching ? (
            <div className='space-y-2'>
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className='h-[66px] animate-pulse rounded-2xl border border-white/5 bg-zinc-950/40'
                />
              ))}
            </div>
          ) : results === null ? null : results.length === 0 ? (
            <p className='rounded-2xl border border-dashed border-white/5 py-10 text-center text-sm text-zinc-700'>
              No user matches “{term}”
            </p>
          ) : (
            <div className='space-y-2'>
              {results.map((user) => (
                <SearchResultRow
                  key={user.uid}
                  user={user}
                  onMark={(title) => markAsSupport(user.uid, title)}
                  onRemove={() => removeSupport(user.uid)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Current team */}
        <section className='space-y-4'>
          <h3 className='flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-zinc-500'>
            <Heart size={13} fill='currentColor' />
            Supporters
          </h3>

          {members.length === 0 ? (
            <div className='flex flex-col items-center gap-3 rounded-3xl border border-dashed border-white/5 py-16 text-zinc-700'>
              <Heart className='h-10 w-10 opacity-20' />
              <p className='text-sm font-bold'>No supporters marked yet</p>
              <p className='text-xs text-zinc-600'>
                Search for a user above to give them the badge
              </p>
            </div>
          ) : (
            <div className='space-y-2'>
              {members.map((member) => (
                <TeamMemberRow
                  key={member.uid}
                  member={member}
                  onRemove={() => removeSupport(member.uid)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session || !session.user) {
    return { notFound: true };
  }

  try {
    const userId = (session.user as any).id;
    if (!userId) return { notFound: true };

    const userDocRef = doc(db, "users", userId);
    const userSnapshot = await getDoc(userDocRef);
    const userData = userSnapshot.data();

    if (!userData || userData.role !== "admin") {
      return { notFound: true };
    }

    return { props: {} };
  } catch {
    return { notFound: true };
  }
};

export default AdminUsersPage;
