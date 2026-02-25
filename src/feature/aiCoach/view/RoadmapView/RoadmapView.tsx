import React, { useState, useMemo } from "react";
import {
  CheckCircle2,
  Trash2,
  X,
  Target,
  ChevronDown,
  ArrowRight,
  RotateCcw,
  Lock,
  Dumbbell,
  Flag,
  Eye,
  Edit2,
  Activity,
  Play,
  Zap,
} from "lucide-react";
import { useRouter } from "next/router";
import type { Roadmap, RoadmapMilestone } from "../../types/roadmap.types";
import { firebaseUpdateRoadmap, firebaseDeleteRoadmap } from "../../services/roadmap.service";
import { toast } from "sonner";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";

interface RoadmapViewProps {
  roadmap: Roadmap;
  onDelete: () => void;
  onRefresh: () => void;
}

function computeLockStates(milestones: RoadmapMilestone[]): Map<string, boolean> {
  const map = new Map<string, boolean>();
  let allPrevCompleted = true;
  for (const m of milestones) {
    const isLocked = !allPrevCompleted;
    map.set(m.id, isLocked);
    let allPrevChildCompleted = true;
    for (const c of m.children ?? []) {
      map.set(c.id, isLocked || !allPrevChildCompleted);
      if (!c.isCompleted) allPrevChildCompleted = false;
    }
    if (!m.isCompleted) allPrevCompleted = false;
  }
  return map;
}

function isChildDone(c: RoadmapMilestone): boolean {
  const req = c.sessionsRequired ?? 1;
  const done = c.sessionsCompleted ?? 0;
  return done >= req;
}

const STYLES = `
@keyframes checkPop {
  0%   { transform: scale(0.5); opacity: 0; }
  60%  { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}
@keyframes focusPulse {
  0%, 100% { border-color: rgba(16,185,129,0.35); }
  50%       { border-color: rgba(16,185,129,0.8); }
}
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes sessionFill {
  from { width: 0%; }
  to   { width: var(--target-w); }
}
.check-pop   { animation: checkPop 400ms cubic-bezier(0.34,1.56,0.64,1) both; }
.focus-pulse { animation: focusPulse 2.2s ease-in-out infinite; }
.slide-down  { animation: slideDown 200ms ease both; }
`;

const EditModal: React.FC<{
  milestone: RoadmapMilestone;
  onSave: (m: RoadmapMilestone) => void;
  onClose: () => void;
}> = ({ milestone, onSave, onClose }) => {
  const [local, setLocal] = useState(milestone);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <span className="font-semibold text-zinc-100">Edytuj krok</span>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200 transition-colors"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto p-6">
          {([
            { label: "Tytuł", key: "title" },
            { label: "Etap", key: "cardTitle" },
            { label: "Kryterium sukcesu", key: "successCriteria" },
            { label: "Kiedy przejść dalej", key: "successTrigger" },
            { label: "Kiedy utknąłem", key: "failTrigger" },
          ] as const).map(({ label, key }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-500">{label}</label>
              <input
                className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-emerald-500"
                value={(local as any)[key] || ""}
                onChange={(e) => setLocal({ ...local, [key]: e.target.value })}
              />
            </div>
          ))}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500">Opis</label>
            <textarea
              className="resize-none rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-emerald-500"
              rows={5}
              value={local.cardDetailedText || ""}
              onChange={(e) => setLocal({ ...local, cardDetailedText: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-500">Wymagana liczba sesji</label>
            <input
              type="number"
              min={1}
              max={30}
              className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-emerald-500"
              value={local.sessionsRequired ?? 7}
              onChange={(e) => setLocal({ ...local, sessionsRequired: parseInt(e.target.value) || 7 })}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-zinc-800 px-6 py-4">
          <button onClick={onClose} className="rounded-xl border border-zinc-700 bg-zinc-800 px-5 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition-colors">Anuluj</button>
          <button onClick={() => onSave(local)} className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors">Zapisz</button>
        </div>
      </div>
    </div>
  );
};

const SessionBar: React.FC<{
  done: number;
  required: number;
  compact?: boolean;
}> = ({ done, required, compact }) => {
  const pct = Math.min(100, Math.round((done / required) * 100));
  const dots = Math.min(required, 12);
  const filledDots = Math.round((done / required) * dots);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5">
          {Array.from({ length: dots }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${i < filledDots ? "bg-emerald-500" : "bg-zinc-700"}`}
            />
          ))}
        </div>
        <span className="text-xs text-zinc-500">{done}/{required}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-400">Sesje</span>
        <span className={`text-xs font-bold ${pct === 100 ? "text-emerald-400" : "text-zinc-400"}`}>
          {done} / {required}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex gap-1">
        {Array.from({ length: Math.min(required, 20) }).map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-sm transition-colors duration-300 ${i < done ? "bg-emerald-500" : "bg-zinc-800"}`}
          />
        ))}
      </div>
    </div>
  );
};

const ChildDetail: React.FC<{
  milestone: RoadmapMilestone;
  isLocked: boolean;
  onAddSession: () => void;
  onResetSessions: () => void;
  onEdit: () => void;
  onExerciseClick: (id: string) => void;
}> = ({ milestone: m, isLocked, onAddSession, onResetSessions, onEdit, onExerciseClick }) => {
  const done = m.sessionsCompleted ?? 0;
  const required = m.sessionsRequired ?? 7;
  const completed = isChildDone(m);
  const validOptions = (m.exerciseOptions ?? []).filter(
    (o) => o.exerciseId && !o.exerciseId.includes("null")
  );

  const validOptionsWithTitle = validOptions.map((o) => {
    const found = exercisesAgregat.find((ex) => ex.id === o.exerciseId);
    return { ...o, exerciseTitle: found?.title || o.exerciseTitle || o.exerciseId };
  });

  return (
    <div className="slide-down mt-1 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
      <div className="grid grid-cols-1 gap-0 divide-y divide-zinc-800 md:grid-cols-[1fr_260px] md:divide-x md:divide-y-0">

        {/* LEFT — opis */}
        <div className="flex flex-col gap-5 p-5">
          {m.cardDetailedText && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Opis kroku</p>
              <div className="text-sm leading-relaxed text-zinc-300">
                {m.cardDetailedText.split("\n").map((line, i) => (
                  <p key={i} className={i > 0 ? "mt-2" : ""}>{line}</p>
                ))}
              </div>
            </div>
          )}

          {m.successCriteria && (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-900/40 bg-emerald-950/20 px-4 py-3">
              <Target className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <div className="flex flex-col gap-0.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-500/70">Jak poznam że umiem</p>
                <p className="text-sm text-zinc-200">{m.successCriteria}</p>
              </div>
            </div>
          )}

          {m.selfCheckMethod && (
            <div className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-800/30 px-4 py-3">
              <Eye className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
              <div className="flex flex-col gap-0.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Samokontrola</p>
                <p className="text-sm italic text-zinc-400">{m.selfCheckMethod}</p>
              </div>
            </div>
          )}

          {(m.successTrigger || m.failTrigger) && (
            <div className="flex flex-col gap-2">
              {m.successTrigger && (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-900/30 bg-emerald-950/10 px-4 py-3 text-sm">
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <span className="text-zinc-300"><span className="font-semibold text-emerald-400">Po ukończeniu: </span>{m.successTrigger}</span>
                </div>
              )}
              {m.failTrigger && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-900/30 bg-amber-950/10 px-4 py-3 text-sm">
                  <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <span className="text-zinc-300"><span className="font-semibold text-amber-400">Gdy utknąłem: </span>{m.failTrigger}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT — sesje + ćwiczenia + akcje */}
        <div className="flex flex-col gap-4 p-5">
          <SessionBar done={done} required={required} />

          {validOptionsWithTitle.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Ćwiczenia do wyboru na sesję
              </p>
              <div className="flex flex-col gap-2">
                {validOptionsWithTitle.map((opt) => (
                  <button
                    key={opt.exerciseId}
                    onClick={() => onExerciseClick(opt.exerciseId)}
                    className="flex items-start gap-2.5 rounded-xl border border-zinc-800 bg-zinc-800/40 px-3 py-2.5 text-left transition-colors hover:border-emerald-800/60 hover:bg-emerald-950/20"
                  >
                    <Dumbbell className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-zinc-200">{opt.exerciseTitle}</span>
                      {opt.description && (
                        <span className="text-xs leading-snug text-zinc-500">{opt.description}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLocked && (
            <div className="rounded-xl border border-red-900/30 bg-red-950/20 px-4 py-3 text-xs text-red-400">
              🔒 Ukończ poprzedni krok żeby odblokować.
            </div>
          )}

          {completed && (
            <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 px-4 py-3 text-sm font-semibold text-emerald-400 text-center">
              ✓ Krok zaliczony!
            </div>
          )}

          <div className="mt-auto flex flex-col gap-2 pt-2">
            {!completed && !isLocked && (
              <button
                onClick={onAddSession}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-900/30 transition-all hover:bg-emerald-500 active:scale-95"
              >
                <Play className="h-4 w-4" />
                Zalicz sesję dzisiaj
              </button>
            )}
            {done > 0 && !completed && (
              <button
                onClick={onResetSessions}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 py-2 text-xs text-zinc-600 transition-colors hover:text-zinc-400"
              >
                <RotateCcw className="h-3 w-3" /> Cofnij ostatnią sesję
              </button>
            )}
            <button
              onClick={onEdit}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-2 text-xs text-zinc-600 transition-colors hover:text-zinc-400"
            >
              <Edit2 className="h-3.5 w-3.5" /> Edytuj krok
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Connector: React.FC<{ done: boolean }> = ({ done }) => (
  <div className={`mx-auto h-8 w-0.5 rounded-full transition-colors duration-700 ${done ? "bg-emerald-600" : "bg-zinc-800"}`} />
);

const RoadmapView: React.FC<RoadmapViewProps> = ({ roadmap, onDelete }) => {
  const router = useRouter();
  const [items, setItems] = useState(roadmap.milestones);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingMilestone, setEditingMilestone] = useState<RoadmapMilestone | null>(null);
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());

  const lockStates = useMemo(() => computeLockStates(items), [items]);

  const allChildren = useMemo(() => {
    const all: RoadmapMilestone[] = [];
    for (const m of items) for (const c of m.children ?? []) all.push(c);
    return all;
  }, [items]);

  const totalSessions = allChildren.reduce((s, c) => s + (c.sessionsRequired ?? 7), 0);
  const doneSessions = allChildren.reduce((s, c) => s + Math.min(c.sessionsCompleted ?? 0, c.sessionsRequired ?? 7), 0);
  const progress = totalSessions > 0 ? Math.round((doneSessions / totalSessions) * 100) : 0;

  const focusId = useMemo(() => {
    for (const m of items) {
      if (lockStates.get(m.id)) continue;
      if (!m.isCompleted) {
        for (const c of m.children ?? []) {
          if (!(lockStates.get(c.id) ?? false) && !isChildDone(c)) return c.id;
        }
      }
    }
    return null;
  }, [items, lockStates]);

  const updateNested = (list: RoadmapMilestone[], id: string, fn: (m: RoadmapMilestone) => RoadmapMilestone): RoadmapMilestone[] =>
    list.map((m) => m.id === id ? fn(m) : { ...m, children: m.children ? updateNested(m.children, id, fn) : m.children });

  const findMilestone = (list: RoadmapMilestone[], id: string): RoadmapMilestone | undefined => {
    for (const m of list) { if (m.id === id) return m; const f = findMilestone(m.children ?? [], id); if (f) return f; }
  };

  const recalcParentCompletion = (milestones: RoadmapMilestone[]): RoadmapMilestone[] =>
    milestones.map((m) => {
      const children = m.children ?? [];
      if (children.length === 0) return m;
      const allDone = children.every(isChildDone);
      return { ...m, isCompleted: allDone, children: recalcParentCompletion(children) };
    });

  const triggerAnim = (id: string) => {
    setAnimatingIds((p) => new Set(p).add(id));
    setTimeout(() => setAnimatingIds((p) => { const n = new Set(p); n.delete(id); return n; }), 600);
  };

  const addSession = async (childId: string) => {
    const child = findMilestone(items, childId);
    if (!child) return;
    const done = child.sessionsCompleted ?? 0;
    const req = child.sessionsRequired ?? 7;
    if (done >= req) return;

    const newDone = done + 1;
    let updated = updateNested(items, childId, (c) => ({ ...c, sessionsCompleted: newDone, isCompleted: newDone >= req }));
    updated = recalcParentCompletion(updated);
    setItems(updated);

    if (newDone >= req) triggerAnim(childId);

    try { await firebaseUpdateRoadmap(roadmap.id, { milestones: updated }); }
    catch { toast.error("Błąd zapisu."); }
  };

  const removeSession = async (childId: string) => {
    const child = findMilestone(items, childId);
    if (!child) return;
    const done = child.sessionsCompleted ?? 0;
    if (done === 0) return;

    let updated = updateNested(items, childId, (c) => ({ ...c, sessionsCompleted: done - 1, isCompleted: false }));
    updated = recalcParentCompletion(updated);
    setItems(updated);

    try { await firebaseUpdateRoadmap(roadmap.id, { milestones: updated }); }
    catch { toast.error("Błąd zapisu."); }
  };

  const handleSaveEdit = async (updated: RoadmapMilestone) => {
    let updatedList = updateNested(items, updated.id, () => updated);
    updatedList = recalcParentCompletion(updatedList);
    setItems(updatedList);
    setEditingMilestone(null);
    setExpandedId(null);
    try { await firebaseUpdateRoadmap(roadmap.id, { milestones: updatedList }); toast.success("Zapisano."); }
    catch { toast.error("Błąd zapisu."); }
  };

  const handleDelete = async () => {
    if (!window.confirm("Usunąć tę roadmapę?")) return;
    try { await firebaseDeleteRoadmap(roadmap.id); onDelete(); toast.success("Usunięto."); }
    catch { toast.error("Błąd usuwania."); }
  };

  const toggle = (id: string) => setExpandedId((p) => (p === id ? null : id));

  return (
    <>
      <style>{STYLES}</style>
      <div className="flex flex-col gap-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-5 md:p-8">

        {/* HEADER */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-xl font-bold text-zinc-100">{roadmap.title}</h2>
            <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-emerald-500" />
                <span className="font-semibold text-emerald-500">{progress}%</span> ukończono
              </span>
              <span className="text-zinc-700">·</span>
              <span className="flex items-center gap-1.5">
                <Activity className="h-4 w-4" />
                {doneSessions} / {totalSessions} sesji
              </span>
            </div>
          </div>
          <button
            onClick={handleDelete}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-600 transition-colors hover:bg-red-950/40 hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* PROGRESS BAR */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* GOAL */}
        <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
            <Flag className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="flex flex-col gap-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Cel końcowy</p>
            <p className="text-sm font-semibold text-zinc-100">{roadmap.goal}</p>
          </div>
        </div>

        {/* ROADMAP */}
        <div className="flex flex-col">
          {items.map((milestone, mIdx) => {
            const mLocked = lockStates.get(milestone.id) ?? false;
            const prevDone = mIdx === 0 ? true : items[mIdx - 1].isCompleted;
            const children = milestone.children ?? [];
            const mExpanded = expandedId === milestone.id;

            const totalChildSessions = children.reduce((s, c) => s + (c.sessionsRequired ?? 7), 0);
            const doneChildSessions = children.reduce((s, c) => s + Math.min(c.sessionsCompleted ?? 0, c.sessionsRequired ?? 7), 0);
            const mPct = totalChildSessions > 0 ? Math.round((doneChildSessions / totalChildSessions) * 100) : 0;

            return (
              <React.Fragment key={milestone.id}>
                {mIdx > 0 && <Connector done={prevDone} />}

                {/* MILESTONE HEADER */}
                <div
                  className={`flex cursor-pointer items-center gap-4 rounded-2xl border px-5 py-4 transition-all duration-300
                    ${mLocked
                      ? "cursor-not-allowed border-zinc-800/40 bg-zinc-900/20 opacity-40"
                      : milestone.isCompleted
                        ? "border-emerald-900/40 bg-emerald-950/10 hover:bg-emerald-950/20"
                        : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                    }
                  `}
                  onClick={() => !mLocked && toggle(milestone.id)}
                >
                  {/* Status circle */}
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-all duration-500 ${
                    milestone.isCompleted
                      ? "bg-emerald-500 text-white"
                      : mLocked
                        ? "border border-zinc-700 bg-zinc-800 text-zinc-700"
                        : "border border-zinc-700 bg-zinc-800/50 text-zinc-400"
                  }`}>
                    {milestone.isCompleted ? <CheckCircle2 className="h-5 w-5" /> : mLocked ? <Lock className="h-4 w-4" /> : mIdx + 1}
                  </div>

                  {/* Title + progress */}
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      {milestone.cardTitle && (
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600">{milestone.cardTitle}</p>
                      )}
                      {milestone.isCompleted && (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">GOTOWE</span>
                      )}
                    </div>
                    <p className={`font-semibold ${milestone.isCompleted ? "text-zinc-500" : mLocked ? "text-zinc-700" : "text-zinc-100"}`}>
                      {milestone.title}
                    </p>
                    {children.length > 0 && !mLocked && (
                      <div className="flex items-center gap-2">
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-800">
                          <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${mPct}%` }} />
                        </div>
                        <span className="shrink-0 text-xs text-zinc-600">{mPct}%</span>
                      </div>
                    )}
                  </div>

                  {!mLocked && (
                    <ChevronDown className={`h-5 w-5 shrink-0 text-zinc-600 transition-transform duration-300 ${mExpanded ? "-rotate-180" : ""}`} />
                  )}
                </div>

                {/* MILESTONE DETAIL — opis etapu */}
                {mExpanded && !mLocked && (
                  <div className="slide-down mt-1 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                    <div className="flex flex-col gap-4">
                      {milestone.cardDetailedText && (
                        <div className="flex flex-col gap-2">
                          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">O tym etapie</p>
                          <p className="text-sm leading-relaxed text-zinc-300">{milestone.cardDetailedText}</p>
                        </div>
                      )}
                      {milestone.successCriteria && (
                        <div className="flex items-start gap-3 rounded-xl border border-emerald-900/40 bg-emerald-950/20 px-4 py-3">
                          <Target className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-500/70">Cel etapu</p>
                            <p className="mt-0.5 text-sm text-zinc-200">{milestone.successCriteria}</p>
                          </div>
                        </div>
                      )}
                      {(milestone.successTrigger || milestone.failTrigger) && (
                        <div className="flex flex-col gap-2">
                          {milestone.successTrigger && (
                            <div className="flex items-start gap-3 rounded-xl border border-emerald-900/30 bg-emerald-950/10 px-4 py-3 text-sm">
                              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                              <span className="text-zinc-300"><span className="font-semibold text-emerald-400">Po ukończeniu: </span>{milestone.successTrigger}</span>
                            </div>
                          )}
                          {milestone.failTrigger && (
                            <div className="flex items-start gap-3 rounded-xl border border-amber-900/30 bg-amber-950/10 px-4 py-3 text-sm">
                              <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                              <span className="text-zinc-300"><span className="font-semibold text-amber-400">Gdy utknąłem: </span>{milestone.failTrigger}</span>
                            </div>
                          )}
                        </div>
                      )}
                      <p className="text-xs font-medium text-zinc-600">
                        ↓ Etap zalicza się automatycznie gdy ukończysz wszystkie poniższe kroki
                      </p>
                    </div>
                  </div>
                )}

                {/* CHILDREN */}
                {children.length > 0 && (
                  <div className="ml-5 mt-1 flex flex-col border-l border-zinc-800 pl-5">
                    {children.map((child, cIdx) => {
                      const cLocked = lockStates.get(child.id) ?? false;
                      const cFocus = focusId === child.id;
                      const cDone = isChildDone(child);
                      const cExpanded = expandedId === child.id;
                      const sessDone = child.sessionsCompleted ?? 0;
                      const sessReq = child.sessionsRequired ?? 7;

                      return (
                        <React.Fragment key={child.id}>
                          <div className="mb-1 mt-2" />
                          <div
                            onClick={() => !cLocked && toggle(child.id)}
                            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-300
                              ${cLocked
                                ? "cursor-not-allowed border-zinc-800/30 bg-zinc-900/20 opacity-40"
                                : cDone
                                  ? "border-emerald-900/30 bg-emerald-950/10 hover:bg-emerald-950/20"
                                  : cFocus
                                    ? "focus-pulse border-emerald-500/40 bg-zinc-900 hover:bg-zinc-800/80"
                                    : "border-zinc-800 bg-zinc-900/60 hover:border-zinc-700 hover:bg-zinc-800/60"
                              }
                            `}
                          >
                            {/* Status */}
                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-500 ${
                              cDone ? "bg-emerald-500 text-white" : cLocked ? "bg-zinc-800 text-zinc-700" : "border border-zinc-700 bg-zinc-800/50 text-zinc-600"
                            }`}>
                              <span className={animatingIds.has(child.id) && cDone ? "check-pop" : ""}>
                                {cDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : cLocked ? <Lock className="h-3 w-3" /> : <span className="text-[10px] font-bold">{cIdx + 1}</span>}
                              </span>
                            </div>

                            {/* Title + session bar */}
                            <div className="flex min-w-0 flex-1 flex-col gap-1">
                              <div className="flex items-center gap-2">
                                {child.cardTitle && <p className="text-[9px] font-semibold uppercase tracking-widest text-zinc-600">{child.cardTitle}</p>}
                                {cFocus && !cLocked && !cDone && (
                                  <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 ring-1 ring-emerald-500/20">TERAZ</span>
                                )}
                              </div>
                              <p className={`text-sm font-medium ${cDone ? "text-zinc-500 line-through" : cLocked ? "text-zinc-700" : "text-zinc-100"}`}>
                                {child.title}
                              </p>
                              {!cLocked && <SessionBar done={sessDone} required={sessReq} compact />}
                            </div>

                            {!cLocked && (
                              <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-700 transition-transform duration-300 ${cExpanded ? "-rotate-180" : ""}`} />
                            )}
                          </div>

                          {cExpanded && !cLocked && (
                            <ChildDetail
                              milestone={child}
                              isLocked={cLocked}
                              onAddSession={() => addSession(child.id)}
                              onResetSessions={() => removeSession(child.id)}
                              onEdit={() => { setEditingMilestone(child); setExpandedId(null); }}
                              onExerciseClick={(id) => router.push(`/profile/exercises?exerciseId=${id}`)}
                            />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}
              </React.Fragment>
            );
          })}

          {/* FINISH */}
          {items.length > 0 && (
            <>
              <Connector done={items[items.length - 1].isCompleted} />
              <div className={`flex items-center gap-3 rounded-2xl border px-5 py-4 transition-all duration-700 ${
                progress === 100
                  ? "border-emerald-500/30 bg-emerald-950/20"
                  : "border-zinc-800 bg-zinc-900/30 opacity-40 grayscale"
              }`}>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl ${progress === 100 ? "bg-emerald-500" : "bg-zinc-800"}`}>
                  🏆
                </div>
                <div>
                  <p className={`text-sm font-bold ${progress === 100 ? "text-zinc-100" : "text-zinc-600"}`}>
                    {progress === 100 ? "Cel osiągnięty!" : "Meta"}
                  </p>
                  <p className="text-xs text-zinc-600">{roadmap.goal}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {editingMilestone && (
        <EditModal
          milestone={editingMilestone}
          onSave={handleSaveEdit}
          onClose={() => setEditingMilestone(null)}
        />
      )}
    </>
  );
};

export default RoadmapView;
