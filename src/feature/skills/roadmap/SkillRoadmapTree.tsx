import { cn } from "assets/lib/utils";
import { RoadPathNode, type RoadTone } from "components/RoadPath/RoadPathNode";
import { memo, type ReactNode, useMemo } from "react";

import type { RoadmapBranch, RoadmapTier } from "./skillRoadmap.data";
import type {
  LayoutBranch,
  LayoutNode,
  RoadmapLayout,
} from "./skillRoadmapLayout";
import { ROADMAP_GEOMETRY as G } from "./skillRoadmapLayout";
import { roadmapLines } from "./skillRoadmapLines";
import type { RoadmapNodeState, RoadmapProgress } from "./skillRoadmapStates";
import { useSkillRoadmapLabels } from "./useSkillRoadmapLabels";

export interface RoadmapNodeHover {
  id: string;
  /** Viewport coordinates of the key's centre, for placing the hover card. */
  screenX: number;
  screenY: number;
}

/** What the bubble under the picked exercise is told about it. */
export interface RoadmapBubbleInfo {
  exerciseId: string;
  /** Position in its skill, from 1. */
  position: number;
  count: number;
  branchLabel: string;
}

interface SkillRoadmapTreeProps {
  tiers: RoadmapTier[];
  layout: RoadmapLayout;
  progress: RoadmapProgress;
  selectedId: string | null;
  onNodeHover: (hover: RoadmapNodeHover | null) => void;
  onNodeSelect: (exerciseId: string) => void;
  onBranchClick: (branch: { id: string; skillId: string }) => void;
  onTierToggle: (tierId: string) => void;
  /** Level per skill id, counted the way the rest of the app counts it. */
  skillLevels: Record<string, number>;
  /** Read out for a key, which only shows its number. */
  exerciseTitle: (exerciseId: string) => string;
  /** What goes in the bubble under the picked exercise. */
  renderBubble: (info: RoadmapBubbleInfo) => ReactNode;
}

/** The ring a key's wrapper adds around its face, per RoadPathNode size. */
const KEY_PAD = { xs: 3, lg: 8 };

/**
 * Finished and up-next speak for themselves. Of the rest, the first unfinished
 * key of a skill is the way in and stays bright; what comes after it is dimmed,
 * so the map shows where to step next instead of a wall of equal keys.
 */
const toneFor = (state: RoadmapNodeState, isWayIn: boolean): RoadTone => {
  if (state === "completed") return "done";
  if (state === "current") return "current";
  if (state === "locked") return "locked";
  return isWayIn ? "open" : "later";
};

const hoverFor = (id: string, element: HTMLElement): RoadmapNodeHover => {
  const rect = element.getBoundingClientRect();
  return {
    id,
    screenX: rect.left + rect.width / 2,
    screenY: rect.top + rect.height / 2,
  };
};

/** One to four pips under the first key of a difficulty group. */
const DifficultyPips = ({
  x,
  y,
  level,
}: {
  x: number;
  y: number;
  level: number;
}) => (
  <g aria-hidden='true' className='fill-zinc-700'>
    {Array.from({ length: level }, (_, i) => (
      <circle
        key={i}
        cx={x + (i - (level - 1) / 2) * 4}
        cy={y + G.keySize / 2 + G.keyLip + 6}
        r={1}
      />
    ))}
  </g>
);

/** Progress round a tier's key, drawn outside the ring that cuts the trunk. */
const ProgressArc = ({
  x,
  y,
  share,
}: {
  x: number;
  y: number;
  share: number;
}) => {
  const r = G.tierKeySize / 2 + 11;
  const cy = y + G.tierKeyLip / 2;
  const circumference = 2 * Math.PI * r;
  return (
    <g fill='none'>
      <circle
        cx={x}
        cy={cy}
        r={r}
        strokeWidth={2}
        className='stroke-zinc-800'
      />
      <circle
        cx={x}
        cy={cy}
        r={r}
        strokeWidth={3}
        strokeLinecap='round'
        strokeDasharray={`${circumference * share} ${circumference}`}
        transform={`rotate(-90 ${x} ${cy})`}
        className='stroke-emerald-500'
      />
    </g>
  );
};

/** A stop's name and count, sitting on the trunk above its key. */
const StopLabel = ({
  top,
  title,
  completed,
  total,
}: {
  top: number;
  title: string;
  completed: number;
  total: number;
}) => (
  <div
    className='absolute left-1/2 z-10 flex -translate-x-1/2 flex-col items-center whitespace-nowrap bg-zinc-950 px-4 py-1.5'
    style={{ top }}>
    <span className='text-xl font-bold tracking-tight text-zinc-100'>
      {title}
    </span>
    <span className='text-[13px] tabular-nums text-zinc-500'>
      {completed} / {total}
    </span>
  </div>
);

/** A stop's number, on its key. */
const StopNumber = ({ number }: { number: number }) => (
  <span className='text-xl font-bold tabular-nums'>
    {String(number).padStart(2, "0")}
  </span>
);

const stopKeyStyle = (x: number, y: number) => ({
  left: x - G.tierKeySize / 2 - KEY_PAD.lg,
  top: y - G.tierKeySize / 2 - KEY_PAD.lg,
});

const Branch = ({
  layoutBranch,
  branch,
  label,
  level,
  mapWidth,
  progress,
  selectedId,
  startLabel,
  levelLabel,
  onNodeHover,
  onNodeSelect,
  onBranchClick,
  exerciseTitle,
  renderBubble,
}: {
  layoutBranch: LayoutBranch;
  branch: RoadmapBranch;
  label: string;
  /** Absent for the play-along branches, which no single skill owns. */
  level?: number;
  mapWidth: number;
  progress: RoadmapProgress;
  selectedId: string | null;
  startLabel: string;
  levelLabel: string | null;
  onNodeHover: SkillRoadmapTreeProps["onNodeHover"];
  onNodeSelect: SkillRoadmapTreeProps["onNodeSelect"];
  onBranchClick: SkillRoadmapTreeProps["onBranchClick"];
  exerciseTitle: SkillRoadmapTreeProps["exerciseTitle"];
  renderBubble: SkillRoadmapTreeProps["renderBubble"];
}) => {
  const stateOf = (node: LayoutNode): RoadmapNodeState =>
    progress.states.get(node.id) ?? "available";
  const { nodes, side, bubble } = layoutBranch;
  const doneCount = nodes.filter((n) => stateOf(n) === "completed").length;
  const wayIn = nodes.findIndex((n) => stateOf(n) !== "completed");
  const touched = doneCount > 0 || nodes.some((n) => stateOf(n) === "current");
  // A branch fed by a skill opens that skill's sheet; the play-along branches
  // belong to no skill, so their names are plain text, not a button.
  const opensSkill = branch.skillId !== "general";
  const nameClass = cn(
    "text-sm font-semibold",
    touched ? "text-zinc-100" : "text-zinc-400",
  );
  const bubbleNode = bubble && nodes.find((n) => n.id === bubble.nodeId);

  return (
    <>
      <div
        className='absolute z-10 flex h-[22px] items-baseline gap-2.5 whitespace-nowrap'
        style={
          side > 0
            ? { top: layoutBranch.top, left: layoutBranch.headerX }
            : { top: layoutBranch.top, right: mapWidth - layoutBranch.headerX }
        }>
        {opensSkill ? (
          <button
            type='button'
            onClick={() =>
              onBranchClick({ id: branch.id, skillId: branch.skillId })
            }
            className={cn(
              nameClass,
              "rounded transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:text-white",
            )}>
            {label}
          </button>
        ) : (
          <span className={nameClass}>{label}</span>
        )}
        {levelLabel && level ? (
          <span className='text-xs tabular-nums text-zinc-500'>
            {levelLabel}
          </span>
        ) : null}
        <span className='text-xs tabular-nums text-zinc-500'>
          {doneCount} / {nodes.length}
        </span>
      </div>

      {nodes.map((node) => {
        const state = stateOf(node);
        return (
          <div
            key={node.id}
            data-exercise-id={node.id}
            className='absolute z-10'
            style={{
              left: node.x - G.keySize / 2 - KEY_PAD.xs,
              top: node.y - G.keySize / 2 - KEY_PAD.xs,
            }}
            onMouseEnter={(e) =>
              onNodeHover(hoverFor(node.id, e.currentTarget))
            }
            onMouseLeave={() => onNodeHover(null)}
            onFocus={(e) => onNodeHover(hoverFor(node.id, e.currentTarget))}
            onBlur={() => onNodeHover(null)}>
            <RoadPathNode
              size='xs'
              tone={toneFor(state, node.index === wayIn)}
              icon={
                <span className='text-[11px] font-semibold tabular-nums'>
                  {node.index + 1}
                </span>
              }
              title={exerciseTitle(node.id)}
              selected={node.id === selectedId}
              startLabel={state === "current" ? startLabel : undefined}
              onClick={() => onNodeSelect(node.id)}
            />
          </div>
        );
      })}

      {bubble && bubbleNode && (
        <div
          className='absolute z-10'
          style={{
            top: bubble.top,
            left: bubble.left,
            width: bubble.width,
            height: G.bubbleHeight,
          }}>
          <span
            aria-hidden='true'
            className='absolute -top-1.5 h-3 w-3 -translate-x-1/2 rotate-45 bg-zinc-900'
            style={{ left: bubble.pointerX }}
          />
          <div className='relative h-full'>
            {renderBubble({
              exerciseId: bubble.nodeId,
              position: bubbleNode.index + 1,
              count: nodes.length,
              branchLabel: label,
            })}
          </div>
        </div>
      )}
    </>
  );
};

/**
 * The skill tree: a straight trunk, a big key per tier, and every exercise a
 * small numbered key on a row that leaves the trunk on its own curve — the same
 * keys and lines as the Journey road. Lines are an SVG underneath; everything
 * that can be pressed is a real button on top of it.
 */
export const SkillRoadmapTree = memo(function SkillRoadmapTree({
  tiers,
  layout,
  progress,
  selectedId,
  onNodeHover,
  onNodeSelect,
  onBranchClick,
  onTierToggle,
  skillLevels,
  exerciseTitle,
  renderBubble,
}: SkillRoadmapTreeProps) {
  const labels = useSkillRoadmapLabels();
  const { t } = labels;
  const tierById = new Map(tiers.map((tier) => [tier.id, tier]));
  const lines = useMemo(
    () => roadmapLines(layout, progress),
    [layout, progress],
  );
  const trunkTop = layout.tiers[0]?.y ?? layout.masteryY;
  const { trunkX } = layout;
  const allDone = progress.total > 0 && progress.completed === progress.total;

  return (
    <div
      role='group'
      aria-label={t("roadmap.aria")}
      className='relative mx-auto select-none'
      style={{ width: layout.width, height: layout.height }}>
      <svg
        aria-hidden='true'
        width={layout.width}
        height={layout.height}
        className='absolute left-0 top-0'
        fill='none'
        strokeWidth={4}
        strokeLinecap='round'
        strokeLinejoin='round'>
        <path
          d={`M ${trunkX} ${trunkTop} L ${trunkX} ${layout.masteryY}`}
          className='stroke-zinc-800'
        />
        {lines.base.map((d) => (
          <path key={d} d={d} className='stroke-zinc-800' />
        ))}
        {lines.sapTo !== null && lines.sapTo > trunkTop && (
          <path
            d={`M ${trunkX} ${trunkTop} L ${trunkX} ${lines.sapTo}`}
            className='stroke-emerald-500'
          />
        )}
        {lines.done.map((d) => (
          <path key={d} d={d} className='stroke-emerald-500' />
        ))}
        {lines.next.map((d) => (
          <path key={d} d={d} className='stroke-cyan-500' />
        ))}
        <g stroke='none'>
          {layout.tiers.flatMap((lt) =>
            lt.branches.flatMap((lb) =>
              lb.difficultyMarks.map((mark) => (
                <DifficultyPips
                  key={`${lb.id}:${mark.x}:${mark.y}`}
                  {...mark}
                />
              )),
            ),
          )}
        </g>
        {layout.tiers.map((lt) => {
          const stats = progress.byTier.get(lt.id);
          if (
            !stats ||
            stats.completed === 0 ||
            stats.completed === stats.total
          )
            return null;
          return (
            <ProgressArc
              key={lt.id}
              x={trunkX}
              y={lt.y}
              share={stats.completed / stats.total}
            />
          );
        })}
      </svg>

      {layout.tiers.map((lt, index) => {
        const tier = tierById.get(lt.id);
        if (!tier) return null;
        const stats = progress.byTier.get(tier.id) ?? {
          completed: 0,
          total: 0,
        };
        const title = labels.tierTitle(tier);
        const holdsCurrent = tier.branches.some((branch) =>
          branch.exercises.some((e) => progress.states.get(e.id) === "current"),
        );
        const tone: RoadTone = holdsCurrent
          ? "current"
          : stats.total > 0 && stats.completed === stats.total
            ? "done"
            : "open";
        return (
          <div key={lt.id}>
            <StopLabel
              top={lt.labelTop}
              title={title}
              completed={stats.completed}
              total={stats.total}
            />
            <div
              className='absolute z-10'
              style={stopKeyStyle(trunkX, lt.y)}
              title={t(
                lt.folded ? "roadmap.show_skills" : "roadmap.hide_skills",
              )}>
              <RoadPathNode
                tone={tone}
                icon={<StopNumber number={index + 1} />}
                title={title}
                selected={lt.folded}
                onClick={() => onTierToggle(tier.id)}
              />
            </div>
            {lt.folded && (
              <p
                className='absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap bg-zinc-950 px-3 py-1 text-xs text-zinc-500'
                style={{ top: lt.foldedNoteTop }}>
                {t("roadmap.skills_hidden", { count: tier.branches.length })}
              </p>
            )}
            {lt.branches.map((lb) => {
              const branch = tier.branches.find((b) => b.id === lb.id);
              if (!branch) return null;
              const level = skillLevels[branch.skillId];
              return (
                <Branch
                  key={lb.id}
                  layoutBranch={lb}
                  branch={branch}
                  label={labels.branchLabel(branch)}
                  level={level}
                  mapWidth={layout.width}
                  progress={progress}
                  selectedId={selectedId}
                  startLabel={t("roadmap.start")}
                  levelLabel={level ? t("roadmap.lvl", { level }) : null}
                  onNodeHover={onNodeHover}
                  onNodeSelect={onNodeSelect}
                  onBranchClick={onBranchClick}
                  exerciseTitle={exerciseTitle}
                  renderBubble={renderBubble}
                />
              );
            })}
          </div>
        );
      })}

      {/* The end of the line: nothing to press, it fills in when all is done. */}
      <StopLabel
        top={layout.masteryLabelTop}
        title={t("roadmap.mastery")}
        completed={progress.completed}
        total={progress.total}
      />
      <div
        className='absolute z-10'
        style={stopKeyStyle(trunkX, layout.masteryY)}>
        <RoadPathNode
          tone={allDone ? "done" : "locked"}
          icon={<StopNumber number={layout.tiers.length + 1} />}
          title={t("roadmap.mastery")}
          disabled
          onClick={() => undefined}
        />
      </div>
    </div>
  );
});
