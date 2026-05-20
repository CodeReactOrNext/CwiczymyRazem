import { Stage, Layer, Group, Text, Circle, Rect } from 'react-konva';
import type Konva from 'konva';
import { motion } from 'framer-motion';
import { RefreshCw, Plus, Minus, Maximize2 } from 'lucide-react';

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
import { getScalePatternForPosition, getScaleOnString } from 'feature/exercisePlan/scales/fretboardMapper';
import { scaleDefinitions } from 'feature/exercisePlan/scales/scaleDefinitions';
import { CLUSTER_LABELS } from '../data/scaleTreeNodes';

const FAMILY_COLORS: Record<string, string> = {
  pentatonic: '#fbbf24',
  diatonic: '#22d3ee',
  mode: '#a78bfa',
};

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
  const lastPinchDistRef = useRef<number | null>(null);

  const [size, setSize] = useState({ w: 800, h: 600 });
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    color: string;
    alpha: number;
    life: number;
  }>>([]);
  const [hoveredNode, setHoveredNode] = useState<any | null>(null);
  const [hoveredCoords, setHoveredCoords] = useState<{ x: number; y: number } | null>(null);
  const [flashNodeId, setFlashNodeId] = useState<string | null>(null);

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

  // Zoom around a specific pixel point in the stage container.
  const zoomAt = useCallback((pointerX: number, pointerY: number, newScale: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    const oldScale = stage.scaleX();
    const clamped = Math.max(0.05, Math.min(2, newScale));
    const pointTo = {
      x: (pointerX - stage.x()) / oldScale,
      y: (pointerY - stage.y()) / oldScale,
    };
    stage.scale({ x: clamped, y: clamped });
    stage.position({
      x: pointerX - pointTo.x * clamped,
      y: pointerY - pointTo.y * clamped,
    });
    stage.batchDraw();
  }, []);

  // Two-finger pinch only. Single-finger pan is handled by Konva's `draggable`.
  const handleTouchMove = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    const stage = stageRef.current;
    if (!stage) return;
    const touches = e.evt.touches;
    if (touches.length < 2) return;

    e.evt.preventDefault();
    // Stop Konva's draggable behavior while pinching so it doesn't fight us.
    if (stage.isDragging()) stage.stopDrag();

    const t0 = touches[0];
    const t1 = touches[1];
    const dx = t1.clientX - t0.clientX;
    const dy = t1.clientY - t0.clientY;
    const newDist = Math.hypot(dx, dy);

    if (lastPinchDistRef.current === null) {
      lastPinchDistRef.current = newDist;
      return;
    }

    const scaleBy = newDist / lastPinchDistRef.current;
    const midX = (t0.clientX + t1.clientX) / 2;
    const midY = (t0.clientY + t1.clientY) / 2;
    const rect = stage.container().getBoundingClientRect();
    zoomAt(midX - rect.left, midY - rect.top, stage.scaleX() * scaleBy);
    lastPinchDistRef.current = newDist;
  }, [zoomAt]);

  const handleTouchEnd = useCallback(() => {
    lastPinchDistRef.current = null;
  }, []);

  // Zoom from the center of the viewport (used by +/- buttons).
  const zoomByButton = useCallback((direction: 1 | -1) => {
    const stage = stageRef.current;
    if (!stage) return;
    const factor = 1.3;
    const newScale = stage.scaleX() * Math.pow(factor, direction);
    zoomAt(size.w / 2, size.h / 2, newScale);
  }, [size, zoomAt]);

  const recenterView = useCallback(() => {
    if (layoutNodes.length === 0 || size.w === 0) return;
    const stage = stageRef.current;
    if (!stage) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    layoutNodes.forEach((n: any) => {
      minX = Math.min(minX, n.position.x);
      maxX = Math.max(maxX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxY = Math.max(maxY, n.position.y);
    });
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const targetScale = 0.12;
    stage.to({
      x: size.w / 2 - centerX * targetScale,
      y: size.h / 2 - centerY * targetScale,
      scaleX: targetScale,
      scaleY: targetScale,
      duration: 0.4,
      easing: 'ease-in-out',
    });
  }, [layoutNodes, size]);



  useEffect(() => {
    if (particles.length === 0) return;
    let animId: number;
    const tick = () => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            alpha: p.alpha - 0.02,
            life: p.life - 1,
          }))
          .filter((p) => p.life > 0 && p.alpha > 0)
      );
      animId = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(animId);
  }, [particles.length]);

  const animateStageTo = useCallback((targetX: number, targetY: number, targetScale: number = 0.85) => {
    const stage = stageRef.current;
    if (!stage) return;
    const newX = size.w / 2 - targetX * targetScale;
    const newY = size.h / 2 - targetY * targetScale;
    stage.to({
      x: newX,
      y: newY,
      scaleX: targetScale,
      scaleY: targetScale,
      duration: 0.55,
      easing: 'ease-in-out',
    });
  }, [size]);

  useEffect(() => {
    if (router.query.fromExam === 'true' && router.query.nodeId && layoutNodes.length > 0) {
      const targetId = router.query.nodeId as string;
      const node = layoutNodes.find((n: any) => n.id === targetId);
      if (node) {
        const family = (node.data?.scaleFamily as string) || 'diatonic';
        const color = FAMILY_COLORS[family] || '#22d3ee';
        const newParticles: Array<{
          id: number;
          x: number;
          y: number;
          vx: number;
          vy: number;
          radius: number;
          color: string;
          alpha: number;
          life: number;
        }> = [];
        for (let i = 0; i < 50; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1.5 + Math.random() * 5.5;
          newParticles.push({
            id: Math.random(),
            x: node.position.x,
            y: node.position.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: 1.5 + Math.random() * 3.5,
            color,
            alpha: 1.0,
            life: 50 + Math.random() * 20,
          });
        }
        setParticles(newParticles);
        animateStageTo(node.position.x, node.position.y, 0.85);
        setFlashNodeId(targetId);
        router.replace('/scale-tree', undefined, { shallow: true });
      }
    }
  }, [router.query, layoutNodes, animateStageTo]);

  const handleNodeMouseEnter = useCallback((node: any) => {
    const stage = stageRef.current;
    if (!stage) return;
    const scale = stage.scaleX();
    const x = node.position.x * scale + stage.x();
    const y = node.position.y * scale + stage.y();
    setHoveredNode(node);
    setHoveredCoords({ x, y });
  }, []);

  const handleNodeMouseLeave = useCallback(() => {
    setHoveredNode(null);
    setHoveredCoords(null);
  }, []);

  const hoveredFretPositions = useMemo(() => {
    if (!hoveredNode) return [];
    const req = hoveredNode.data?.requiredExercises?.[0];
    if (!req) return [];

    const rootMidi = 60;
    const scaleKey = (req.scaleType || hoveredNode.data.scaleType) as any;
    const scaleDef = scaleDefinitions[scaleKey as keyof typeof scaleDefinitions];
    if (!scaleDef) return [];

    if (req.stringNum != null) {
      return getScaleOnString(rootMidi, scaleDef.intervals, req.stringNum, 0, 15);
    } else if (req.position != null) {
      return getScalePatternForPosition(rootMidi, scaleDef.intervals, req.position);
    }
    return [];
  }, [hoveredNode]);

  const activeFretRange = useMemo(() => {
    if (hoveredFretPositions.length === 0) return { min: 0, max: 4 };
    let min = Infinity;
    let max = -Infinity;
    hoveredFretPositions.forEach((pos) => {
      min = Math.min(min, pos.fret);
      max = Math.max(max, pos.fret);
    });
    if (max - min > 5) {
      min = 0;
      max = 12;
    } else if (max - min < 4) {
      max = min + 4;
    }
    return { min, max };
  }, [hoveredFretPositions]);

  const clusterProgress = useMemo(() => {
    const stats: Record<string, { completed: number; total: number }> = {};
    initialNodes.forEach((n: any) => {
      if (n.type === 'rewardNode' || !n.data?.scaleType) return;
      const type = n.data.scaleType;
      if (!stats[type]) {
        stats[type] = { completed: 0, total: 0 };
      }
      stats[type].total += 1;
      if (n.data.status === 'completed') {
        stats[type].completed += 1;
      }
    });
    return stats;
  }, [initialNodes]);

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      console.log('Clicked node ID:', nodeId);
      setSelectedNodeId(nodeId);
      const clickedNode = layoutNodes.find((n: any) => n.id === nodeId);
      if (clickedNode) {
        animateStageTo(clickedNode.position.x, clickedNode.position.y, 0.85);
      }
    },
    [setSelectedNodeId, layoutNodes, animateStageTo]
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
      className="relative h-full w-full overflow-hidden rounded-xl bg-[#141414]"
      style={{ touchAction: 'none' }}
    >
      <div className="absolute inset-0 pointer-events-none z-0 bg-[#141414]" />



      <div
        className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-lg px-3 py-1.5"
        style={{
          border: '1px solid rgba(255,255,255,0.05)',
          background: '#0b0b0d',
          boxShadow: 'none',
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

      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={() => zoomByButton(1)}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-[#0b0b0d]/90 text-zinc-300 backdrop-blur-md transition-colors hover:text-cyan-400 active:bg-[#1a1a1d]"
          title="Zoom in"
          aria-label="Zoom in"
        >
          <Plus className="h-5 w-5" />
        </button>
        <button
          onClick={() => zoomByButton(-1)}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-[#0b0b0d]/90 text-zinc-300 backdrop-blur-md transition-colors hover:text-cyan-400 active:bg-[#1a1a1d]"
          title="Zoom out"
          aria-label="Zoom out"
        >
          <Minus className="h-5 w-5" />
        </button>
        <button
          onClick={recenterView}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/10 bg-[#0b0b0d]/90 text-zinc-300 backdrop-blur-md transition-colors hover:text-cyan-400 active:bg-[#1a1a1d]"
          title="Center view"
          aria-label="Center view"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>

      {size.w > 0 && (
        <Stage
          ref={stageRef}
          width={size.w}
          height={size.h}
          draggable
          onWheel={handleWheel}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <Layer listening={false}>
            <KonvaEdgesLayer
              edges={filteredEdges}
              nodeDataMap={nodeDataMap}
              positionMap={positionMap}
              flashSourceNodeId={flashNodeId}
            />
          </Layer>

          <Layer>
            {CLUSTER_LABELS.map((lbl) => {
              const ssNodeIdMap: Record<string, string> = {
                lbl_min_pent: 'min_pent_single_string',
                lbl_maj_pent: 'maj_pent_single_string',
                lbl_nat_minor: 'nat_minor_single_string',
                lbl_major: 'major_single_string',
                lbl_dorian: 'dorian_single_string',
                lbl_phrygian: 'phrygian_single_string',
                lbl_mixolydian: 'mixolydian_single_string',
                lbl_lydian: 'lydian_single_string',
                lbl_locrian: 'locrian_single_string',
              };
              const ssNodeId = ssNodeIdMap[lbl.id];
              const ssNode = layoutNodes.find((n: any) => n.id === ssNodeId);
              const x = ssNode ? ssNode.position.x : lbl.x;
              const y = ssNode ? ssNode.position.y : lbl.y;

              const labelYOffset = -340;
              const color = FAMILY_COLORS[lbl.family] || '#ffffff';
              const familyLabelMap: Record<string, string> = {
                pentatonic: 'PENTATONIC',
                diatonic: 'DIATONIC SCALE',
                mode: 'MODAL MODE',
              };

              const scaleTypeMap: Record<string, string> = {
                lbl_min_pent: 'minor_pentatonic',
                lbl_maj_pent: 'major_pentatonic',
                lbl_nat_minor: 'minor',
                lbl_major: 'major',
                lbl_dorian: 'dorian',
                lbl_phrygian: 'phrygian',
                lbl_mixolydian: 'mixolydian',
                lbl_lydian: 'lydian',
                lbl_locrian: 'locrian',
              };
              const scaleType = scaleTypeMap[lbl.id];
              const stats = clusterProgress[scaleType] || { completed: 0, total: 0 };
              const percent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

              return (
                <Group key={lbl.id} x={x} y={y + labelYOffset} listening={false}>
                  <Text
                    text={familyLabelMap[lbl.family] || lbl.family.toUpperCase()}
                    fontSize={20}
                    fontFamily="sans-serif"
                    fill={color}
                    opacity={0.4}
                    align="center"
                    x={-500}
                    y={-40}
                    width={1000}
                    fontStyle="bold"
                    letterSpacing={8}
                  />
                  <Text
                    text={lbl.label}
                    fontSize={76}
                    fontFamily="serif"
                    fill="#d4d4d8"
                    opacity={0.85}
                    align="center"
                    x={-600}
                    y={0}
                    width={1200}
                    fontStyle="bold"
                    letterSpacing={3}
                  />
                  <Rect
                    x={-150}
                    y={88}
                    width={300}
                    height={4}
                    fill="rgba(255, 255, 255, 0.06)"
                    cornerRadius={2}
                  />
                  {percent > 0 && (
                    <Rect
                      x={-150}
                      y={88}
                      width={300 * (percent / 100)}
                      height={4}
                      fill={color}
                      cornerRadius={2}
                    />
                  )}
                  <Text
                    text={stats.completed === stats.total ? "COMPLETED" : `${stats.completed} / ${stats.total} COMPLETED (${percent}%)`}
                    fontSize={14}
                    fontFamily="sans-serif"
                    fill={stats.completed === stats.total ? color : '#a1a1aa'}
                    opacity={stats.completed === stats.total ? 0.7 : 0.5}
                    align="center"
                    x={-300}
                    y={104}
                    width={600}
                    fontStyle="bold"
                    letterSpacing={2}
                  />
                </Group>
              );
            })}

            <KonvaNodesLayer
              nodes={layoutNodes as any}
              selectedNodeId={selectedNodeId}
              onNodeClick={handleNodeClick}
              onNodeMouseEnter={handleNodeMouseEnter}
              onNodeMouseLeave={handleNodeMouseLeave}
            />
          </Layer>

          {particles.length > 0 && (
            <Layer listening={false}>
              {particles.map((p) => (
                <Circle
                  key={p.id}
                  x={p.x}
                  y={p.y}
                  radius={p.radius}
                  fill={p.color}
                  opacity={p.alpha}
                  perfectDrawEnabled={false}
                />
              ))}
            </Layer>
          )}
        </Stage>
      )}

      <ScaleNodeModal
        node={selectedNode}
        status={selectedNodeStatus}
        onClose={handleCloseModal}
        onPractice={handlePractice}
      />

      {hoveredNode && hoveredCoords && hoveredFretPositions.length > 0 && (
        <div
          className="absolute z-20 pointer-events-none rounded-xl border border-white/10 bg-[#0e0e11]/90 p-4 shadow-2xl backdrop-blur-md transition-opacity duration-200"
          style={{
            left: hoveredCoords.x,
            top: hoveredCoords.y - 40,
            transform: 'translate(-50%, -100%)',
            width: 260,
          }}
        >
          <div className="mb-2 text-center">
            <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">
              {hoveredNode.data.scaleFamily}
            </p>
            <p className="text-xs font-semibold text-zinc-200">
              {hoveredNode.data.label}
            </p>
            <p className="text-[9px] text-zinc-400">
              {hoveredNode.data.subtitle || ''}
            </p>
          </div>

          <div className="relative mt-3 flex flex-col gap-1.5 rounded-lg bg-black/40 p-2">
            {[1, 2, 3, 4, 5, 6].map((stringNum) => {
              const frets = [];
              for (let f = activeFretRange.min; f <= activeFretRange.max; f++) {
                frets.push(f);
              }
              return (
                <div key={stringNum} className="relative flex items-center justify-between h-4">
                  <div className="absolute inset-x-0 top-1/2 h-[1px] bg-zinc-700/50" />
                  
                  {frets.map((fret) => {
                    const isHighlighted = hoveredFretPositions.some(
                      (p) => p.string === stringNum && p.fret === fret
                    );
                    const family = hoveredNode.data.scaleFamily || 'diatonic';
                    const color = FAMILY_COLORS[family] || '#22d3ee';

                    return (
                      <div
                        key={fret}
                        className="relative flex-1 flex items-center justify-center h-full"
                        style={{
                          borderRight: '1px solid rgba(255,255,255,0.15)',
                        }}
                      >
                        {isHighlighted && (
                          <div
                            className="z-10 h-2 w-2 rounded-full"
                            style={{
                              backgroundColor: color,
                              boxShadow: `0 0 6px ${color}`,
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            <div className="mt-1 flex justify-between px-1 text-[8px] font-mono text-zinc-500">
              {(() => {
                const labels = [];
                for (let f = activeFretRange.min; f <= activeFretRange.max; f++) {
                  labels.push(
                    <span key={f} className="flex-1 text-center">
                      {f}
                    </span>
                  );
                }
                return labels;
              })()}
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
