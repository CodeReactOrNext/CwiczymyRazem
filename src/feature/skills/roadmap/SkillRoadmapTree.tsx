import { motion } from "framer-motion";
import { useTranslation } from "hooks/useTranslation";
import { memo, useLayoutEffect, useRef } from "react";

import type { RoadmapTier } from "./skillRoadmap.data";
import type { LayoutBranch, RoadmapLayout } from "./skillRoadmapLayout";
import { ROADMAP_GEOMETRY as G } from "./skillRoadmapLayout";
import type { RoadmapNodeState, RoadmapProgress } from "./skillRoadmapStates";
import { useSkillRoadmapLabels } from "./useSkillRoadmapLabels";

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
  /** The view's zoom; below 1:1 the small text grows to stay readable. */
  scale?: number;
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
  slot: "#27272a", // zinc-800, an untouched dot — a quiet place waiting to be filled
  mark: "#3f3f46", // zinc-700, difficulty pips — there when looked for, quiet otherwise
  ring: "#52525b", // zinc-600, the root of a branch not yet started
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

/** Largest a text may grow to stay readable on a zoomed-out map. */
const MAX_TEXT_BOOST = 1.3;

/**
 * Font sizes in map units for the current zoom. Each text has the size it is
 * designed at and a smallest size in screen pixels; below 1:1 the units grow
 * to hold that minimum, up to MAX_TEXT_BOOST, so a laptop-width map keeps its
 * levels and counts legible while a wide screen draws them as designed.
 */
const typeScaleFor = (scale: number) => {
  const size = (units: number, minPx: number) =>
    units * Math.min(MAX_TEXT_BOOST, Math.max(1, minPx / (units * scale)));
  return {
    title: size(20, 15),
    count: size(11, 11),
    number: size(14, 12),
    label: size(12.5, 12),
    level: size(10.5, 11),
  };
};

type TypeScale = ReturnType<typeof typeScaleFor>;

/**
 * Average advance of Inter, as a share of the font size. Only places a level
 * until the real text can be measured, and in static renders.
 */
const INTER_ADVANCE = 0.56;
const textWidth = (text: string, fontSize: number) =>
  text.length * fontSize * INTER_ADVANCE;

/** The least room between a branch's name and its level. */
const LEVEL_GAP = 10;

/** Where a milestone's name and count sit below its circle's bottom edge. */
const CAPTION_TITLE_DY = 28;
const CAPTION_COUNT_DY = 47;

/** Height a milestone's name and count occupy under its circle. */
const CAPTION_BLOCK = 54;

/** Difficulty pips: tiny, tight, just under the dot that starts a group. */
const PIP_RADIUS = 1;
const PIP_SPACING = 3.4;
const PIP_DY = G.dotRadius + 4.5;

/** One to four pips under the first dot of a difficulty group. */
const DifficultyPips = ({
  x,
  y,
  level,
}: {
  x: number;
  y: number;
  level: number;
}) => (
  <g aria-hidden='true'>
    {Array.from({ length: level }, (_, i) => (
      <circle
        key={i}
        cx={x + (i - (level - 1) / 2) * PIP_SPACING}
        cy={y + PIP_DY}
        r={PIP_RADIUS}
        fill={INK.mark}
      />
    ))}
  </g>
);

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

/**
 * Solid for what is done, a ring for what is next, a dim solid for the rest.
 * Done and untouched differ in colour and brightness, so no tick is needed.
 */
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
    return <circle cx={x} cy={y} r={r} fill={INK.done} />;
  }
  if (state === "current") {
    return (
      <>
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
  return <circle cx={x} cy={y} r={r} fill={INK.slot} />;
};

/**
 * A branch's name and level. The level closes the header over the end of the
 * first row, so levels line up with their chains; a row shorter than the name
 * lets it follow the name instead. The name is measured once it is laid out —
 * and again when the web font arrives — so the gap is the same for every
 * branch; the estimate only covers the first paint and static renders.
 */
const BranchHeader = ({
  x,
  y,
  label,
  level,
  firstRowRight,
  started,
  type,
}: {
  x: number;
  y: number;
  label: string;
  level?: number;
  firstRowRight: number;
  started: boolean;
  type: TypeScale;
}) => {
  const nameRef = useRef<SVGTextElement>(null);
  const levelRef = useRef<SVGTextElement>(null);
  const { t } = useTranslation("skills");
  const levelText = level ? t("roadmap.lvl", { level }) : null;
  const estimatedLevelX = levelText
    ? Math.max(
        firstRowRight,
        x +
          textWidth(label, type.label) +
          LEVEL_GAP +
          textWidth(levelText, type.level),
      )
    : 0;

  useLayoutEffect(() => {
    const name = nameRef.current;
    const levelEl = levelRef.current;
    if (!name || !levelEl || typeof name.getComputedTextLength !== "function")
      return undefined;
    let active = true;
    const place = () => {
      if (!active) return;
      const levelX = Math.max(
        firstRowRight,
        x +
          name.getComputedTextLength() +
          LEVEL_GAP +
          levelEl.getComputedTextLength(),
      );
      levelEl.setAttribute("x", String(levelX));
    };
    place();
    void document.fonts?.ready.then(place);
    return () => {
      active = false;
    };
  }, [x, firstRowRight, label, levelText, type.label, type.level]);

  return (
    <>
      <text
        ref={nameRef}
        x={x}
        y={y}
        fontFamily={FONT}
        fontSize={type.label}
        fontWeight={600}
        fill={started ? INK.label : INK.faint}>
        {label}
      </text>
      {levelText && (
        <text
          ref={levelRef}
          x={estimatedLevelX}
          y={y}
          textAnchor='end'
          fontFamily={FONT}
          fontSize={type.level}
          fontWeight={500}
          // Inline, so hovering the name brightens the name and not the level.
          style={{ fill: INK.faint, fontVariantNumeric: "tabular-nums" }}>
          {levelText}
        </text>
      )}
    </>
  );
};

const Branch = ({
  branch,
  label,
  skillId,
  level,
  progress,
  type,
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
  type: TypeScale;
  hoveredId: string | null;
  onNodeHover: SkillRoadmapTreeProps["onNodeHover"];
  onNodeClick: SkillRoadmapTreeProps["onNodeClick"];
  onBranchClick: SkillRoadmapTreeProps["onBranchClick"];
}) => {
  const started = branch.nodes.some(
    (n) => progress.states.get(n.id) === "completed",
  );
  // A branch fed by a skill opens that skill's sheet; the play-along branches
  // belong to no skill, so their names are plain text, not a button.
  const opensSkill = skillId !== "general";

  const activate = () => onBranchClick({ id: branch.id, skillId });

  const header = (
    <BranchHeader
      x={branch.root.x + 11}
      y={branch.labelY}
      label={label}
      level={level}
      firstRowRight={branch.firstRowRight}
      started={started}
      type={type}
    />
  );

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
      {branch.difficultyMarks.map((mark) => (
        <DifficultyPips key={`${mark.x},${mark.y}`} {...mark} />
      ))}
      <circle
        cx={branch.root.x}
        cy={branch.root.y}
        r={2.5}
        fill={started ? INK.done : INK.ring}
      />
      {opensSkill ? (
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
          {header}
        </g>
      ) : (
        header
      )}
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
 * A numbered stop on the trunk, its name and count under it — a tier, or
 * Mastery at the end of the line. Progress runs round the circle and a
 * finished stop is filled in. The trunk breaks for the caption, so the eye
 * reads number → name → count.
 */
const Stop = ({
  x,
  y,
  number,
  title,
  completed,
  total,
  type,
}: {
  x: number;
  y: number;
  number: number;
  title: string;
  completed: number;
  total: number;
  type: TypeScale;
}) => {
  const r = G.milestoneRadius;
  const share = total > 0 ? completed / total : 0;
  const done = total > 0 && completed === total;
  const circumference = 2 * Math.PI * r;

  return (
    <g>
      {done ? (
        <circle cx={x} cy={y} r={r} fill={INK.done} />
      ) : (
        <>
          <circle
            cx={x}
            cy={y}
            r={r}
            fill={INK.page}
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
              strokeWidth={2.5}
              strokeLinecap='round'
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - share)}
              transform={`rotate(-90 ${x} ${y})`}
            />
          )}
        </>
      )}
      <text
        x={x}
        y={y + 1}
        textAnchor='middle'
        dominantBaseline='central'
        fontFamily={FONT}
        fontSize={type.number}
        fontWeight={600}
        fill={done ? INK.page : completed > 0 ? INK.title : INK.muted}
        style={{ fontVariantNumeric: "tabular-nums" }}>
        {String(number).padStart(2, "0")}
      </text>
      <text
        x={x}
        y={y + r + CAPTION_TITLE_DY}
        textAnchor='middle'
        fontFamily={FONT}
        fontSize={type.title}
        fontWeight={600}
        fill={INK.title}>
        {title}
      </text>
      <text
        x={x}
        y={y + r + CAPTION_COUNT_DY}
        textAnchor='middle'
        fontFamily={FONT}
        fontSize={type.count}
        fill={INK.faint}
        style={{ fontVariantNumeric: "tabular-nums" }}>
        {completed} / {total}
      </text>
    </g>
  );
};

/**
 * The stretches of trunk that are actually drawn: from the first milestone
 * down to mastery, everything but the captions.
 */
const trunkSegments = (layout: RoadmapLayout): [number, number][] => {
  const segments: [number, number][] = [];
  let cursor = layout.tiers.length
    ? layout.tiers[0].y + G.milestoneRadius
    : layout.masteryY;
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
  scale = 1,
  animate = true,
}: SkillRoadmapTreeProps) {
  const labels = useSkillRoadmapLabels();
  const tierById = new Map(tiers.map((tier) => [tier.id, tier]));
  const type = typeScaleFor(scale);
  // The spine is lit down to the last tier the player has actually touched.
  const lastStartedIndex = layout.tiers.reduce(
    (last, lt, i) =>
      (progress.byTier.get(lt.id)?.completed ?? 0) > 0 ? i : last,
    -1,
  );
  const litUntil =
    lastStartedIndex >= 0 ? layout.tiers[lastStartedIndex].bottom : 0;

  return (
    <svg
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      width='100%'
      height='100%'
      className='block select-none'
      aria-label={labels.t("roadmap.aria")}>
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

        {layout.tiers.map((lt, index) => {
          const tier = tierById.get(lt.id);
          if (!tier) return null;
          const stats = progress.byTier.get(tier.id) ?? {
            completed: 0,
            total: 0,
          };
          return (
            <g key={lt.id}>
              <Stop
                x={lt.x}
                y={lt.y}
                number={index + 1}
                title={labels.tierTitle(tier)}
                completed={stats.completed}
                total={stats.total}
                type={type}
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
                    label={labels.branchLabel(branch)}
                    skillId={branch.skillId}
                    level={skillLevels[branch.skillId]}
                    progress={progress}
                    type={type}
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
        <Stop
          x={layout.trunkX}
          y={layout.masteryY}
          number={layout.tiers.length + 1}
          title={labels.t("roadmap.mastery")}
          completed={progress.completed}
          total={progress.total}
          type={type}
        />
      </motion.g>
    </svg>
  );
});
