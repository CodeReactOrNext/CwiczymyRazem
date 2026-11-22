import { cn } from 'assets/lib/utils';
import { pageTitleClass } from 'components/PageTitle/PageTitle';
import { SCALE_TREE_KEYS, transposeFret } from 'feature/scaleTree/data/scaleTreeKeys';
import { SCALE_TREE_POSITIONS, usesBoxNames } from 'feature/scaleTree/data/scaleTreeNodes';
import { motion } from 'framer-motion';
import { useTranslation } from 'hooks/useTranslation';
import { useEffect, useMemo,useRef, useState } from 'react';

import { BoxRewardBlock } from './BoxRewardBlock';
import { ScaleTreeGridNode } from './ScaleTreeGridNode';

interface ScaleTreeGridProps {
  scaleType: string;
  /** Key the tree is played in — the shapes are the same, the frets move. */
  rootNote: string;
  onSelectRootNote: (rootNote: string) => void;
  rfNodes: any[];
  rfEdges: any[];
  selectedNodeId: string | null;
  onNodeClick: (nodeId: string) => void;
}

const FAMILY_COLORS = {
  pentatonic: '#fbbf24',
  diatonic: '#22d3ee',
  mode: '#a78bfa',
};

// Same accents as the connection lines, but as palette classes for the chrome.
const FAMILY_TEXT: Record<string, string> = {
  pentatonic: 'text-amber-400',
  diatonic: 'text-cyan-400',
  mode: 'text-violet-400',
};

const SCALE_TO_PREFIX: Record<string, string> = {
  minor_pentatonic: 'min_pent',
  major_pentatonic: 'maj_pent',
  minor: 'nat_minor',
  major: 'major',
  dorian: 'dorian',
  phrygian: 'phrygian',
  mixolydian: 'mixolydian',
  lydian: 'lydian',
  locrian: 'locrian',
};

export function ScaleTreeGrid({
  scaleType,
  rootNote,
  onSelectRootNote,
  rfNodes,
  rfEdges,
  selectedNodeId,
  onNodeClick,
}: ScaleTreeGridProps) {
  const { t } = useTranslation('scale_tree');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<Record<string, { x: number; y: number }>>({});
  const [scrollHeight, setScrollHeight] = useState(0);

  const scaleNodes = useMemo(() => {
    return rfNodes.filter((n) => n.data?.scaleType === scaleType);
  }, [rfNodes, scaleType]);

  const gateNode = useMemo(() => {
    return scaleNodes.find((n) => n.id.includes('single_string'));
  }, [scaleNodes]);

  const positions = useMemo(() => {
    return SCALE_TREE_POSITIONS[scaleType] ?? [];
  }, [scaleType]);

  const family = scaleNodes[0]?.data?.scaleFamily || 'diatonic';
  const showBoxNames = usesBoxNames(family);
  const accentColor = FAMILY_COLORS[family as keyof typeof FAMILY_COLORS] || FAMILY_COLORS.diatonic;
  const accentText = FAMILY_TEXT[family] || FAMILY_TEXT.diatonic;

  const completedCount = useMemo(
    () => scaleNodes.filter((n) => n.data?.status === 'completed').length,
    [scaleNodes]
  );

  const patterns = ['asc', 'desc', 'asc_desc', 'thirds', 'fourths', 'seq3', 'seq4'];

  const getPositionNodes = (pos: number) => {
    const prefix = SCALE_TO_PREFIX[scaleType] || scaleType;
    const list: any[] = [];
    patterns.forEach((pat) => {
      const id = `${prefix}_pos${pos}_${pat}`;
      const found = scaleNodes.find((n) => n.id === id);
      if (found) list.push(found);
    });

    // The row's reward is `BoxRewardBlock`, not a node: the retired React Flow
    // tree carried one as an eighth polygon on the end of the row, and it read
    // as an eighth exercise.
    return list;
  };

  const updateCoordinates = () => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const rect = scrollContainer.getBoundingClientRect();
    const scrollLeft = scrollContainer.scrollLeft;
    const scrollTop = scrollContainer.scrollTop;
    const newCoords: Record<string, { x: number; y: number }> = {};

    scaleNodes.forEach((node) => {
      const el = document.getElementById(`node-slot-${node.id}`);
      if (el) {
        const elRect = el.getBoundingClientRect();
        newCoords[node.id] = {
          x: elRect.left - rect.left + scrollLeft + elRect.width / 2,
          y: elRect.top - rect.top + scrollTop + elRect.height / 2,
        };
      }
    });

    setCoords(newCoords);
    setScrollHeight(scrollContainer.scrollHeight);
  };

  useEffect(() => {
    updateCoordinates();
    window.addEventListener('resize', updateCoordinates);

    const timer = setTimeout(updateCoordinates, 250);

    return () => {
      window.removeEventListener('resize', updateCoordinates);
      clearTimeout(timer);
    };
  }, [scaleNodes, scaleType]);

  const connectionLines = useMemo(() => {
    const lines: Array<{
      id: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      isActive: boolean;
      isDashed: boolean;
    }> = [];

    rfEdges.forEach((edge) => {
      const sourceCoord = coords[edge.source];
      const targetCoord = coords[edge.target];

      if (sourceCoord && targetCoord) {
        const sourceNode = scaleNodes.find((n) => n.id === edge.source);
        const targetNode = scaleNodes.find((n) => n.id === edge.target);

        if (sourceNode && targetNode) {
          const isActive =
            sourceNode.data?.status === 'completed' &&
            targetNode.data?.status !== 'locked';

          const isDashed = edge.source.endsWith('_asc') && edge.target.endsWith('_asc');

          lines.push({
            id: edge.id,
            x1: sourceCoord.x,
            y1: sourceCoord.y,
            x2: targetCoord.x,
            y2: targetCoord.y,
            isActive,
            isDashed,
          });
        }
      }
    });

    return lines;
  }, [coords, rfEdges, scaleNodes]);

  return (
    <div
      className="relative flex-1 flex flex-col h-full bg-zinc-950 overflow-hidden p-3 sm:p-6 pt-14 sm:pt-6 select-none"
    >
      <div className="mb-4 flex flex-col sm:mb-6">
        <div className="flex flex-wrap items-baseline gap-3">
          <h1 className={pageTitleClass}>
            {t('grid.title', {
              root: rootNote,
              scale: t(`scales.${scaleType}`, scaleType),
            })}
          </h1>
          {scaleNodes.length > 0 && (
            <span className="text-sm font-semibold tabular-nums text-zinc-500">
              <span className={accentText}>{completedCount}</span>/{scaleNodes.length}
            </span>
          )}
        </div>

        {/* Key picker — the tree itself never changes, only the fret its shapes
            sit on and the notes under your fingers. Only the chosen key has a
            face; the rest are plain letters. */}
        <div className="mt-3 flex items-center gap-3">
          <span className="hidden shrink-0 text-xs font-semibold text-zinc-500 sm:block">
            {t('grid.key')}
          </span>
          <div className="flex gap-0.5 overflow-x-auto [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-track]:bg-transparent">
            {SCALE_TREE_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => onSelectRootNote(key)}
                aria-pressed={key === rootNote}
                className={cn(
                  'h-8 min-w-8 shrink-0 rounded-lg px-2 text-xs font-semibold tabular-nums transition-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                  key === rootNote
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-500 hover:bg-zinc-900/60 hover:text-zinc-300'
                )}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="force-dark scale-board relative flex-1 flex flex-col justify-start items-start sm:items-center w-full min-h-0 bg-[#0e0e11]/30 rounded-lg p-3 sm:p-6 overflow-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-track]:bg-transparent"
        onScroll={updateCoordinates}
      >
        <svg
          className="absolute left-0 top-0 pointer-events-none z-0"
          style={{
            width: '100%',
            height: scrollHeight || '100%',
          }}
        >
          {connectionLines.map((line) => (
            <motion.line
              key={line.id}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke={line.isActive ? accentColor : '#1f1f24'}
              strokeOpacity={line.isActive ? 0.6 : 1}
              strokeWidth={line.isActive ? 1.5 : 1.2}
              strokeDasharray={line.isDashed ? '4,4' : undefined}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </svg>

        <div className="relative z-10 flex flex-col items-center w-full gap-4 sm:gap-8 min-w-[640px] sm:min-w-0">
          {gateNode && (
            <div className="flex flex-col items-center">
              <div id={`node-slot-${gateNode.id}`} className="flex-shrink-0">
                <ScaleTreeGridNode
                  node={gateNode}
                  rootNote={rootNote}
                  status={gateNode.data?.status || 'locked'}
                  isSelected={gateNode.id === selectedNodeId}
                  onClick={() => onNodeClick(gateNode.id)}
                  onMouseEnter={() => {}}
                  onMouseLeave={() => {}}
                />
              </div>
            </div>
          )}

          <div className="w-full max-w-5xl flex flex-col gap-3 sm:gap-6">
            {/* Every row runs the same patterns in the same order, so they are
                named once here instead of under each node. Same widths and
                padding as the rows below, so each name sits over its column. */}
            {positions.length > 0 && (
              <div className="flex items-end w-full gap-2 sm:gap-6">
                <div className="w-10 sm:w-16 flex-shrink-0" />
                <div className="flex-1 flex justify-between items-end px-1.5 sm:px-3 gap-1 sm:gap-2">
                  {getPositionNodes(positions[0]).map((node) => {
                    const pattern = node.data?.requiredExercises?.[0]?.patternType;
                    return (
                      <span
                        key={node.id}
                        className={cn(
                          'flex-shrink-0 text-center text-[11px] font-medium leading-tight text-zinc-500',
                          node.id.endsWith('_asc')
                            ? 'w-[62px] sm:w-[82px]'
                            : 'w-[52px] sm:w-[68px]'
                        )}
                      >
                        {pattern ? t(`patterns_short.${pattern}`, pattern) : null}
                      </span>
                    );
                  })}
                </div>
                <div className="w-[64px] sm:w-[92px] flex-shrink-0" />
              </div>
            )}

            {positions.map((pos, idx) => {
              const posNodes = getPositionNodes(pos);
              // Node IDs stay keyed to the C fret; only the label follows the key.
              const fret = transposeFret(pos, rootNote);
              const rowDone = posNodes.filter(
                (n) => n.data?.status === 'completed'
              ).length;

              return (
                <div key={pos} className="flex items-center w-full gap-2 sm:gap-6">
                  {/* Pentatonic rows carry the box names players already know,
                      with the fret underneath. Diatonic scales and modes have no
                      box convention, so the fret is the name. */}
                  <div className="w-10 sm:w-16 flex-shrink-0 text-right">
                    <span className="block text-xs font-semibold tabular-nums text-zinc-300">
                      {showBoxNames
                        ? t('shape.box', { n: idx + 1 })
                        : t('shape.fret', { n: fret })}
                    </span>
                    {showBoxNames && (
                      <span className="mt-0.5 hidden text-[11px] tabular-nums text-zinc-500 sm:block">
                        {t('shape.fret_lc', { n: fret })}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 flex justify-between items-center p-1.5 sm:p-3 gap-1 sm:gap-2">
                    {posNodes.map((node) => (
                      <div key={node.id} id={`node-slot-${node.id}`} className="flex-shrink-0">
                        <ScaleTreeGridNode
                          node={node}
                          rootNote={rootNote}
                          status={node.data?.status || 'locked'}
                          isSelected={node.id === selectedNodeId}
                          onClick={() => onNodeClick(node.id)}
                          onMouseEnter={() => {}}
                          onMouseLeave={() => {}}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Outside the shapes' panel, not inside it: what closes the
                      row should not look like one more thing in it. */}
                  <BoxRewardBlock
                    scaleType={scaleType}
                    position={pos}
                    done={rowDone}
                    total={posNodes.length}
                    accentColor={accentColor}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
