import { motion } from "framer-motion";
import { memo } from "react";

import type { RoadmapTier } from "./skillRoadmap.data";
import type {
  LayoutBranch,
  LayoutTier,
  RoadmapLayout,
} from "./skillRoadmapLayout";
import { chainPathBetween, ROADMAP_GEOMETRY as G } from "./skillRoadmapLayout";
import type { RoadmapNodeState, RoadmapProgress } from "./skillRoadmapStates";

export interface RoadmapNodeHover {
  id: string;
  /** Map coordinates, for panning to the dot. */
  x: number;
  y: number;
  /** Viewport coordinates of the dot's centre, for placing the hover card. */
  screenX: number;
  screenY: number;
}

interface SkillRoadmapTreeProps {
  tiers: RoadmapTier[];
  layout: RoadmapLayout;
  progress: RoadmapProgress;
  hoveredId: string | null;
  onNodeHover: (hover: RoadmapNodeHover | null) => void;
  onNodeClick: (exerciseId: string) => void;
  onBranchClick: (branch: { id: string; skillId: string }) => void;
  /** Level per skill id, counted the way the rest of the app counts it. */
  skillLevels: Record<string, number>;
  /** Fades the map in on mount; off for static renders. */
  animate?: boolean;
}

/**
 * One ink, three meanings. Everything structural is drawn in neutrals and the
 * three accents are reserved for the states a player acts on: what is done,
 * what is next, and what needs Pro.
 */
const INK = {
  page: "#09090b", // zinc-950, the surface the map is drawn on
  line: "#27272a", // zinc-800, structure
  lineLit: "#3f3f46", // zinc-700, structure on a path already walked
  ring: "#52525b", // zinc-600, an untouched dot
  title: "#f4f4f5", // zinc-100
  label: "#d4d4d8", // zinc-300
  muted: "#a1a1aa", // zinc-400
  faint: "#71717a", // zinc-500
  done: "#10b981", // emerald-500, completed
  next: "#22d3ee", // cyan-400, up next
  locked: "#a16207", // yellow-700, Pro
};

/** Inter, the app's body face — set explicitly because SVG ignores the cascade. */
const FONT = "Inter, ui-sans-serif, system-ui, sans-serif";

/**
 * The parts of a chain already walked: every stretch between two finished
 * neighbours. Exercises are played in whatever order the player likes, so this
 * is a set of segments rather than one run from the start.
 */
const walkedPath = (
  branch: LayoutBranch,
  states: Map<string, RoadmapNodeState>,
): string => {
  const isDone = (i: number) => states.get(branch.nodes[i].id) === "completed";
  const segments: string[] = [];
  for (let i = 0; i + 1 < branch.nodes.length; i += 1) {
    if (isDone(i) && isDone(i + 1)) {
      segments.push(chainPathBetween(branch.nodes, i, i + 1));
    }
  }
  return segments.join(" ");
};

/** Dot identity plus where it currently sits on screen. */
const hoverFor = (
  node: { id: string; x: number; y: number },
  element: SVGGElement,
): RoadmapNodeHover => {
  const rect = element.getBoundingClientRect();
  return {
    id: node.id,
    x: node.x,
    y: node.y,
    screenX: rect.left + rect.width / 2,
    screenY: rect.top + rect.height / 2,
  };
};

const Dot = ({
  state,
  x,
  y,
}: {
  state: RoadmapNodeState;
  x: number;
  y: number;
}) => {
  const r = G.dotRadius;
  if (state === "completed") {
    return (
      <>
        <circle cx={x} cy={y} r={r} fill={INK.done} />
        <path
          d={`M ${x - 3.1} ${y + 0.2} l 2.2 2.3 l 4.1 -4.6`}
          fill='none'
          stroke={INK.page}
          strokeWidth={1.8}
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </>
    );
  }
  if (state === "current") {
    return (
      <>
        <circle
          cx={x}
          cy={y}
          r={r + 3.5}
          fill='none'
          stroke={INK.next}
          strokeWidth={1}
          opacity={0.35}>
          <animate
            attributeName='opacity'
            values='0.35;0.05;0.35'
            dur='2.8s'
            repeatCount='indefinite'
          />
        </circle>
        <circle
          cx={x}
          cy={y}
          r={r}
          fill={INK.page}
          stroke={INK.next}
          strokeWidth={2}
        />
        <circle cx={x} cy={y} r={2.4} fill={INK.next} />
      </>
    );
  }
  if (state === "locked") {
    return (
      <>
        <circle
          cx={x}
          cy={y}
          r={r}
          fill={INK.page}
          stroke={INK.line}
          strokeWidth={1.25}
        />
        <rect
          x={x - 2.6}
          y={y - 0.6}
          width={5.2}
          height={4}
          rx={1}
          fill={INK.locked}
        />
        <path
          d={`M ${x - 1.5} ${y - 0.6} v -1.4 a 1.5 1.5 0 0 1 3 0 v 1.4`}
          fill='none'
          stroke={INK.locked}
          strokeWidth={1}
        />
      </>
    );
  }
  return (
    <circle
      cx={x}
      cy={y}
      r={r}
      fill={INK.page}
      stroke={INK.ring}
      strokeWidth={1.25}
    />
  );
};

const Branch = ({
  branch,
  label,
  skillId,
  level,
  progress,
  hoveredId,
  onNodeHover,
  onNodeClick,
  onBranchClick,
}: {
  branch: LayoutBranch;
  label: string;
  skillId: string;
  /** Absent for the play-along branches, which no single skill owns. */
  level?: number;
  progress: RoadmapProgress;
  hoveredId: string | null;
  onNodeHover: SkillRoadmapTreeProps["onNodeHover"];
  onNodeClick: SkillRoadmapTreeProps["onNodeClick"];
  onBranchClick: SkillRoadmapTreeProps["onBranchClick"];
}) => {
  const started = branch.nodes.some(
    (n) => progress.states.get(n.id) === "completed",
  );
  const walked = walkedPath(branch, progress.states);

  const activate = () => onBranchClick({ id: branch.id, skillId });

  return (
    <g>
      <path
        d={branch.connectorPath}
        fill='none'
        stroke={started ? INK.lineLit : INK.line}
        strokeWidth={1}
      />
      <path
        d={branch.chainPath}
        fill='none'
        stroke={INK.line}
        strokeWidth={1.5}
        strokeLinecap='round'
      />
      {walked && (
        <path
          d={walked}
          fill='none'
          stroke={INK.done}
          strokeWidth={1.5}
          strokeOpacity={0.55}
          strokeLinecap='round'
        />
      )}
      <circle
        cx={branch.root.x}
        cy={branch.root.y}
        r={2.5}
        fill={started ? INK.done : INK.ring}
      />
      <g
        role='button'
        tabIndex={0}
        className='cursor-pointer outline-none [&:focus-visible_text]:fill-zinc-50 [&:hover_text]:fill-zinc-50'
        onClick={activate}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            activate();
          }
        }}>
        <text
          x={branch.root.x + 11}
          y={branch.labelY}
          fontFamily={FONT}
          fontSize={12.5}
          fontWeight={600}
          fill={INK.label}>
          <tspan>{label}</tspan>
          {!!level && (
            <tspan
              dx={9}
              fontSize={10.5}
              fontWeight={500}
              fill={INK.faint}
              style={{ fontVariantNumeric: "tabular-nums" }}>
              Lvl {level}
            </tspan>
          )}
        </text>
      </g>
      {branch.nodes.map((node) => {
        const state = progress.states.get(node.id) ?? "available";
        return (
          <g
            key={node.id}
            data-exercise-id={node.id}
            role='button'
            tabIndex={0}
            className='cursor-pointer outline-none'
            onMouseEnter={(e) => onNodeHover(hoverFor(node, e.currentTarget))}
            onMouseLeave={() => onNodeHover(null)}
            onFocus={(e) => onNodeHover(hoverFor(node, e.currentTarget))}
            onBlur={() => onNodeHover(null)}
            onClick={() => onNodeClick(node.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onNodeClick(node.id);
              }
            }}>
            {/* Generous hit area — the dots themselves are small. */}
            <circle
              cx={node.x}
              cy={node.y}
              r={G.dotSpacing / 2}
              fill='transparent'
            />
            {hoveredId === node.id && (
              <circle
                cx={node.x}
                cy={node.y}
                r={G.dotRadius + 4}
                fill='none'
                stroke={INK.label}
                strokeWidth={1}
              />
            )}
            <Dot state={state} x={node.x} y={node.y} />
          </g>
        );
      })}
    </g>
  );
};

/**
 * A numbered stop on the trunk. The name sits beside it rather than under it,
 * so the spine stays unbroken and the eye reads number → name → count.
 */
const Milestone = ({
  tier,
  layoutTier,
  index,
  progress,
}: {
  tier: RoadmapTier;
  layoutTier: LayoutTier;
  index: number;
  progress: RoadmapProgress;
}) => {
  const r = G.milestoneRadius;
  const { x, y } = layoutTier;
  const stats = progress.byTier.get(tier.id) ?? { completed: 0, total: 0 };
  const share = stats.total > 0 ? stats.completed / stats.total : 0;
  const done = stats.total > 0 && share === 1;
  const circumference = 2 * Math.PI * r;

  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={INK.page} />
      <circle
        cx={x}
        cy={y}
        r={r}
        fill='none'
        stroke={INK.line}
        strokeWidth={1.5}
      />
      {share > 0 && (
        <circle
          cx={x}
          cy={y}
          r={r}
          fill='none'
          stroke={INK.done}
          strokeWidth={1.5}
          strokeLinecap='round'
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - share)}
          transform={`rotate(-90 ${x} ${y})`}
        />
      )}
      <text
        x={x}
        y={y + 1}
        textAnchor='middle'
        dominantBaseline='central'
        fontFamily={FONT}
        fontSize={14}
        fontWeight={600}
        fill={done ? INK.done : stats.completed > 0 ? INK.title : INK.muted}
        style={{ fontVariantNumeric: "tabular-nums" }}>
        {String(index + 1).padStart(2, "0")}
      </text>
      <text
        x={x}
        y={y + r + 26}
        textAnchor='middle'
        fontFamily={FONT}
        fontSize={15}
        fontWeight={600}
        fill={INK.title}>
        {tier.title}
      </text>
      <text
        x={x}
        y={y + r + 44}
        textAnchor='middle'
        fontFamily={FONT}
        fontSize={11}
        fill={INK.faint}
        style={{ fontVariantNumeric: "tabular-nums" }}>
        {stats.completed} of {stats.total} exercises
      </text>
    </g>
  );
};

/** Height a milestone's name and count occupy under its circle. */
const CAPTION_BLOCK = 52;

/** The stretches of trunk that are actually drawn: everything but the captions. */
const trunkSegments = (layout: RoadmapLayout): [number, number][] => {
  const segments: [number, number][] = [];
  let cursor = layout.startY;
  layout.tiers.forEach((lt) => {
    const from = lt.y + G.milestoneRadius;
    if (from > cursor) segments.push([cursor, from]);
    cursor = from + CAPTION_BLOCK;
  });
  const end = layout.masteryY - G.milestoneRadius;
  if (end > cursor) segments.push([cursor, end]);
  return segments;
};

export const SkillRoadmapTree = memo(function SkillRoadmapTree({
  tiers,
  layout,
  progress,
  hoveredId,
  onNodeHover,
  onNodeClick,
  onBranchClick,
  skillLevels,
  animate = true,
}: SkillRoadmapTreeProps) {
  const tierById = new Map(tiers.map((t) => [t.id, t]));
  const allDone = progress.total > 0 && progress.completed === progress.total;
  // The spine is lit down to the last tier the player has actually touched.
  const lastStartedIndex = layout.tiers.reduce(
    (last, lt, i) =>
      (progress.byTier.get(lt.id)?.completed ?? 0) > 0 ? i : last,
    -1,
  );
  const litUntil =
    lastStartedIndex >= 0
      ? layout.tiers[lastStartedIndex].bottom
      : layout.startY;

  return (
    <svg
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      width='100%'
      height='100%'
      className='block select-none'
      aria-label='Skill roadmap'>
      <motion.g
        initial={animate ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}>
        {/* The spine, drawn in segments so it never strikes through a caption,
            and brighter over the stretch already walked. */}
        {trunkSegments(layout).map(([from, to]) => (
          <g key={from}>
            <line
              x1={layout.trunkX}
              y1={from}
              x2={layout.trunkX}
              y2={to}
              stroke={INK.line}
              strokeWidth={1.5}
            />
            {litUntil > from && (
              <line
                x1={layout.trunkX}
                y1={from}
                x2={layout.trunkX}
                y2={Math.min(to, litUntil)}
                stroke={INK.lineLit}
                strokeWidth={1.5}
              />
            )}
          </g>
        ))}

        {/* Start */}
        <g>
          <circle
            cx={layout.trunkX}
            cy={layout.startY}
            r={5}
            fill={INK.page}
            stroke={INK.ring}
            strokeWidth={1.5}
          />
          <text
            x={layout.trunkX}
            y={layout.startY - 16}
            textAnchor='middle'
            fontFamily={FONT}
            fontSize={12}
            fontWeight={600}
            fill={INK.muted}>
            Start
          </text>
        </g>

        {layout.tiers.map((lt, index) => {
          const tier = tierById.get(lt.id);
          if (!tier) return null;
          return (
            <g key={lt.id}>
              <Milestone
                tier={tier}
                layoutTier={lt}
                index={index}
                progress={progress}
              />
              {lt.rails.map((rail) => (
                <path
                  key={rail}
                  d={rail}
                  fill='none'
                  stroke={INK.line}
                  strokeWidth={1}
                />
              ))}
              {lt.branches.map((lb) => {
                const branch = tier.branches.find((b) => b.id === lb.id);
                if (!branch) return null;
                return (
                  <Branch
                    key={lb.id}
                    branch={lb}
                    label={branch.label}
                    skillId={branch.skillId}
                    level={skillLevels[branch.skillId]}
                    progress={progress}
                    hoveredId={hoveredId}
                    onNodeHover={onNodeHover}
                    onNodeClick={onNodeClick}
                    onBranchClick={onBranchClick}
                  />
                );
              })}
            </g>
          );
        })}

        {/* The end of the line */}
        <g>
          <circle
            cx={layout.trunkX}
            cy={layout.masteryY}
            r={G.milestoneRadius}
            fill={allDone ? INK.done : INK.page}
            stroke={allDone ? INK.done : INK.line}
            strokeWidth={1.5}
          />
          <text
            x={layout.trunkX}
            y={layout.masteryY + 1}
            textAnchor='middle'
            dominantBaseline='central'
            fontFamily={FONT}
            fontSize={14}
            fontWeight={600}
            fill={allDone ? INK.page : INK.muted}
            style={{ fontVariantNumeric: "tabular-nums" }}>
            {String(layout.tiers.length + 1).padStart(2, "0")}
          </text>
          <text
            x={layout.trunkX}
            y={layout.masteryY + G.milestoneRadius + 26}
            textAnchor='middle'
            fontFamily={FONT}
            fontSize={15}
            fontWeight={600}
            fill={INK.title}>
            Mastery
          </text>
          <text
            x={layout.trunkX}
            y={layout.masteryY + G.milestoneRadius + 44}
            textAnchor='middle'
            fontFamily={FONT}
            fontSize={11}
            fill={INK.faint}
            style={{ fontVariantNumeric: "tabular-nums" }}>
            {progress.completed} of {progress.total} exercises
          </text>
        </g>
      </motion.g>
    </svg>
  );
});
