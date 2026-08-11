import { motion } from 'framer-motion';
import { Lock, Music4,Trophy } from 'lucide-react';

import type { NodeStatus } from '../types/scaleTree.types';

interface ScaleTreeGridNodeProps {
  node: any;
  status: NodeStatus;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const FAMILY_COLORS = {
  pentatonic: { accent: '#fbbf24', border: 'border-amber-500/30', glow: 'rgba(251, 191, 36, 0.4)' },
  diatonic: { accent: '#22d3ee', border: 'border-cyan-500/30', glow: 'rgba(34, 211, 238, 0.4)' },
  mode: { accent: '#a78bfa', border: 'border-violet-500/30', glow: 'rgba(167, 139, 250, 0.4)' },
};

// Keyed by pentatonic box number (1–5), not by fret — the spine node shows
// which shape you're on, matching the "Box N" row labels.
const ROMAN_NUMERALS: Record<number, string> = {
  1: 'I',
  2: 'II',
  3: 'III',
  4: 'IV',
  5: 'V',
};

const SCALE_GEOMETRY: Record<string, { sides: number; rotation: number }> = {
  minor_pentatonic: { sides: 5, rotation: 0 },
  major_pentatonic: { sides: 5, rotation: 36 },
  minor: { sides: 7, rotation: 0 },
  major: { sides: 7, rotation: 25.71 },
  dorian: { sides: 6, rotation: 0 },
  phrygian: { sides: 6, rotation: 30 },
  mixolydian: { sides: 8, rotation: 0 },
  lydian: { sides: 8, rotation: 22.5 },
  locrian: { sides: 3, rotation: 0 },
};

// Mixes a hex accent toward black (positive ratio) or white (negative) — used
// for the extruded side of a node and for the highlight on its dots, the same
// trick the learning path uses: a bright face sitting on a darker lip.
function shade(hex: string, ratio: number): string {
  const n = parseInt(hex.slice(1), 16);
  const mix = (channel: number) =>
    Math.round(
      ratio >= 0 ? channel * (1 - ratio) : channel + (255 - channel) * -ratio
    );
  return `rgb(${mix((n >> 16) & 255)},${mix((n >> 8) & 255)},${mix(n & 255)})`;
}

function regularPolygon(sides: number, rotationDeg: number, cx = 50, cy = 50, radius = 48): string {
  const rotationRad = (rotationDeg * Math.PI) / 180;
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = rotationRad + (i * 2 * Math.PI) / sides - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(' ');
}

const CONSTELLATIONS: Record<string, Array<{ x: number; y: number }>> = {
  minor_pentatonic: [{ x: -0.25, y: -0.22 }, { x: 0, y: -0.11 }, { x: -0.15, y: 0.11 }, { x: 0.25, y: 0.22 }],
  major_pentatonic: [{ x: -0.25, y: -0.22 }, { x: -0.08, y: -0.05 }, { x: 0.12, y: 0.11 }, { x: 0.25, y: 0.22 }],
  minor: [{ x: -0.2, y: -0.22 }, { x: -0.2, y: 0.1 }, { x: 0.2, y: -0.1 }, { x: 0.2, y: 0.22 }],
  major: [{ x: -0.25, y: 0.22 }, { x: 0, y: -0.25 }, { x: 0.25, y: 0.22 }],
  dorian: [{ x: 0, y: -0.25 }, { x: -0.25, y: 0 }, { x: 0.25, y: 0 }, { x: 0, y: 0.25 }],
  phrygian: [{ x: -0.25, y: -0.25 }, { x: 0.25, y: -0.25 }, { x: 0, y: 0.25 }],
  mixolydian: [{ x: -0.2, y: -0.2 }, { x: 0.2, y: -0.2 }, { x: 0, y: 0 }, { x: -0.2, y: 0.2 }, { x: 0.2, y: 0.2 }],
  lydian: [{ x: -0.25, y: 0 }, { x: 0, y: -0.22 }, { x: 0.25, y: 0 }, { x: 0, y: 0.22 }],
  locrian: [{ x: -0.25, y: -0.2 }, { x: -0.1, y: 0.2 }, { x: 0.1, y: -0.2 }, { x: 0.25, y: 0.2 }],
};

export function ScaleTreeGridNode({
  node,
  status,
  isSelected,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: ScaleTreeGridNodeProps) {
  const isReward = node.type === 'rewardNode';
  const isSingleString = node.id.includes('single_string');
  const family = node.data?.scaleFamily || 'diatonic';
  const colors = FAMILY_COLORS[family as keyof typeof FAMILY_COLORS] || FAMILY_COLORS.diatonic;
  const isLocked = status === 'locked';
  const isSubnode = node.id.includes('_pos') && !node.id.endsWith('_asc');

  const fillGradId = `fill-grad-${node.id}`;
  const strokeGradId = `stroke-grad-${node.id}`;
  const glossGradId = `gloss-grad-${node.id}`;
  const bevelGradId = `bevel-grad-${node.id}`;
  const dotGradId = `dot-grad-${node.id}`;
  const shadowFilterId = `soft-shadow-${node.id}`;

  // Thickness of the extruded lip, in viewBox units (~4% of the node).
  const depth = isSubnode ? 4 : 5;

  const getShapePoints = () => {
    if (isSingleString) return '50,2 98,50 50,98 2,50';
    const scaleType = node.data?.scaleType as string | undefined;
    const geom = (scaleType && SCALE_GEOMETRY[scaleType]) || { sides: 6, rotation: 0 };
    return regularPolygon(geom.sides, geom.rotation);
  };

  const getShapeSvg = () => {
    const points = getShapePoints();
    // Locked nodes keep the depth but in near-black, so they stay recessive
    const lipColor = isLocked ? '#0a0a0d' : shade(colors.accent, 0.74);

    return (
      <g filter={`url(#${shadowFilterId})`}>
        {/* Extruded lip — an offset copy underneath gives the node thickness */}
        <polygon
          points={points}
          transform={`translate(0 ${depth})`}
          fill={lipColor}
          stroke="none"
        />
        {/* Opaque backing so the lip never shows through the translucent face */}
        <polygon
          points={points}
          fill="#15151a"
          stroke="none"
        />
        <polygon
          points={points}
          className="transition-all duration-300"
          fill={isLocked ? 'none' : `url(#${fillGradId})`}
          stroke={isSelected ? colors.accent : `url(#${strokeGradId})`}
          strokeWidth={isSelected ? 2.4 : 1.4}
          strokeLinejoin="round"
        />
        {/* Top-light + bottom shade across the face — sells the 3D read */}
        <polygon
          points={points}
          fill={`url(#${glossGradId})`}
          stroke="none"
          className="pointer-events-none"
        />
        {/* Inner bevel — a thin rim light along the upper edges */}
        {!isLocked && (
          <polygon
            points={points}
            transform="translate(50 50) scale(0.9) translate(-50 -50)"
            fill="none"
            stroke={`url(#${bevelGradId})`}
            strokeWidth={1.2}
            strokeLinejoin="round"
            className="pointer-events-none"
          />
        )}
      </g>
    );
  };

  const req = node.data?.requiredExercises?.[0];
  const patternType = req?.patternType;

  const getConstellationSvg = () => {
    if (isSingleString || isReward || isLocked || !isSubnode) return null;
    const type = node.data?.scaleType || 'minor_pentatonic';
    const points = CONSTELLATIONS[type] || [];

    const strokeColor = colors.accent;
    const opacityVal = 0.25;

    const verticalFretlines = [-1.5, -0.5, 0.5, 1.5].map((i) => {
      const x = 50 + 50 * 0.25 * i;
      return (
        <line
          key={`v-${i}`}
          x1={x}
          y1={35}
          x2={x}
          y2={65}
          stroke={strokeColor}
          strokeWidth={0.8}
          opacity={opacityVal}
        />
      );
    });

    const horizontalStrings = [-1.0, 0.0, 1.0].map((i) => {
      const y = 50 + 50 * 0.2 * i;
      return (
        <line
          key={`h-${i}`}
          x1={30}
          y1={y}
          x2={70}
          y2={y}
          stroke={strokeColor}
          strokeWidth={0.8}
          opacity={opacityVal}
        />
      );
    });

    let pathD = '';
    if (points.length > 1) {
      pathD = `M ${50 + 50 * points[0].x} ${50 + 50 * points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        pathD += ` L ${50 + 50 * points[i].x} ${50 + 50 * points[i].y}`;
      }
    }

    return (
      <g className="pointer-events-none">
        {verticalFretlines}
        {horizontalStrings}
        {pathD && (
          <path
            d={pathD}
            stroke={strokeColor}
            strokeWidth={0.8}
            fill="none"
            opacity={0.4}
          />
        )}
        {points.map((p, idx) => (
          <circle
            key={`dot-${idx}`}
            cx={50 + 50 * p.x}
            cy={50 + 50 * p.y}
            r={3}
            fill={strokeColor}
            opacity={0.7}
          />
        ))}
      </g>
    );
  };

  const getIconContent = () => {
    // Every icon carries the same soft cast shadow so it reads as floating a
    // little above the node face rather than being printed onto it.
    const iconShadow = 'drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.65)]';

    if (isLocked) {
      return (
        <Lock
          className={`${isSubnode ? 'h-5 w-5' : 'h-6 w-6'} text-zinc-400 ${iconShadow}`}
          strokeWidth={2}
        />
      );
    }

    if (isReward) {
      const isClaimed = node.data?.claimed;
      return (
        <Trophy
          className={`h-8 w-8 ${iconShadow} ${isClaimed ? 'text-emerald-400' : 'text-amber-400'}`}
          strokeWidth={2.2}
        />
      );
    }

    if (isSingleString) {
      return (
        <Music4
          className={`h-9 w-9 ${iconShadow}`}
          style={{ color: colors.accent }}
          strokeWidth={2.2}
        />
      );
    }

    if (isSubnode && patternType) {
      const dotR = 6;
      // Dots are lit from the top-left so they read as beads, not flat discs.
      const renderDots = (pts: Array<[number, number]>) =>
        pts.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={dotR} fill={`url(#${dotGradId})`} stroke="none" />
        ));

      return (
        <svg
          viewBox="0 0 100 100"
          className={`w-11 h-11 z-10 pointer-events-none ${iconShadow}`}
          stroke={colors.accent}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          <defs>
            <radialGradient id={dotGradId} cx="34%" cy="28%" r="78%">
              <stop offset="0%" stopColor={shade(colors.accent, -0.35)} />
              <stop offset="45%" stopColor={colors.accent} />
              <stop offset="100%" stopColor={shade(colors.accent, 0.4)} />
            </radialGradient>
          </defs>
          {patternType === 'descending' && (
            <>
              <polyline points="20,30 40,47 60,64 80,81" />
              {renderDots([[20, 30], [40, 47], [60, 64], [80, 81]])}
            </>
          )}
          {patternType === 'ascending_descending' && (
            <>
              <polyline points="15,75 32,55 50,35 68,55 85,75" />
              {renderDots([[15, 75], [32, 55], [50, 35], [68, 55], [85, 75]])}
            </>
          )}
          {patternType === 'intervals_thirds' && (
            <>
              <path d="M 20 65 Q 35 25 50 65" />
              <path d="M 50 65 Q 65 25 80 65" />
              {renderDots([[20, 65], [50, 65], [80, 65]])}
            </>
          )}
          {patternType === 'intervals_fourths' && (
            <>
              <path d="M 18 70 Q 50 10 82 70" />
              {renderDots([[18, 70], [82, 70]])}
            </>
          )}
          {patternType === 'sequence_3_notes' && (
            <g>
              {renderDots([
                [18, 70], [32, 58], [46, 46],
                [54, 60], [68, 48], [82, 36],
              ])}
              <line x1="46" y1="46" x2="54" y2="60" strokeDasharray="3 3" strokeWidth="2" />
            </g>
          )}
          {patternType === 'sequence_4_notes' && (
            <g>
              {renderDots([
                [12, 75], [24, 65], [36, 55], [48, 45],
                [54, 60], [66, 50], [78, 40], [90, 30],
              ])}
              <line x1="48" y1="45" x2="54" y2="60" strokeDasharray="3 3" strokeWidth="2" />
            </g>
          )}
        </svg>
      );
    }

    // Pentatonic spine nodes show their box as a numeral; scales without a box
    // convention show the fret the shape starts on instead.
    const numeral =
      req?.boxNumber != null
        ? ROMAN_NUMERALS[req.boxNumber] ?? '?'
        : req?.position != null
          ? String(req.position)
          : '?';
    return (
      <div className="flex flex-col items-center justify-center gap-[2px] z-10 pointer-events-none select-none">
        <span
          className="text-[22px] font-black tracking-tighter leading-none"
          style={{
            color: colors.accent,
            textShadow: '0 1.5px 2px rgba(0,0,0,0.7)',
          }}
        >
          {numeral}
        </span>
        <div
          className="h-[2px] w-5 rounded-full"
          style={{
            background: `linear-gradient(to bottom, ${shade(colors.accent, -0.25)}, ${shade(colors.accent, 0.3)})`,
            opacity: 0.8,
          }}
        />
      </div>
    );
  };

  const selectedGlowFilter = isSelected
    ? `drop-shadow(0 0 6px ${colors.glow})`
    : undefined;

  return (
    <div
      className="relative flex flex-col items-center cursor-pointer select-none group"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <motion.div
        whileHover={isLocked ? {} : { y: -3 }}
        // Pressing pushes the face down onto its lip, like the learning path nodes
        whileTap={isLocked ? {} : { y: 2, scale: 0.97 }}
        className={`relative flex items-center justify-center animate-fade-in ${
          isSingleString
            ? 'w-[72px] h-[72px] sm:w-24 sm:h-24'
            : isSubnode
              ? 'w-[52px] h-[52px] sm:w-[68px] sm:h-[68px]'
              : 'w-[62px] h-[62px] sm:w-[82px] sm:h-[82px]'
        }`}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full absolute inset-0"
          style={{ filter: selectedGlowFilter, overflow: 'visible' }}
        >
          <defs>
            <linearGradient id={fillGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colors.accent} stopOpacity={isSelected ? 0.32 : 0.22} />
              <stop offset="100%" stopColor={colors.accent} stopOpacity={isSelected ? 0.08 : 0.05} />
            </linearGradient>

            <linearGradient id={strokeGradId} x1="0%" y1="0%" x2="100%" y2="100%">
              {isLocked ? (
                <>
                  <stop offset="0%" stopColor="rgba(255,255,255,0.06)" stopOpacity={1} />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.02)" stopOpacity={1} />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor={colors.accent} stopOpacity={0.55} />
                  <stop offset="50%" stopColor={colors.accent} stopOpacity={0.25} />
                  <stop offset="100%" stopColor="rgba(255,255,255,0.06)" stopOpacity={1} />
                </>
              )}
            </linearGradient>

            <linearGradient id={glossGradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={isLocked ? 0.06 : 0.2} />
              <stop offset="45%" stopColor="#ffffff" stopOpacity={0} />
              <stop offset="100%" stopColor="#000000" stopOpacity={isLocked ? 0.16 : 0.26} />
            </linearGradient>

            <linearGradient id={bevelGradId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={0.28} />
              <stop offset="55%" stopColor="#ffffff" stopOpacity={0} />
              <stop offset="100%" stopColor="#000000" stopOpacity={0.2} />
            </linearGradient>

            <filter
              id={shadowFilterId}
              x="-30%"
              y="-30%"
              width="160%"
              height="160%"
              colorInterpolationFilters="sRGB"
            >
              <feDropShadow
                dx="0"
                dy={isSubnode ? 2.5 : 3}
                stdDeviation={2.5}
                floodColor="#000000"
                floodOpacity={isLocked ? 0.35 : 0.5}
              />
            </filter>
          </defs>

          {getShapeSvg()}
          {getConstellationSvg()}
        </svg>

        <div className="relative z-10 flex items-center justify-center">
          {getIconContent()}
        </div>
      </motion.div>

      {node.data?.subtitle && (isReward || isSingleString || isSubnode) && (
        <span
          className={`mt-2.5 text-[10px] font-medium capitalize transition-colors text-center max-w-[84px] truncate ${
            isLocked ? 'text-zinc-600' : 'text-zinc-400 group-hover:text-zinc-200'
          }`}
        >
          {isReward
            ? 'Reward'
            : isSingleString
              ? 'Single string'
              : req.patternType
                  .replace('intervals_', '')
                  .replace('sequence_', 'seq ')
                  .replace(/_/g, ' ')}
        </span>
      )}
    </div>
  );
}
