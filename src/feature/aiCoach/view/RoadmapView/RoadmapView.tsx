import React, { useState, useMemo } from "react";
import {
  CheckCircle2,
  Circle,
  Edit2,
  Trash2,
  X,
  Calendar,
  Target,
  Zap,
  Activity,
  ArrowRight,
  RotateCcw,
  PlayCircle,
  Dumbbell,
  Youtube
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

const LAYOUT = {
  PADDING_V: 40,
  ROOT_W: 200,
  L1_W: 260,
  L2_W: 300,
  COL0_X: 0,
  COL1_X: 280,
  COL2_X: 620,
  NODE_H: 104,
  CHILD_GAP: 24,
  L1_GAP: 48,
  TOTAL_W: 960,
};

interface PositionedNode {
  id: string;
  title: string;
  cardTitle?: string;
  cardDetailedText?: string;
  isCompleted: boolean;
  isLocked?: boolean;
  x: number;
  y: number;
  w: number;
  h: number;
  depth: number;
  parentId?: string;
  milestoneRef: RoadmapMilestone;
}

function buildLayout(milestones: RoadmapMilestone[]): {
  nodes: PositionedNode[];
  totalH: number;
} {
  const nodes: PositionedNode[] = [];
  let curY = LAYOUT.PADDING_V;

  let allPreviousCompleted = true; // do śledzenia co jest dostępne

  for (const m of milestones) {
    const children = m.children ?? [];
    const hasChildren = children.length > 0;
    const childTotalH = children.length * LAYOUT.NODE_H + Math.max(0, children.length - 1) * LAYOUT.CHILD_GAP;

    const isPhaseLocked = !allPreviousCompleted;
    if (!m.isCompleted) allPreviousCompleted = false;

    if (hasChildren) {
      const l1CenterY = curY + childTotalH / 2;
      nodes.push({ id: m.id, title: m.title, cardTitle: m.cardTitle, cardDetailedText: m.cardDetailedText, isCompleted: m.isCompleted, isLocked: isPhaseLocked, x: LAYOUT.COL1_X, y: l1CenterY, w: LAYOUT.L1_W, h: LAYOUT.NODE_H, depth: 1, milestoneRef: m });

      let allPrevChildrenCompleted = true;
      for (let j = 0; j < children.length; j++) {
        const child = children[j];
        const childCenterY = curY + j * (LAYOUT.NODE_H + LAYOUT.CHILD_GAP) + LAYOUT.NODE_H / 2;
        const isChildLocked = isPhaseLocked || (!allPrevChildrenCompleted);
        if (!child.isCompleted) allPrevChildrenCompleted = false;

        nodes.push({ id: child.id, title: child.title, cardTitle: child.cardTitle, cardDetailedText: child.cardDetailedText, isCompleted: child.isCompleted, isLocked: isChildLocked, x: LAYOUT.COL2_X, y: childCenterY, w: LAYOUT.L2_W, h: LAYOUT.NODE_H, depth: 2, parentId: m.id, milestoneRef: child });
      }
      curY += childTotalH + LAYOUT.L1_GAP;
    } else {
      nodes.push({ id: m.id, title: m.title, cardTitle: m.cardTitle, cardDetailedText: m.cardDetailedText, isCompleted: m.isCompleted, isLocked: isPhaseLocked, x: LAYOUT.COL1_X, y: curY + LAYOUT.NODE_H / 2, w: LAYOUT.L1_W, h: LAYOUT.NODE_H, depth: 1, milestoneRef: m });
      curY += LAYOUT.NODE_H + LAYOUT.L1_GAP;
    }
  }

  const totalH = Math.max(curY + LAYOUT.PADDING_V - LAYOUT.L1_GAP, 240);

  nodes.push({ id: "__root__", title: "", isCompleted: false, x: LAYOUT.COL0_X, y: totalH / 2, w: LAYOUT.ROOT_W, h: 120, depth: 0, milestoneRef: {} as RoadmapMilestone });

  return { nodes, totalH };
}

function bezierHorizontal(x1: number, y1: number, x2: number, y2: number): string {
  const cx = x1 + (x2 - x1) * 0.5;
  return `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`;
}

const EditModal: React.FC<{ milestone: RoadmapMilestone; onSave: (m: RoadmapMilestone) => void; onClose: () => void }> = ({ milestone, onSave, onClose }) => {
  const [local, setLocal] = useState(milestone);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}>
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-5">
          <span className="text-base font-semibold text-zinc-100">Edytuj krok</span>
          <button onClick={onClose} className="text-zinc-500 transition hover:text-zinc-200"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto p-6">
          {([{ label: "Tytuł", key: "title" }, { label: "Etap / Data", key: "cardTitle" }, { label: "Kryterium sukcesu", key: "successCriteria" }, { label: "Trigger sukcesu", key: "successTrigger" }, { label: "Trigger porażki", key: "failTrigger" }] as const).map(({ label, key }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-xs uppercase tracking-widest text-zinc-500">{label}</label>
              <input className="rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" value={(local as any)[key] || ""} onChange={(e) => setLocal({ ...local, [key]: e.target.value })} />
            </div>
          ))}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs uppercase tracking-widest text-zinc-500">Szczegóły</label>
            <textarea className="resize-none rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500" rows={4} value={local.cardDetailedText || ""} onChange={(e) => setLocal({ ...local, cardDetailedText: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-zinc-800 px-6 py-5">
          <button onClick={onClose} className="rounded-xl border border-zinc-700 bg-zinc-800 px-5 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-700">Anuluj</button>
          <button onClick={() => onSave(local)} className="rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-500">Zapisz</button>
        </div>
      </div>
    </div>
  );
};

const NodeDetail: React.FC<{ milestone: RoadmapMilestone; isLocked: boolean; onClose: () => void; onToggle: () => void; onEdit: () => void; router: ReturnType<typeof useRouter> }> = ({ milestone: m, isLocked, onClose, onToggle, onEdit, router }) => {
  const exId = m.exerciseId;
  const isExValid = exId && !exId.includes("null");
  const linkedEx = isExValid ? exercisesAgregat.find((e) => e.id === exId) : null;
  const displayTitle = linkedEx?.title || m.exerciseTitle || "Otwórz ćwiczenie";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-zinc-700 bg-zinc-900 shadow-2xl ring-1 ring-white/10">
        <div className="flex items-start justify-between border-b border-zinc-800 px-8 py-6" style={{ background: m.isCompleted ? "rgba(6,182,212,0.05)" : isLocked ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.02)" }}>
          <div className="flex flex-col gap-1.5">
            {m.cardTitle && <div className="text-xs font-bold uppercase tracking-widest text-cyan-500/80">{m.cardTitle}</div>}
            <div className="text-2xl font-bold text-zinc-100">{m.title}</div>
            {isLocked && <div className="mt-1 text-xs font-medium text-red-400">🔒 Ukończ poprzednie kroki, aby odblokować.</div>}
          </div>
          <button onClick={onClose} className="rounded-full bg-zinc-800/80 p-2 text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-100"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex flex-col gap-6 p-8">
          {(m.startDate || m.endDate) && (
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
              <Calendar className="h-4 w-4 text-zinc-500" />
              {m.startDate} <ArrowRight className="h-3 w-3 opacity-50" /> {m.endDate}
            </div>
          )}

          {m.cardDetailedText && (
            <div className="rounded-2xl bg-zinc-950/50 p-5 text-sm leading-relaxed text-zinc-300">
              {m.cardDetailedText}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {m.successCriteria && (
              <div className="flex items-start gap-3 rounded-2xl border border-cyan-900/40 bg-cyan-950/20 p-5 shadow-inner">
                <Target className="mt-0.5 h-5 w-5 shrink-0 text-cyan-500" />
                <div className="flex flex-col gap-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-widest text-cyan-500">Kryterium sukcesu</div>
                  <div className="text-sm font-medium text-cyan-50">{m.successCriteria}</div>
                </div>
              </div>
            )}

            {m.targetBpm && (
              <div className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-5">
                <Activity className="h-5 w-5 text-cyan-500" />
                <div className="flex flex-col gap-0.5">
                  <div className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Cel Tempo</div>
                  <div className="text-sm font-bold text-cyan-400">{m.targetBpm} BPM</div>
                </div>
              </div>
            )}
          </div>

          {(m.successTrigger || m.failTrigger || m.youtubeUrl) && (
            <div className="flex flex-col gap-3">
              {m.youtubeUrl && (
                <a href={m.youtubeUrl} target="_blank" rel="noreferrer" className="flex w-fit items-center gap-2.5 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-500/20">
                  <Youtube className="h-5 w-5" />
                  Zobacz lekcję na YouTube
                </a>
              )}
              {m.successTrigger && (
                <div className="flex items-start gap-3 rounded-xl border border-cyan-900/30 bg-cyan-950/10 px-4 py-3 text-sm">
                  <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500" />
                  <span className="text-zinc-300"><span className="font-semibold text-cyan-500">Sukces → </span>{m.successTrigger}</span>
                </div>
              )}
              {m.failTrigger && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-900/30 bg-amber-950/10 px-4 py-3 text-sm">
                  <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <span className="text-zinc-300"><span className="font-semibold text-amber-500">Utknąłeś? → </span>{m.failTrigger}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-950/80 px-8 py-6">
          <div className="flex gap-3">
            <button onClick={onEdit} className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-zinc-700">
              <Edit2 className="h-4 w-4" /> Edytuj
            </button>
            <button
              onClick={onToggle}
              disabled={isLocked && !m.isCompleted}
              className={`flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-bold transition ${isLocked && !m.isCompleted ? "opacity-50 cursor-not-allowed border-zinc-700 bg-zinc-800 text-zinc-500" : m.isCompleted ? "border-cyan-900/40 bg-cyan-950/30 text-cyan-500 hover:bg-cyan-900/20 hover:text-cyan-400" : "border-cyan-500 bg-cyan-600 text-white hover:bg-cyan-500 shadow-lg shadow-cyan-900/20"}`}
            >
              {m.isCompleted ? <><CheckCircle2 className="h-4 w-4" /> Ukończono (Cofnij)</> : <><CheckCircle2 className="h-4 w-4" /> Zaznacz jako zrobione</>}
            </button>
          </div>
          {isExValid && (
            <button
              onClick={() => { router.push(`/profile/skills?start=${linkedEx!.id}`); onClose(); }}
              className="flex items-center gap-2 rounded-xl bg-zinc-100 px-6 py-2.5 text-sm font-bold text-zinc-900 shadow-lg transition hover:bg-white hover:scale-105 active:scale-95"
            >
              <Dumbbell className="h-4 w-4" />
              Idź ćwiczyć
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const NodeCard: React.FC<{ node: PositionedNode; onOpen: (m: RoadmapMilestone, locked: boolean) => void; onExerciseClick: (id: string) => void }> = ({ node, onOpen, onExerciseClick }) => {
  const exId = node.milestoneRef.exerciseId;
  const isExValid = exId && !exId.includes("null");
  const linkedEx = isExValid ? exercisesAgregat.find((e) => e.id === exId) : null;
  const displayTitle = linkedEx?.title || node.milestoneRef.exerciseTitle || "Otwórz ćwiczenie";

  const isCompleted = node.isCompleted;
  const isLocked = node.isLocked && !isCompleted;
  
  // Style statusów
  const bgClass = isCompleted 
    ? "bg-zinc-900/50 border-cyan-500/30" 
    : isLocked 
      ? "bg-zinc-950/60 border-zinc-800 opacity-60 grayscale" 
      : "bg-zinc-800 border-zinc-600 ring-1 ring-cyan-500/20 hover:ring-cyan-500/50 shadow-xl shadow-black/40 hover:-translate-y-1 hover:border-cyan-500";

  return (
    <div
      onClick={() => onOpen(node.milestoneRef, !!isLocked)}
      className={`absolute flex cursor-pointer flex-col justify-center gap-2 rounded-2xl border p-5 text-left transition-all duration-300 ${bgClass}`}
      style={{ left: node.x, top: node.y - node.h / 2, width: node.w, height: node.h, zIndex: isLocked ? 1 : 10 }}
    >
      <div className="flex w-full items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          {node.cardTitle && (
            <span className={`truncate text-[10px] font-bold uppercase tracking-widest ${isCompleted ? 'text-cyan-600/60' : isLocked ? 'text-zinc-600' : 'text-cyan-400'}`}>
              {node.cardTitle}
            </span>
          )}
          <span className={`truncate text-base font-bold leading-tight ${isCompleted ? 'text-zinc-500 line-through' : isLocked ? 'text-zinc-600' : 'text-zinc-50'}`} title={node.title}>
            {node.title}
          </span>
        </div>
        <div className="mt-0.5 shrink-0 transition-colors">
          {isCompleted 
            ? <CheckCircle2 className="h-6 w-6 text-cyan-600" /> 
            : isLocked 
              ? <Circle className="h-6 w-6 text-zinc-800" /> 
              : <Circle className="h-6 w-6 text-zinc-500" />
          }
        </div>
      </div>

      <div className="flex flex-col gap-1.5 pr-4">
        {node.milestoneRef.successCriteria && (
          <span className={`truncate text-xs font-medium ${isCompleted ? 'text-zinc-600' : isLocked ? 'text-zinc-700' : 'text-cyan-300/80'}`} title={node.milestoneRef.successCriteria}>
            🎯 {node.milestoneRef.successCriteria}
          </span>
        )}
        {isExValid && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (linkedEx && !isLocked) onExerciseClick(linkedEx.id);
            }}
            disabled={!!isLocked}
            className={`flex w-fit items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-all ${isCompleted ? 'bg-zinc-800 text-zinc-500' : isLocked ? 'bg-zinc-900/50 text-zinc-700' : 'bg-cyan-500 text-cyan-950 hover:bg-cyan-400 hover:scale-105 hover:shadow-lg shadow-cyan-500/20'}`}
            title={displayTitle}
          >
            <Dumbbell className="h-3.5 w-3.5" />
            <span className="truncate max-w-[180px]">{displayTitle}</span>
          </button>
        )}
      </div>
    </div>
  );
};

const RoadmapView: React.FC<RoadmapViewProps> = ({ roadmap, onDelete }) => {
  const router = useRouter();
  const [items, setItems] = useState(roadmap.milestones);
  const [detailMilestone, setDetailMilestone] = useState<{m: RoadmapMilestone, locked: boolean} | null>(null);
  const [editingMilestone, setEditingMilestone] = useState<RoadmapMilestone | null>(null);

  const { nodes, totalH } = useMemo(() => buildLayout(items), [items]);

  const allLeaves = nodes.filter((n) => n.depth > 0);
  const completedLeaves = allLeaves.filter((n) => n.isCompleted).length;
  const progress = allLeaves.length > 0 ? Math.round((completedLeaves / allLeaves.length) * 100) : 0;
  const rootNode = nodes.find((n) => n.id === "__root__")!;

  const firstDate = items[0]?.startDate;
  const lastDate = items[items.length - 1]?.endDate;

  const findAndUpdate = (milestones: RoadmapMilestone[], id: string, updater: (m: RoadmapMilestone) => RoadmapMilestone): RoadmapMilestone[] =>
    milestones.map((m) => {
      if (m.id === id) return updater(m);
      if (m.children) return { ...m, children: findAndUpdate(m.children, id, updater) };
      return m;
    });

  const toggleMilestone = async (id: string, parentId?: string) => {
    const updated = parentId
      ? items.map((m) => m.id === parentId ? { ...m, children: (m.children ?? []).map((c) => c.id === id ? { ...c, isCompleted: !c.isCompleted } : c) } : m)
      : items.map((m) => m.id === id ? { ...m, isCompleted: !m.isCompleted } : m);

    setItems(updated);
    if (detailMilestone?.m.id === id) {
      const found = findAndUpdate(updated, id, (m) => m).find((m) => m.id === id) || (updated.flatMap((m) => m.children ?? []).find((c) => c.id === id));
      if (found) {
        // Obliczamy nowy status zablokowania dla otwartego
        const { nodes: newNodes } = buildLayout(updated);
        const lockedStatus = newNodes.find(n => n.id === id)?.isLocked || false;
        setDetailMilestone({m: found, locked: lockedStatus});
      }
    }
    try { await firebaseUpdateRoadmap(roadmap.id, { milestones: updated }); }
    catch { toast.error("Błąd podczas zapisywania."); }
  };

  const handleSaveEdit = async (updated: RoadmapMilestone) => {
    const updateNested = (list: RoadmapMilestone[]): RoadmapMilestone[] =>
      list.map((m) => { if (m.id === updated.id) return { ...m, ...updated }; if (m.children) return { ...m, children: updateNested(m.children) }; return m; });

    const updatedMilestones = updateNested(items);
    setItems(updatedMilestones);
    setEditingMilestone(null);
    setDetailMilestone(null); // Zamykamy modal by odświeżył stan czysto
    try { await firebaseUpdateRoadmap(roadmap.id, { milestones: updatedMilestones }); toast.success("Zaktualizowano."); }
    catch { toast.error("Błąd podczas zapisywania."); }
  };

  const handleDelete = async () => {
    if (window.confirm("Czy na pewno chcesz usunąć tę roadmapę?")) {
      try { await firebaseDeleteRoadmap(roadmap.id); onDelete(); toast.success("Roadmapa usunięta."); }
      catch { toast.error("Błąd podczas usuwania."); }
    }
  };

  const svgPaths = useMemo(() => {
    const paths: { d: string; completed: boolean, active: boolean }[] = [];
    for (const node of nodes) {
      if (node.depth === 0) continue;
      const parent = node.depth === 1 ? rootNode : nodes.find((n) => n.id === node.parentId);
      if (!parent) continue;
      const isPathActive = !node.isLocked || node.isCompleted;
      paths.push({ d: bezierHorizontal(parent.x + parent.w, parent.y, node.x, node.y), completed: node.isCompleted, active: isPathActive });
    }
    return paths;
  }, [nodes, rootNode]);

  return (
    <div className="flex flex-col gap-8 rounded-[2rem] border border-cyan-900/30 bg-zinc-950 p-6 shadow-2xl md:p-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black tracking-tight text-white">{roadmap.title}</h2>
          <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-zinc-400">
            <span className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5"><Activity className="h-4 w-4 text-cyan-500" /> {completedLeaves}/{allLeaves.length} ukończono</span>
            <span className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5"><Zap className="h-4 w-4 text-cyan-500" /> {progress}% postępu</span>
            {firstDate && lastDate && (
              <span className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5"><Calendar className="h-4 w-4 text-zinc-500" /> {firstDate} - {lastDate}</span>
            )}
          </div>
        </div>
        <button onClick={handleDelete} className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-red-900/50 bg-red-950/30 px-5 py-2.5 text-sm font-bold text-red-400 transition hover:bg-red-900/50 hover:text-red-300">
          <Trash2 className="h-4 w-4" /> Usuń plan
        </button>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-900 ring-1 ring-inset ring-black/50">
        <div className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
      </div>

      <div className="overflow-x-auto pb-8 pt-4">
        <div className="relative mx-auto mt-4" style={{ width: LAYOUT.TOTAL_W, height: totalH }}>
          <svg className="pointer-events-none absolute inset-0" width={LAYOUT.TOTAL_W} height={totalH} style={{ overflow: "visible" }}>
            {svgPaths.map((p, i) => (
              <path key={i} d={p.d} fill="none" stroke={p.completed ? "#0891b2" : p.active ? "#3f3f46" : "#27272a"} strokeWidth={p.completed ? 3 : p.active ? 2 : 1} strokeDasharray={p.active && !p.completed ? "6 6" : undefined} opacity={p.completed ? 1 : p.active ? 0.6 : 0.3} className={p.completed ? "" : p.active ? "animate-pulse" : ""} />
            ))}
          </svg>

          {rootNode && (
            <div className="absolute flex flex-col items-center justify-center rounded-[2rem] border-2 px-5 py-6 text-center shadow-2xl" style={{ left: rootNode.x, top: rootNode.y - rootNode.h / 2, width: rootNode.w, height: rootNode.h, borderColor: "rgba(6,182,212,0.5)", background: "linear-gradient(135deg, rgba(6,182,212,0.15), rgba(0,0,0,0))" }}>
              <div className="mb-2 rounded-full bg-cyan-500/20 p-2 text-cyan-400 ring-1 ring-cyan-500/50">
                <Target className="h-6 w-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-cyan-500/80">Cel Ostateczny</span>
              <span className="mt-1.5 text-sm font-extrabold leading-tight text-white">{roadmap.goal}</span>
            </div>
          )}

          {nodes.filter((n) => n.depth > 0).map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              onOpen={(m, locked) => setDetailMilestone({m, locked})}
              onExerciseClick={(id) => router.push(`/profile/skills?start=${id}`)}
            />
          ))}
        </div>
      </div>

      {detailMilestone && (
        <NodeDetail
          milestone={detailMilestone.m}
          isLocked={detailMilestone.locked}
          router={router}
          onClose={() => setDetailMilestone(null)}
          onToggle={() => toggleMilestone(detailMilestone.m.id, nodes.find((n) => n.id === detailMilestone.m.id)?.parentId)}
          onEdit={() => { setEditingMilestone(detailMilestone.m); setDetailMilestone(null); }}
        />
      )}

      {editingMilestone && (
        <EditModal milestone={editingMilestone} onSave={handleSaveEdit} onClose={() => setEditingMilestone(null)} />
      )}
    </div>
  );
};

export default RoadmapView;
