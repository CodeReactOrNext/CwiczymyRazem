import "@xyflow/react/dist/style.css";

import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import type { Edge, NodeTypes } from "@xyflow/react";
import { motion } from "framer-motion";
import { GitBranch, RefreshCw } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/router";

import { ScaleTreeNodeComponent } from "./ScaleTreeNodeComponent";
import type { ScaleTreeRFNode } from "./ScaleTreeNodeComponent";
import { useScaleTree } from "../hooks/useScaleTree";
import type { ScaleTreeNodeData } from "../types/scaleTree.types";

const NODE_TYPES: NodeTypes = {
  scaleTreeNode: ScaleTreeNodeComponent as NodeTypes[string],
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
    // Thin, dim — show structure without visual chaos.
    if (!isSpine) {
      return {
        ...edge,
        type: "straight" as const,
        style: {
          stroke: isCompleted
            ? "rgba(34,211,238,0.35)"
            : isActive
            ? "rgba(34,211,238,0.18)"
            : "rgba(90,90,115,0.22)",
          strokeWidth: 0.7,
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
          style: { stroke: "rgba(100,100,140,0.45)", strokeWidth: 1.5, strokeDasharray: "10 6" },
          animated: false,
        };
      }
      return {
        ...edge,
        type: "straight" as const,
        style: {
          stroke: isCompleted ? "rgba(34,211,238,0.9)" : "rgba(34,211,238,0.6)",
          strokeWidth: isCompleted ? 3 : 2.5,
        },
        animated: false,
      };
    }

    // ── Within-cluster spine ring — bezier for smooth arc look ───────────────
    return {
      ...edge,
      type: "bezier" as const,
      style: {
        stroke: isCompleted
          ? "rgba(34,211,238,0.7)"
          : isActive
          ? "rgba(34,211,238,0.45)"
          : "rgba(100,100,130,0.55)",
        strokeWidth: isCompleted ? 2 : isActive ? 1.8 : 1.4,
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
  } = useScaleTree();

  const [nodes, setNodes, onNodesChange] = useNodesState<ScaleTreeRFNode>(initialNodes as ScaleTreeRFNode[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(rawEdges);

  useEffect(() => {
    setNodes(initialNodes as ScaleTreeRFNode[]);
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

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl bg-zinc-950">
      {/* Header stats */}
      <div className="absolute left-4 top-4 z-10 flex items-center gap-2 rounded-lg border border-white/10 bg-zinc-900/80 px-3 py-1.5 backdrop-blur-sm">
        <GitBranch className="h-3.5 w-3.5 text-cyan-400" />
        <span className="text-xs font-medium text-zinc-300">
          {completedCount}/413 węzłów
        </span>
        <button
          onClick={refreshProgress}
          disabled={isLoading}
          className="ml-1 flex h-5 w-5 items-center justify-center rounded text-zinc-500 transition-colors hover:text-zinc-300 disabled:opacity-40"
          title="Odśwież postęp"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-1 rounded-lg border border-white/10 bg-zinc-900/80 px-3 py-2 backdrop-blur-sm">
        {[
          { color: "bg-amber-400",  label: "Pentatonika"       },
          { color: "bg-cyan-400",   label: "Skala diatoniczna" },
          { color: "bg-violet-400", label: "Tryb modalny"      },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${color}`} />
            <span className="text-[10px] text-zinc-400">{label}</span>
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
        onNodeClick={(_, node) => {
          const data = node.data as ScaleTreeNodeData;
          if (data.status === "locked") return;
          const req = data.requiredExercises[0];
          if (!req) return;
          router.push(`/practice/scale?type=${data.scaleType}&pos=${req.position}&pattern=${req.patternType}`);
        }}
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
        <Background
          variant={BackgroundVariant.Dots}
          gap={32}
          size={0.8}
          color="rgba(255,255,255,0.025)"
        />
        <Controls
          showInteractive={false}
          className="[&>button]:border-white/10 [&>button]:bg-zinc-900 [&>button]:text-zinc-400 [&>button:hover]:bg-zinc-800"
        />
        <MiniMap
          nodeColor={(node) => {
            const s = (node.data as Record<string, unknown>).status as string;
            if (s === "completed") return "#22d3ee";
            if (s === "in_progress") return "#0891b2";
            if (s === "available") return "#3f3f46";
            return "#27272a";
          }}
          maskColor="rgba(9,9,11,0.7)"
          style={{ backgroundColor: "#18181b", border: "1px solid rgba(255,255,255,0.08)" }}
        />
      </ReactFlow>

      {/* Hint */}
      <motion.p
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="absolute bottom-4 right-4 z-10 text-[10px] text-zinc-600 select-none"
      >
        Kliknij węzeł, aby ćwiczyć
      </motion.p>
    </div>
  );
}
