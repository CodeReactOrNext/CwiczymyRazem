import { Chip } from 'assets/components/ui/chip';
import { SCALE_TREE_POSITIONS, usesBoxNames } from 'feature/scaleTree/data/scaleTreeNodes';
import { motion } from 'framer-motion';
import { useEffect, useMemo,useRef, useState } from 'react';

import { ScaleTreeGridNode } from './ScaleTreeGridNode';

interface ScaleTreeGridProps {
  scaleType: string;
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

const SCALE_LABEL: Record<string, string> = {
  minor_pentatonic: 'Minor Pentatonic',
  major_pentatonic: 'Major Pentatonic',
  minor: 'Natural Minor',
  major: 'Major Scale',
  dorian: 'Dorian Mode',
  phrygian: 'Phrygian Mode',
  mixolydian: 'Mixolydian Mode',
  lydian: 'Lydian Mode',
  locrian: 'Locrian Mode',
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
  rfNodes,
  rfEdges,
  selectedNodeId,
  onNodeClick,
}: ScaleTreeGridProps) {
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
    return SCALE_TREE_POSITIONS[scaleType] || [1, 2, 3, 5, 7, 8, 10];
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

    const rewardId = `${prefix}_pos${pos}_reward`;
    const rewardNode = scaleNodes.find((n) => n.id === rewardId);
    if (rewardNode) list.push(rewardNode);

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
        <span className={`text-xs font-semibold capitalize tracking-wide ${accentText}`}>
          {family} tree
        </span>
        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-xl font-bold capitalize text-zinc-100 sm:text-2xl">
            {SCALE_LABEL[scaleType] || scaleType}
          </h1>
          {scaleNodes.length > 0 && (
            <Chip color='gray' className='py-1 text-[11px]'>
              <span className={`font-semibold tabular-nums ${accentText}`}>
                {completedCount}/{scaleNodes.length}
              </span>
              done
            </Chip>
          )}
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="relative flex-1 flex flex-col justify-start items-start sm:items-center w-full min-h-0 bg-[#0e0e11]/30 rounded-lg p-3 sm:p-6 overflow-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-track]:bg-transparent"
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
              strokeWidth={line.isActive ? 2 : 1.2}
              strokeDasharray={line.isDashed ? '4,4' : undefined}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              style={{
                filter: line.isActive ? `drop-shadow(0 0 4px ${accentColor}dd)` : 'none',
              }}
            />
          ))}
        </svg>

        <div className="relative z-10 flex flex-col items-center w-full gap-4 sm:gap-8 min-w-[640px] sm:min-w-0">
          {gateNode && (
            <div className="flex flex-col items-center">
              <div id={`node-slot-${gateNode.id}`} className="flex-shrink-0">
                <ScaleTreeGridNode
                  node={gateNode}
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
            {positions.map((pos, idx) => {
              const posNodes = getPositionNodes(pos);

              return (
                <div key={pos} className="flex items-center w-full gap-2 sm:gap-6">
                  {/* Pentatonic rows carry the box names players already know,
                      with the fret underneath. Diatonic scales and modes have no
                      box convention, so the fret is the name. */}
                  <div className="w-10 sm:w-16 flex-shrink-0 text-right">
                    <span className="block text-xs font-semibold tabular-nums text-zinc-300">
                      {showBoxNames ? `Box ${idx + 1}` : `Fret ${pos}`}
                    </span>
                    {showBoxNames && (
                      <span className="mt-0.5 hidden text-[10px] tabular-nums text-zinc-500 sm:block">
                        fret {pos}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 flex justify-between items-center bg-black/15 rounded-lg p-1.5 sm:p-3 gap-1 sm:gap-2">
                    {posNodes.map((node) => (
                      <div key={node.id} id={`node-slot-${node.id}`} className="flex-shrink-0">
                        <ScaleTreeGridNode
                          node={node}
                          status={node.data?.status || 'locked'}
                          isSelected={node.id === selectedNodeId}
                          onClick={() => onNodeClick(node.id)}
                          onMouseEnter={() => {}}
                          onMouseLeave={() => {}}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
