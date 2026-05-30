import { useEffect, useRef, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ScaleTreeGridNode } from './ScaleTreeGridNode';

interface ScaleTreeGridProps {
  scaleType: string;
  rfNodes: any[];
  rfEdges: any[];
  selectedNodeId: string | null;
  onNodeClick: (nodeId: string) => void;
}

const SCALE_POSITIONS: Record<string, number[]> = {
  minor_pentatonic: [1, 3, 5, 8, 10],
  major_pentatonic: [1, 3, 5, 8, 10],
  minor: [1, 2, 3, 5, 7, 8, 10],
  major: [1, 2, 3, 5, 7, 8, 10],
  dorian: [1, 2, 3, 5, 7, 8, 10],
  phrygian: [1, 2, 3, 5, 7, 8, 10],
  mixolydian: [1, 2, 3, 5, 7, 8, 10],
  lydian: [1, 2, 3, 5, 7, 8, 10],
  locrian: [1, 2, 3, 5, 7, 8, 10],
};

const FAMILY_COLORS = {
  pentatonic: '#fbbf24',
  diatonic: '#22d3ee',
  mode: '#a78bfa',
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
    return SCALE_POSITIONS[scaleType] || [1, 3, 5, 8, 10];
  }, [scaleType]);

  const family = scaleNodes[0]?.data?.scaleFamily || 'diatonic';
  const accentColor = FAMILY_COLORS[family as keyof typeof FAMILY_COLORS] || FAMILY_COLORS.diatonic;

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
      className="relative flex-1 flex flex-col h-full bg-[#0d0d10] overflow-hidden p-3 sm:p-6 pt-14 sm:pt-6 select-none"
    >
      <div className="flex flex-col mb-3 sm:mb-5">
        <span
          className="text-[10px] sm:text-[11px] font-black capitalize tracking-widest"
          style={{ color: accentColor }}
        >
          {family} Tree
        </span>
        <div className="flex items-center gap-3 mt-1 sm:mt-1.5">
          <h1 className="text-lg sm:text-2xl font-bold text-white tracking-wide capitalize">
            {SCALE_LABEL[scaleType] || scaleType}
          </h1>
          <div
            className="h-[2px] sm:h-[3px] flex-1 max-w-[120px] rounded-full"
            style={{
              background: `linear-gradient(to right, ${accentColor}, transparent)`,
            }}
          />
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="relative flex-1 flex flex-col justify-start items-start sm:items-center w-full min-h-0 bg-[#0e0e11]/30 rounded-xl border border-white/[0.02] p-3 sm:p-6 overflow-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-zinc-800 [&::-webkit-scrollbar-track]:bg-transparent"
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
            <div className="flex flex-col items-center gap-1">
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
              <span className="text-[10px] font-bold text-zinc-500 tracking-wider">
                Single String
              </span>
            </div>
          )}

          <div className="w-full max-w-5xl flex flex-col gap-3 sm:gap-6">
            {positions.map((pos) => {
              const posNodes = getPositionNodes(pos);

              return (
                <div key={pos} className="flex items-center w-full gap-2 sm:gap-6">
                  <div className="w-10 sm:w-16 flex-shrink-0 text-right">
                    <span className="text-[10px] sm:text-[11px] font-mono font-bold text-zinc-400 capitalize tracking-widest block">
                      Pos. {pos}
                    </span>
                  </div>

                  <div className="flex-1 flex justify-between items-center bg-black/15 rounded-lg border border-white/[0.01] p-1.5 sm:p-3 gap-1 sm:gap-2">
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
