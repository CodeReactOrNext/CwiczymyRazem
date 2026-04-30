import "@xyflow/react/dist/style.css";

import {
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import type { Edge, Node, NodeTypes } from "@xyflow/react";
import { motion } from "framer-motion";
import { GitBranch, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/router";

import { ScaleTreeNodeComponent } from "./ScaleTreeNodeComponent";
import { ScaleNodeModal } from "./ScaleNodeModal";
import { useScaleTree } from "../hooks/useScaleTree";
import { CLUSTER_LABELS } from "../data/scaleTreeNodes";
import type { ClusterLabelDef } from "../data/scaleTreeNodes";

const FAMILY_COLOR: Record<ClusterLabelDef["family"], string> = {
  pentatonic: "rgba(245,158,11,0.75)",
  diatonic:   "rgba(34,211,238,0.75)",
  mode:       "rgba(167,139,250,0.75)",
};

function ClusterLabelNode({ data }: { data: ClusterLabelDef }) {
  return (
    <div
      style={{
        pointerEvents: "none",
        userSelect: "none",
        textAlign: "center",
        color: FAMILY_COLOR[data.family],
        fontSize: 18,
        fontWeight: 300,
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        lineHeight: 1,
        whiteSpace: "nowrap",
        textShadow: `0 0 18px ${FAMILY_COLOR[data.family]}, 0 0 50px ${FAMILY_COLOR[data.family]}`,
        opacity: 0.5,
      }}
    >
      {data.label}
    </div>
  );
}

const CLUSTER_LABEL_NODES: Node[] = CLUSTER_LABELS.map((lbl) => ({
  id: lbl.id,
  type: "clusterLabel",
  position: { x: lbl.x, y: lbl.y - 240 },
  data: lbl,
  selectable: false,
  draggable: false,
  focusable: false,
}));

const NODE_TYPES: NodeTypes = {
  scaleTreeNode: ScaleTreeNodeComponent as NodeTypes[string],
  clusterLabel:  ClusterLabelNode as NodeTypes[string],
};

/** Extracts the scale cluster ID from a node ID (e.g. "min_pent_pos5_asc" → "min_pent"). */
function getScaleId(nodeId: string): string {
  const m = nodeId.match(/^(.*?)_pos\d+/);
  return m ? m[1] : nodeId;
}

function buildStyledEdges(rawEdges: Edge[], nodeStatuses: Record<string, string>): Edge[] {
  return rawEdges.map((edge) => {
    const sourceStatus   = nodeStatuses[edge.source];
    const targetStatus   = nodeStatuses[edge.target];
    const isCompleted    = sourceStatus === "completed" && targetStatus === "completed";
    const isActive       = sourceStatus === "completed" || sourceStatus === "in_progress";
    const isSpine        = edge.source.endsWith("_asc") && edge.target.endsWith("_asc");
    const isCrossCluster = isSpine && getScaleId(edge.source) !== getScaleId(edge.target);

    // ── Branch edges (arm chains within each cluster) ────────────────────────
    if (!isSpine) {
      return {
        ...edge,
        type: "straight" as const,
        style: {
          stroke: isCompleted
            ? "rgba(34,211,238,0.50)"
            : isActive
            ? "rgba(34,211,238,0.28)"
            : "rgba(70,70,100,0.28)",
          strokeWidth: isCompleted ? 2.5 : 1.5,
          filter: isCompleted ? "drop-shadow(0 0 4px rgba(34,211,238,0.6))" : "none",
        },
        animated: false,
      };
    }

    // ── Cross-cluster "roads" ────────────────────────────────────────────────
    if (isCrossCluster) {
      if (!isActive) {
        return {
          ...edge,
          type: "straight" as const,
          style: { stroke: "rgba(70,70,100,0.35)", strokeWidth: 3, strokeDasharray: "14 8" },
          animated: false,
        };
      }
      return {
        ...edge,
        type: "straight" as const,
        style: {
          stroke: isCompleted ? "rgba(34,211,238,0.95)" : "rgba(34,211,238,0.70)",
          strokeWidth: isCompleted ? 6 : 5,
          filter: isCompleted
            ? "drop-shadow(0 0 8px rgba(34,211,238,0.95))"
            : "drop-shadow(0 0 5px rgba(34,211,238,0.60))",
        },
        animated: false,
      };
    }

    // ── Within-cluster spine ring — bezier for smooth arc look ───────────────
    return {
      ...edge,
      type: "straight" as const,
      style: {
        stroke: isCompleted
          ? "rgba(34,211,238,0.80)"
          : isActive
          ? "rgba(34,211,238,0.50)"
          : "rgba(70,70,100,0.40)",
        strokeWidth: isCompleted ? 4.5 : isActive ? 3.5 : 2.5,
        filter: isCompleted
          ? "drop-shadow(0 0 5px rgba(34,211,238,0.75))"
          : isActive
          ? "drop-shadow(0 0 3px rgba(34,211,238,0.45))"
          : "none",
      },
      animated: false,
    };
  });
}

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
  } = useScaleTree();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([...CLUSTER_LABEL_NODES, ...(initialNodes as Node[])]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(rawEdges);

  useEffect(() => {
    setNodes((prev) => {
      const selectedId = prev.find((n) => n.selected)?.id ?? null;
      return [
        ...CLUSTER_LABEL_NODES,
        ...(initialNodes as Node[]).map((n) => ({ ...n, selected: n.id === selectedId })),
      ];
    });
  }, [initialNodes, setNodes]);

  const nodeStatuses = useMemo(() => {
    const map: Record<string, string> = {};
    initialNodes.forEach((n) => {
      map[n.id] = n.data.status as string;
    });
    return map;
  }, [initialNodes]);

  useEffect(() => {
    setEdges(buildStyledEdges(rawEdges, nodeStatuses));
  }, [rawEdges, nodeStatuses, setEdges]);

  const completedCount = useMemo(
    () => Object.values(nodeStatuses).filter((s) => s === "completed").length,
    [nodeStatuses]
  );

  const handleNodeClick = useCallback((_: unknown, node: Node) => {
    if (node.type === "clusterLabel") return;
    setSelectedNodeId((prev) => {
      const newId = prev === node.id ? null : node.id;
      setNodes((nds) => nds.map((n) => {
        if (n.id === prev || n.id === newId) return { ...n, selected: n.id === newId };
        return n;
      }));
      return newId;
    });
  }, [setSelectedNodeId, setNodes]);

  const handlePractice = useCallback(() => {
    if (!selectedNode) return;
    const req = selectedNode.requiredExercises[0];
    if (!req) return;
    router.push(`/practice/scale?type=${selectedNode.scaleType}&pos=${req.position}&pattern=${req.patternType}`);
  }, [selectedNode, router]);

  const handleCloseModal = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl" style={{ background: "#02020a" }}>
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Ambient glow orbs */}
        <div className="absolute left-1/2 top-[-10%] -translate-x-1/2 h-[75%] w-[90%] rounded-[100%]"
          style={{ background: "radial-gradient(ellipse, rgba(34,211,238,0.07) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute left-[3%] bottom-[5%] h-[55%] w-[45%] rounded-[100%]"
          style={{ background: "radial-gradient(ellipse, rgba(167,139,250,0.06) 0%, transparent 70%)", filter: "blur(80px)" }} />
        <div className="absolute right-[3%] top-[15%] h-[50%] w-[40%] rounded-[100%]"
          style={{ background: "radial-gradient(ellipse, rgba(245,158,11,0.05) 0%, transparent 70%)", filter: "blur(80px)" }} />
        {/* Dot grid pattern */}
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.035 }}>
          <defs>
            <pattern id="scale-tree-dots" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
              <circle cx="18" cy="18" r="0.9" fill="rgba(200,220,255,1)" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#scale-tree-dots)" />
        </svg>
        {/* Subtle scanline vignette */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,6,0.55) 100%)",
        }} />
      </div>

      {/* Header stats */}
      <div
        className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-lg px-3 py-1.5 backdrop-blur-md"
        style={{
          border: "1px solid rgba(34,211,238,0.18)",
          background: "rgba(2,2,16,0.75)",
          boxShadow: "0 0 24px rgba(34,211,238,0.06), inset 0 0 16px rgba(34,211,238,0.03)",
        }}
      >
        <GitBranch className="h-3.5 w-3.5 text-cyan-400" style={{ filter: "drop-shadow(0 0 4px rgba(34,211,238,0.7))" }} />
        <span className="text-xs font-light tracking-widest text-zinc-300">
          {completedCount} <span className="text-zinc-600">/</span> 413
        </span>
        <button
          onClick={refreshProgress}
          disabled={isLoading}
          className="ml-1 flex h-5 w-5 items-center justify-center rounded text-zinc-600 transition-colors hover:text-cyan-400 disabled:opacity-30"
          title="Refresh progress"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Legend */}
      <div
        className="absolute bottom-4 left-4 z-10 flex flex-col gap-2 rounded-lg px-3 py-2.5 backdrop-blur-md"
        style={{
          border: "1px solid rgba(255,255,255,0.07)",
          background: "rgba(2,2,16,0.75)",
        }}
      >
        {[
          { hex: "#f59e0b", glow: "rgba(245,158,11,0.65)",  label: "Pentatonic"     },
          { hex: "#22d3ee", glow: "rgba(34,211,238,0.65)",   label: "Diatonic Scale" },
          { hex: "#a78bfa", glow: "rgba(167,139,250,0.65)", label: "Modal Mode"      },
        ].map(({ hex, glow, label }) => (
          <div key={label} className="flex items-center gap-2">
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: hex, boxShadow: `0 0 6px ${glow}`, flexShrink: 0 }} />
            <span className="text-[10px] font-light tracking-wide text-zinc-500">{label}</span>
          </div>
        ))}
      </div>

      {/* React Flow canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={NODE_TYPES}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.12 }}
        nodeOrigin={[0.5, 0.5]}
        minZoom={0.08}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
        colorMode="dark"
      >
        <Controls
          showInteractive={false}
          className="[&>button]:border-cyan-500/15 [&>button]:bg-black/70 [&>button]:text-zinc-500 [&>button:hover]:bg-black/90 [&>button:hover]:text-cyan-400"
        />
        <MiniMap
          nodeColor={(node) => {
            const s = (node.data as Record<string, unknown>).status as string;
            if (s === "completed") return "#22d3ee";
            if (s === "in_progress") return "#0e7490";
            if (s === "available") return "#2a2a38";
            return "#111118";
          }}
          maskColor="rgba(2,2,10,0.80)"
          style={{ backgroundColor: "#06060f", border: "1px solid rgba(34,211,238,0.12)" }}
        />
      </ReactFlow>

      {/* Node detail modal */}
      <ScaleNodeModal
        node={selectedNode}
        status={selectedNodeStatus}
        onClose={handleCloseModal}
        onPractice={handlePractice}
      />

      {/* Hint — hidden when modal is open */}
      {!selectedNodeId && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="absolute bottom-4 right-4 z-10 text-[9px] font-light tracking-widest uppercase text-zinc-700 select-none"
        >
          Click a node to practice
        </motion.p>
      )}
    </div>
  );
}
