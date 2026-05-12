import { Stage, Layer } from 'react-konva';
import type Konva from 'konva';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/router';
import { toggleBpmStage } from 'feature/exercisePlan/services/bpmProgressService';

import { ScaleNodeModal } from './ScaleNodeModal';
import { KonvaEdgesLayer } from './KonvaEdgesLayer';
import { KonvaNodesLayer } from './KonvaNodesLayer';
import { useScaleTree } from '../hooks/useScaleTree';
import { organizeByGridSimple } from '../data/scaleTreeLayouts';

export function ScaleTreeView() {
  const router = useRouter();
  const {
    rfNodes: initialNodes,
    rfEdges: rawEdges,
    isLoading,
    refreshProgress,
    selectedNode,
    selectedNodeId,
    selectedNodeStatus,
    setSelectedNodeId,
    userId,
  } = useScaleTree();

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);

  const [size, setSize] = useState({ w: 800, h: 600 });

  // ResizeObserver to track container size
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(() => {
      const rect = containerRef.current!.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height });
    });

    observer.observe(containerRef.current);
    const rect = containerRef.current.getBoundingClientRect();
    setSize({ w: rect.width, h: rect.height });

    return () => observer.disconnect();
  }, []);

  // Compute layout using organizeByGridSimple
  const layoutNodes = useMemo(() => {
    const result = organizeByGridSimple(
      initialNodes as any[],
      rawEdges as any[]
    );
    console.log('All node IDs:', result.nodes.map((n: any) => n.id));
    return result.nodes;
  }, [initialNodes, rawEdges]);

  // Filter edges: only show within same scale, or between single_string nodes
  const filteredEdges = useMemo(() => {
    return rawEdges.filter((edge) => {
      const sourceId = edge.source;
      const targetId = edge.target;

      // Extract scale type from node ID (everything before _pos or _single_string)
      const extractScaleType = (id: string) => {
        const match = id.match(/^(.+?)_(?:pos\d+|single_string|reward)/);
        return match ? match[1] : null;
      };

      const sourceScale = extractScaleType(sourceId);
      const targetScale = extractScaleType(targetId);

      // Debug: log all edges with their scales
      if (sourceScale !== targetScale && !(sourceId.includes("single_string") && targetId.includes("single_string"))) {
        console.log('Edge across scales:', { sourceId, targetId, sourceScale, targetScale });
      }

      // Within same scale - always show
      if (sourceScale && targetScale && sourceScale === targetScale) {
        return true;
      }

      // Between different scales - only if both are single_string nodes
      if (sourceId.includes("single_string") && targetId.includes("single_string")) {
        return true;
      }

      return false;
    });
  }, [rawEdges]);

  // Build position map for edges
  const positionMap = useMemo(() => {
    const map: Record<string, { x: number; y: number }> = {};
    layoutNodes.forEach((n: any) => {
      map[n.id] = n.position;
    });
    return map;
  }, [layoutNodes]);

  // Build node data map with position-based unlocking
  const nodeDataMap = useMemo(() => {
    const map: Record<
      string,
      { status: string; family: string }
    > = {};

    // First pass: collect initial statuses and positions
    const nodePositions: Record<string, { y: number; status: string }> = {};
    initialNodes.forEach((n: any) => {
      if (n.type === 'rewardNode') return;
      map[n.id] = {
        status: (n.data as any).status as string,
        family: (n.data as any).scaleFamily as string,
      };
      nodePositions[n.id] = {
        y: (n.position as any).y,
        status: (n.data as any).status as string,
      };
    });

    // Second pass: unlock nodes based on position progression
    initialNodes.forEach((n: any) => {
      if (n.type === 'rewardNode' || map[n.id].status !== 'locked') return;

      const nodePos = n.id.match(/_pos(\d+)_/)?.[1];
      if (!nodePos) return;

      const nodePosNum = parseInt(nodePos, 10);

      // Check if ANY node on next position (posNum + 1) is unlocked
      // This "opens" the path from previous position
      const nextPosUnlocked = initialNodes.some((other: any) => {
        if (other.type === 'rewardNode') return false;
        const otherPos = other.id.match(/_pos(\d+)_/)?.[1];
        const otherPosNum = otherPos ? parseInt(otherPos, 10) : null;

        // If any node on NEXT position is not locked, unlock this node (on current or previous)
        return (
          otherPosNum === nodePosNum + 1 &&
          map[other.id].status !== 'locked'
        );
      });

      if (nextPosUnlocked) {
        map[n.id].status = 'available';
      }
    });

    return map;
  }, [initialNodes]);

  // Center viewport on initial load only
  useEffect(() => {
    if (layoutNodes.length === 0 || size.w === 0) return;

    const stage = stageRef.current;
    if (!stage) return;

    // Find bounds of all nodes
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    layoutNodes.forEach((n: any) => {
      minX = Math.min(minX, n.position.x);
      maxX = Math.max(maxX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxY = Math.max(maxY, n.position.y);
    });

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const offsetX = size.w / 2 - centerX * 0.12;
    const offsetY = size.h / 2 - centerY * 0.12;

    stage.position({ x: offsetX, y: offsetY });
    stage.scale({ x: 0.12, y: 0.12 });
  }, [layoutNodes, size]);

  // Zoom handler with cursor-centered scaling
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();

      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = stage.scaleX();
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      };

      const direction = e.evt.deltaY < 0 ? 1 : -1;
      const factor = 1.12;
      const newScale = Math.max(
        0.05,
        Math.min(2, oldScale * Math.pow(factor, direction))
      );

      stage.scale({ x: newScale, y: newScale });

      const newPos = {
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      };

      stage.position(newPos);
    },
    []
  );

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      console.log('Clicked node ID:', nodeId);
      setSelectedNodeId(nodeId);
    },
    [setSelectedNodeId]
  );

  const handlePractice = useCallback(() => {
    if (!selectedNode) return;
    const req = selectedNode.requiredExercises[0];
    if (!req) return;
    if (req.stringNum != null) {
      router.push(
        `/practice/scale?type=${selectedNode.scaleType}&string=${req.stringNum}&exam=true&requiredBpm=${req.requiredBpm}&nodeId=${selectedNode.id}`
      );
    } else {
      router.push(
        `/practice/scale?type=${selectedNode.scaleType}&pos=${req.position}&pattern=${req.patternType}&exam=true&requiredBpm=${req.requiredBpm}&nodeId=${selectedNode.id}`
      );
    }
  }, [selectedNode, router]);

  const handleMarkComplete = useCallback(async () => {
    if (!selectedNode || !userId) return;
    try {
      const req = selectedNode.requiredExercises[0];
      if (req) {
        await toggleBpmStage(
          userId,
          req.exerciseId,
          req.requiredBpm,
          req.label,
          'theory'
        );
        refreshProgress();
      }
    } catch (e) {
      console.error('Failed to mark complete:', e);
    }
  }, [selectedNode, userId, refreshProgress]);

  const handleCloseModal = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  const completedCount = useMemo(
    () =>
      Object.values(nodeDataMap).filter(
        (d) => d.status === 'completed'
      ).length,
    [nodeDataMap]
  );

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden rounded-xl bg-zinc-950"
    >
      {/* Background */}
      <div
        className="absolute inset-0 pointer-events-none z-0 overflow-hidden bg-zinc-950"
        style={{
          background:
            'linear-gradient(135deg, #09090b 0%, #18181b 50%, #09090b 100%)',
        }}
      >
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(34,211,238,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.5) 1px, transparent 1px)`,
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      {/* Title header */}
      <div className="absolute left-4 top-4 z-10 pointer-events-none">
        <h1
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#f0f4ff',
            letterSpacing: '0.04em',
            lineHeight: 1.2,
            textShadow: '0 0 30px rgba(34,211,238,0.35)',
            margin: 0,
          }}
        >
          Ścieżka Mistrzostwa Gitary
        </h1>
        <p
          style={{
            fontSize: 11,
            fontWeight: 300,
            color: 'rgba(160,170,200,0.65)',
            letterSpacing: '0.12em',
            marginTop: 3,
            textTransform: 'uppercase',
          }}
        >
          Wybierz swoją ścieżkę rozwoju
        </p>
      </div>

      {/* Progress + refresh */}
      <div
        className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-lg px-3 py-1.5"
        style={{
          border: '1px solid rgba(34,211,238,0.18)',
          background: 'rgba(2,2,16,0.75)',
          boxShadow:
            '0 0 24px rgba(34,211,238,0.06), inset 0 0 16px rgba(34,211,238,0.03)',
        }}
      >
        <span className="text-xs font-light tracking-widest text-zinc-300">
          {completedCount} <span className="text-zinc-600">/</span> 413
        </span>
        <button
          onClick={refreshProgress}
          disabled={isLoading}
          className="ml-1 flex h-5 w-5 items-center justify-center rounded text-zinc-600 transition-colors hover:text-cyan-400 disabled:opacity-30"
          title="Refresh progress"
        >
          <RefreshCw
            className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {/* Konva canvas */}
      {size.w > 0 && (
        <Stage
          ref={stageRef}
          width={size.w}
          height={size.h}
          draggable
          onWheel={handleWheel}
        >
          {/* Edges layer (behind) */}
          <Layer listening={false}>
            <KonvaEdgesLayer
              edges={filteredEdges}
              nodeDataMap={nodeDataMap}
              positionMap={positionMap}
            />
          </Layer>

          {/* Nodes layer */}
          <Layer>
            <KonvaNodesLayer
              nodes={layoutNodes as any}
              selectedNodeId={selectedNodeId}
              onNodeClick={handleNodeClick}
            />
          </Layer>
        </Stage>
      )}

      {/* Modal */}
      <ScaleNodeModal
        node={selectedNode}
        status={selectedNodeStatus}
        onClose={handleCloseModal}
        onPractice={handlePractice}
        onMarkComplete={handleMarkComplete}
      />

      {/* Hint */}
      {!selectedNodeId && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="absolute bottom-5 right-4 z-10 text-[9px] font-light tracking-widest uppercase text-zinc-700 select-none"
        >
          Click a node to practice
        </motion.p>
      )}
    </div>
  );
}
