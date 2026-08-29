import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import { cn } from "assets/lib/utils";
import AdminLogin from "feature/admin/components/AdminLogin";
import { useAdminAuth } from "feature/admin/hooks/useAdminAuth";
import { useAdminWork } from "feature/admin/hooks/useAdminWork";
import AdminLayout from "feature/admin/layouts/AdminLayout";
import type {
  WorkItem,
  WorkStatus,
} from "feature/workBoard/types/workBoard.types";
import { doc, getDoc } from "firebase/firestore";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Hammer,
  ListOrdered,
  Plus,
  Trash2,
} from "lucide-react";
import type { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { useEffect, useState } from "react";
import { db } from "utils/firebase/client/firebase.utils";

import { authOptions } from "../api/auth/[...nextauth]";

const COLUMNS: {
  key: WorkStatus;
  title: string;
  icon: typeof Hammer;
  tone: string;
}[] = [
  {
    key: "in_progress",
    title: "In progress",
    icon: Hammer,
    tone: "text-amber-400",
  },
  { key: "queue", title: "Queue", icon: ListOrdered, tone: "text-cyan-400" },
  { key: "done", title: "Done", icon: Check, tone: "text-emerald-400" },
];

const MOVE_TO: Record<WorkStatus, { label: string; status: WorkStatus }[]> = {
  queue: [
    { label: "Start", status: "in_progress" },
    { label: "Done", status: "done" },
  ],
  in_progress: [
    { label: "Back to queue", status: "queue" },
    { label: "Done", status: "done" },
  ],
  done: [{ label: "Reopen", status: "queue" }],
};

// ─── One row ──────────────────────────────────────────────────────────────────

const WorkRow = ({
  item,
  busy,
  onEdit,
  onMove,
  onStatus,
  onDelete,
}: {
  item: WorkItem;
  busy: boolean;
  onEdit: (patch: { title?: string; note?: string }) => void;
  onMove: (direction: "up" | "down") => void;
  onStatus: (status: WorkStatus) => void;
  onDelete: () => void;
}) => {
  const [title, setTitle] = useState(item.title);
  const [note, setNote] = useState(item.note);
  const [saved, setSaved] = useState(item);

  // A write answers with the whole board, so the row can be handed a newer
  // version of itself mid-edit. Adjusting during render rather than in an
  // effect is the supported way to follow a changed prop — same shape as the
  // sidebar's section tracking.
  if (saved !== item) {
    setSaved(item);
    setTitle(item.title);
    setNote(item.note);
  }

  const dirty = title !== item.title || note !== item.note;

  return (
    <div className='space-y-3 rounded-lg bg-zinc-950/60 p-4'>
      <div className='flex flex-wrap items-center gap-3'>
        <div className='flex shrink-0 flex-col gap-1'>
          <button
            type='button'
            aria-label='Move up'
            disabled={busy}
            onClick={() => onMove("up")}
            className='rounded px-1.5 py-0.5 text-zinc-600 transition-colors disabled:pointer-events-none disabled:opacity-40 hover:bg-white/5 hover:text-zinc-300'>
            <ArrowUp size={13} />
          </button>
          <button
            type='button'
            aria-label='Move down'
            disabled={busy}
            onClick={() => onMove("down")}
            className='rounded px-1.5 py-0.5 text-zinc-600 transition-colors disabled:pointer-events-none disabled:opacity-40 hover:bg-white/5 hover:text-zinc-300'>
            <ArrowDown size={13} />
          </button>
        </div>

        <div className='min-w-[220px] flex-1 space-y-2'>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className='h-10 bg-white/5 font-bold'
          />
          <Input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder='Optional note'
            className='h-9 bg-white/5 text-sm'
          />
        </div>

        <button
          type='button'
          aria-label='Delete item'
          disabled={busy}
          onClick={onDelete}
          className='shrink-0 rounded-lg px-3 py-2 text-zinc-600 transition-colors disabled:pointer-events-none disabled:opacity-40 hover:text-red-400'>
          <Trash2 size={14} />
        </button>
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        {dirty && (
          <Button
            size='sm'
            disabled={busy}
            onClick={() => onEdit({ title, note })}>
            Save
          </Button>
        )}

        {MOVE_TO[item.status].map((target) => (
          <button
            key={target.status}
            type='button'
            disabled={busy}
            onClick={() => onStatus(target.status)}
            className='rounded-lg bg-white/5 px-3 py-1.5 text-xs font-bold text-zinc-400 transition-colors disabled:pointer-events-none disabled:opacity-40 hover:bg-white/10 hover:text-zinc-200'>
            {target.label}
          </button>
        ))}

        {item.ideaId && (
          <span
            title='Pulled from a supporter idea — its status follows this item'
            className='rounded px-2 py-1 text-[11px] font-bold text-cyan-400/80'>
            from an idea
          </span>
        )}
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const AdminWorkPage = () => {
  const { password, setPassword, isAuth, handleLogin, handleLogout } =
    useAdminAuth(() => {});

  const {
    board,
    isLoading,
    isSaving,
    fetchItems,
    addItem,
    editItem,
    moveItem,
    removeItem,
  } = useAdminWork(password);

  const [newTitle, setNewTitle] = useState("");
  const [newStatus, setNewStatus] = useState<WorkStatus>("queue");

  useEffect(() => {
    if (!isAuth || !password) return;
    fetchItems(password);
  }, [isAuth, password, fetchItems]);

  const submitNew = async () => {
    if (!newTitle.trim()) return;
    const added = await addItem({ title: newTitle, status: newStatus });
    if (added) setNewTitle("");
  };

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
      <div className='space-y-10 p-8 duration-700 animate-in fade-in'>
        <header className='flex flex-col gap-2'>
          <h2 className='text-3xl font-black italic tracking-tight text-white'>
            Work board
          </h2>
          <p className='text-sm font-medium text-zinc-500'>
            What supporters see under &quot;In the works&quot;. The queue is
            ordered, so the order is the message.
          </p>
        </header>

        <section className='flex flex-wrap items-center gap-3 rounded-lg bg-zinc-900/40 p-5'>
          <Input
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && submitNew()}
            placeholder='What is next?'
            className='h-11 min-w-[240px] flex-1 bg-white/5 font-medium'
          />

          <select
            aria-label='Column'
            value={newStatus}
            onChange={(event) => setNewStatus(event.target.value as WorkStatus)}
            className='h-11 rounded-lg bg-zinc-800/60 px-3 text-sm font-semibold text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800'>
            {COLUMNS.map((column) => (
              <option key={column.key} value={column.key}>
                {column.title}
              </option>
            ))}
          </select>

          <Button
            onClick={submitNew}
            disabled={isSaving || !newTitle.trim()}
            className='h-11'>
            <span className='flex items-center gap-2'>
              <Plus size={16} />
              Add
            </span>
          </Button>
        </section>

        {isLoading ? (
          <div className='space-y-3'>
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className='h-28 animate-pulse rounded-lg bg-zinc-900/40'
              />
            ))}
          </div>
        ) : (
          COLUMNS.map(({ key, title, icon: Icon, tone }) => (
            <section key={key} className='space-y-4'>
              <h3 className='flex items-center gap-2 text-xs font-black tracking-[0.2em] text-zinc-500'>
                <Icon size={13} className={tone} />
                {title}
                <span className='text-zinc-700'>{board[key].length}</span>
              </h3>

              {board[key].length === 0 ? (
                <p className={cn("py-6 text-center text-sm text-zinc-700")}>
                  Nothing here
                </p>
              ) : (
                <div className='space-y-2'>
                  {board[key].map((item) => (
                    <WorkRow
                      key={item.id}
                      item={item}
                      busy={isSaving}
                      onEdit={(patch) => editItem(item.id, patch)}
                      onMove={(direction) => moveItem(item.id, direction)}
                      onStatus={(status) => editItem(item.id, { status })}
                      onDelete={() => removeItem(item.id)}
                    />
                  ))}
                </div>
              )}
            </section>
          ))
        )}
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

    const userSnapshot = await getDoc(doc(db, "users", userId));
    const userData = userSnapshot.data();

    if (!userData || userData.role !== "admin") {
      return { notFound: true };
    }

    return { props: {} };
  } catch {
    return { notFound: true };
  }
};

export default AdminWorkPage;
