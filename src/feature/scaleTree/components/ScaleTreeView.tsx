import "@xyflow/react/dist/style.css";

import {
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  Background,
  SelectionMode,
  BackgroundVariant,
  MarkerType,
} from "@xyflow/react";
import type { Edge, Node, NodeTypes } from "@xyflow/react";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { addEdge, Connection } from "@xyflow/react";
import { toggleBpmStage } from "feature/exercisePlan/services/bpmProgressService";

import { ScaleTreeNodeComponent } from "./ScaleTreeNodeComponent";
import { ScaleNodeModal } from "./ScaleNodeModal";
import { ScaleTreeDevPanel } from "./ScaleTreeDevPanel";
import { useScaleTree } from "../hooks/useScaleTree";
import { CLUSTER_LABELS } from "../data/scaleTreeNodes";
import type { ClusterLabelDef } from "../data/scaleTreeNodes";
import { organizeNodesByFamily, organizeByScaleTypeRings, organizeByScaleTypeHierarchy, organizeByGridSimple } from "../data/scaleTreeLayouts";

// ── Stable starfield (deterministic pseudo-random) ──────────────────────────
const STARS = Array.from({ length: 220 }, (_, i) => ({
  x: ((i * 7919 + 13) % 10000) / 100,
  y: ((i * 6271 + 47) % 10000) / 100,
  r: ((i * 3571 + 23) % 12) / 10 + 0.2,
  o: ((i * 4999 + 37) % 5) / 10 + 0.08,
}));

// ── Path direction labels (Rhythm / Lead / Harmony / Style) ─────────────────
function PathLabelNode({ data }: { data: { label: string; color: string } }) {
  return (
    <div style={{
      pointerEvents: "none",
      userSelect: "none",
      background: `rgba(20,20,40,0.4)`,
      border: `1px solid ${data.color}40`,
      borderRadius: 4,
      padding: "5px 16px",
      color: data.color,
      fontSize: 11,
      fontWeight: 400,
      letterSpacing: "0.22em",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
      opacity: 0.75,
    }}>
      {data.label}
    </div>
  );
}

const PATH_LABEL_NODES: Node[] = [
  { id: "pl_major",   type: "pathLabel", position: { x: 550,   y: -430  }, data: { label: "Lead Path",    color: "#22d3ee" }, selectable: false, draggable: false, focusable: false },
  { id: "pl_minor",   type: "pathLabel", position: { x: -550,  y: -430  }, data: { label: "Rhythm Path",  color: "#22d3ee" }, selectable: false, draggable: false, focusable: false },
  { id: "pl_modes_l", type: "pathLabel", position: { x: -2550, y: -500  }, data: { label: "Modal (Minor)", color: "#a78bfa" }, selectable: false, draggable: false, focusable: false },
  { id: "pl_modes_r", type: "pathLabel", position: { x: 2450,  y: -800  }, data: { label: "Modal (Major)", color: "#f59e0b" }, selectable: false, draggable: false, focusable: false },
];

// ── Family filter config ─────────────────────────────────────────────────────
type FamilyKey = "pentatonic" | "diatonic" | "mode";
const FAMILIES: { key: FamilyKey; color: string; glow: string; label: string }[] = [
  { key: "pentatonic", color: "#f59e0b", glow: "rgba(245,158,11,0.70)", label: "Pentatonic" },
  { key: "diatonic",   color: "#22d3ee", glow: "rgba(34,211,238,0.70)",  label: "Diatonic"   },
  { key: "mode",       color: "#a78bfa", glow: "rgba(167,139,250,0.70)", label: "Modal"      },
];

// ── Cluster labels ───────────────────────────────────────────────────────────
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
  position: { x: lbl.x, y: lbl.y - 155 },
  data: lbl,
  selectable: false,
  draggable: false,
  focusable: false,
}));

const STATIC_OVERLAY_NODES: Node[] = [...CLUSTER_LABEL_NODES, ...PATH_LABEL_NODES];

const NODE_TYPES: NodeTypes = {
  scaleTreeNode: ScaleTreeNodeComponent as NodeTypes[string],
  clusterLabel:  ClusterLabelNode as NodeTypes[string],
  pathLabel:     PathLabelNode as NodeTypes[string],
};

function getScaleId(nodeId: string): string {
  const m = nodeId.match(/^(.*?)_pos\d+/);
  return m ? m[1] : nodeId;
}

const FAMILY_EDGE_COLORS: Record<string, string> = {
  pentatonic: "245, 158, 11",
  diatonic:   "34, 211, 238",
  mode:       "167, 139, 250",
};

function buildStyledEdges(rawEdges: Edge[], nodeDataMap: Record<string, { status: string; family: string; isSingleString: boolean }>, nodes: Node[]): Edge[] {
  return rawEdges.map((edge) => {
    const sourceData = nodeDataMap[edge.source] || { status: "locked", family: "diatonic", isSingleString: false };
    const targetData = nodeDataMap[edge.target] || { status: "locked", family: "diatonic", isSingleString: false };
    const isCompleted = sourceData.status === "completed" && targetData.status === "completed";
    const isActive = sourceData.status === "completed" || sourceData.status === "in_progress";
    const isSpine = edge.source.endsWith("_asc") && edge.target.endsWith("_asc");
    const isCrossCluster = isSpine && getScaleId(edge.source) !== getScaleId(edge.target);

    const cRGB = FAMILY_EDGE_COLORS[sourceData.family] || FAMILY_EDGE_COLORS.diatonic;
    const isSingleStringEdge = sourceData.isSingleString && targetData.isSingleString;

    // Determine thickness and style
    let strokeWidth = isCompleted ? 6 : isActive ? 4 : 2.5;
    let opacity = isCompleted ? 0.9 : isActive ? 0.7 : 0.6;

    if (!isSpine) {
      strokeWidth = isCompleted ? 4 : 2.5;
      opacity = isCompleted ? 0.7 : isActive ? 0.5 : 0.5;
    } else if (isCrossCluster) {
      strokeWidth = isCompleted ? 8 : 5;
      opacity = isCompleted ? 1 : 0.8;
    }

    if (isSingleStringEdge) {
      strokeWidth = isCompleted ? 10 : 7;
      opacity = isCompleted ? 1 : 0.8;
    }

    const isLockedCrossCluster = isCrossCluster && !isActive;

    // Dynamic Handle Selection
    const sourceNode = nodes.find((n) => n.id === edge.source);
    const targetNode = nodes.find((n) => n.id === edge.target);
    let sourceHandle = "s_bottom";
    let targetHandle = "t_top";

    if (sourceNode && targetNode) {
      const dx = targetNode.position.x - sourceNode.position.x;
      const dy = targetNode.position.y - sourceNode.position.y;

      if (Math.abs(dx) > Math.abs(dy) * 1.5) {
        // Horizontal connection is dominant
        if (dx > 0) {
          sourceHandle = "s_right";
          targetHandle = "t_left";
        } else {
          sourceHandle = "s_left";
          targetHandle = "t_right";
        }
      } else {
        // Vertical connection is dominant
        if (dy < 0) {
          sourceHandle = "s_top";
          targetHandle = "t_bottom";
        } else {
          sourceHandle = "s_bottom";
          targetHandle = "t_top";
        }
      }
    }

    return {
      ...edge,
      sourceHandle,
      targetHandle,
      type: edge.type || "straight",
      style: {
        stroke: isLockedCrossCluster ? "rgba(80,80,130,0.15)" : `rgba(${cRGB}, ${opacity})`,
        strokeWidth: isLockedCrossCluster ? 2 : strokeWidth,
        strokeDasharray: isLockedCrossCluster ? "8 8" : "none",
        filter: isLockedCrossCluster ? undefined : (isCompleted || isActive ? `url(#edge-glow)` : undefined),
      },
      animated: isCompleted && isCrossCluster,
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
    userId,
  } = useScaleTree();

  const [familyFilter, setFamilyFilter] = useState<FamilyKey | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [copiedPattern, setCopiedPattern] = useState<Record<string, { x: number; y: number }> | null>(null);
  const [nodes, setNodes, onNodesChangeRaw] = useNodesState<Node>([...STATIC_OVERLAY_NODES, ...(initialNodes as Node[])]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(rawEdges);

  // Prevent accidental node deletion
  const onNodesChange = useCallback((changes: any) => {
    const filteredChanges = changes.filter((c: any) => c.type !== "remove");
    onNodesChangeRaw(filteredChanges);
  }, [onNodesChangeRaw]);

  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);
      if (!sourceNode || !targetNode) return;

      let sourceHandle = "s_bottom";
      let targetHandle = "t_top";

      const dx = targetNode.position.x - sourceNode.position.x;
      const dy = targetNode.position.y - sourceNode.position.y;

      if (Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx > 0) {
          sourceHandle = "s_right";
          targetHandle = "t_left";
        } else {
          sourceHandle = "s_left";
          targetHandle = "t_right";
        }
      } else {
        if (dy < 0) {
          sourceHandle = "s_top";
          targetHandle = "t_bottom";
        } else {
          sourceHandle = "s_bottom";
          targetHandle = "t_top";
        }
      }

      setEdges((eds) => addEdge({ ...params, sourceHandle, targetHandle }, eds));
    },
    [setEdges, nodes]
  );

  const onEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      setEdges((eds) => eds.filter(e => !deleted.find(d => d.id === e.id)));
    },
    [setEdges]
  );

  const handleExport = useCallback(() => {
    const simplifiedNodes = nodes.map(n => ({ id: n.id, x: Math.round(n.position.x), y: Math.round(n.position.y) }));
    const simplifiedEdges = edges.map(e => ({ source: e.source, target: e.target, type: e.type }));
    const result = { nodes: simplifiedNodes, edges: simplifiedEdges };
    const json = JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(json).then(() => alert("Skopiowano do schowka! Wklej w czacie."));
    console.log(result);
  }, [nodes, edges]);

  const handleClear = useCallback(() => {
    if (confirm("Czy na pewno chcesz usunąć zapisany układ z pamięci i wrócić do domyślnego?")) {
      localStorage.removeItem("scale_tree_layout_dev");
      window.location.reload();
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (nodes.length <= STATIC_OVERLAY_NODES.length) return;
    const timeout = setTimeout(() => {
      const simplifiedNodes = nodes.map(n => ({ id: n.id, x: Math.round(n.position.x), y: Math.round(n.position.y) }));
      const simplifiedEdges = edges.map(e => ({ source: e.source, target: e.target, type: e.type }));
      localStorage.setItem("scale_tree_layout_dev", JSON.stringify({ nodes: simplifiedNodes, edges: simplifiedEdges }));
    }, 500);
    return () => clearTimeout(timeout);
  }, [nodes, edges]);

  useEffect(() => {
    // Always use grid simple layout from organizeByGridSimple
    const { nodes: layoutNodes } = organizeByGridSimple(initialNodes as Node[], rawEdges);

    setNodes((prev) => {
      const selectedId = prev.find((n) => n.selected)?.id ?? null;
      return [
        ...STATIC_OVERLAY_NODES,
        ...(layoutNodes as Node[]).map((n) => ({
          ...n,
          selected: n.id === selectedId,
          data: {
            ...n.data,
            dimmed: familyFilter !== null && n.data.scaleFamily !== familyFilter,
          },
        })),
      ];
    });
  }, [initialNodes, rawEdges, setNodes, familyFilter]);

  const nodeDataMap = useMemo(() => {
    const map: Record<string, { status: string; family: string; isSingleString: boolean }> = {};
    initialNodes.forEach((n) => {
      const isSingleString = n.data.requiredExercises?.[0]?.stringNum != null || (n.data.requiredExercises?.[0]?.patternType as any) === "single_string";
      map[n.id] = { 
        status: n.data.status as string, 
        family: n.data.scaleFamily as string,
        isSingleString
      };
    });
    return map;
  }, [initialNodes]);

  useEffect(() => {
    // Always use rawEdges as the source of truth (localStorage disabled)
    setEdges(rawEdges.map((e, idx) => ({
      id: e.id || `edge-${e.source}-${e.target}-${idx}`,
      source: e.source,
      target: e.target,
      sourceHandle: "s_bottom",
      targetHandle: "t_top",
      type: "straight",
    })));
  }, [rawEdges, setEdges]);

  const styledEdges = useMemo(() => buildStyledEdges(edges, nodeDataMap, nodes), [edges, nodeDataMap, nodes]);

  const completedCount = useMemo(
    () => Object.values(nodeDataMap).filter((d) => d.status === "completed").length,
    [nodeDataMap]
  );

  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.type === "clusterLabel") return;

    if (event.shiftKey) return;

    setSelectedNodeId(node.id);
  }, [setSelectedNodeId]);

  const handleEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    const edgeTypes = ["straight", "smoothstep", "step", "bezier"] as const;
    const currentType = edge.type || "straight";
    const nextIdx = (edgeTypes.indexOf(currentType as any) + 1) % edgeTypes.length;
    const nextType = edgeTypes[nextIdx];

    setEdges((eds) => eds.map((e) => (e.id === edge.id ? { ...e, type: nextType } : e)));
  }, [setEdges]);

  const handleAlignX = useCallback(() => {
    const selected = nodes.filter((n) => n.selected && !n.id.startsWith("pl_"));
    if (selected.length < 2) return alert("Zaznacz co najmniej 2 węzły (Shift + Click lub Shift + przeciągnięcie)");
    const targetX = Math.round(selected[0].position.x);
    setNodes((nds) => nds.map((n) => (n.selected && !n.id.startsWith("pl_") ? { ...n, position: { ...n.position, x: targetX } } : n)));
  }, [nodes, setNodes]);

  const handleAlignY = useCallback(() => {
    const selected = nodes.filter((n) => n.selected && !n.id.startsWith("pl_"));
    if (selected.length < 2) return alert("Zaznacz co najmniej 2 węzły (Shift + Click lub Shift + przeciągnięcie)");
    const targetY = Math.round(selected[0].position.y);
    setNodes((nds) => nds.map((n) => (n.selected && !n.id.startsWith("pl_") ? { ...n, position: { ...n.position, y: targetY } } : n)));
  }, [nodes, setNodes]);

  const handleAlignChildren = useCallback((direction: 'down' | 'up') => {
    const selectedParent = nodes.find(n => n.selected);
    if (!selectedParent) return;

    const childIds = edges
      .filter(edge => edge.source === selectedParent.id)
      .map(edge => edge.target);

    if (childIds.length === 0) return;

    const isUpwards = direction === 'up';
    const GAP_Y = isUpwards ? -150 : 150;
    const parentX = selectedParent.position.x;
    const parentY = selectedParent.position.y;

    setNodes(nds => nds.map(node => {
      const childIndex = childIds.indexOf(node.id);
      if (childIndex !== -1) {
        return {
          ...node,
          position: {
            x: parentX,
            y: parentY + (childIndex + 1) * GAP_Y
          }
        };
      }
      return node;
    }));
  }, [nodes, edges, setNodes]);

  const handleAlignHorizontal = useCallback((direction: 'right' | 'left') => {
    const selectedParent = nodes.find(n => n.selected);
    if (!selectedParent) return;

    const childIds = edges
      .filter(edge => edge.source === selectedParent.id)
      .map(edge => edge.target);

    if (childIds.length === 0) return;

    const isShift = direction === 'left';
    const OFFSET_X = 280;
    const parentX = selectedParent.position.x;
    const parentY = selectedParent.position.y;

    const targetX = isShift ? parentX - OFFSET_X : parentX + OFFSET_X;

    setNodes(nds => nds.map(node => {
      const childIndex = childIds.indexOf(node.id);
      if (childIndex !== -1) {
        const spacing = 100;
        const startY = parentY - ((childIds.length - 1) * spacing) / 2;
        return {
          ...node,
          position: {
            x: targetX,
            y: startY + childIndex * spacing
          }
        };
      }
      return node;
    }));
  }, [nodes, edges, setNodes]);

  const handleCircularLayout = useCallback(() => {
    const selectedParent = nodes.find(n => n.selected);
    if (!selectedParent) return;

    const childIds = edges
      .filter(edge => edge.source === selectedParent.id)
      .map(edge => edge.target);

    if (childIds.length === 0) return;

    const RADIUS = 220;
    const parentX = selectedParent.position.x;
    const parentY = selectedParent.position.y;

    setNodes(nds => nds.map(node => {
      const childIndex = childIds.indexOf(node.id);
      if (childIndex !== -1) {
        const angleCount = childIds.length;
        const startAngle = Math.PI * 0.2;
        const endAngle = Math.PI * 0.8;
        const angleStep = angleCount > 1 ? (endAngle - startAngle) / (angleCount - 1) : 0;
        const angle = startAngle + childIndex * angleStep;

        return {
          ...node,
          position: {
            x: parentX + Math.cos(angle) * RADIUS * 1.5,
            y: parentY + Math.sin(angle) * RADIUS
          }
        };
      }
      return node;
    }));
  }, [nodes, edges, setNodes]);

  const handleSelectBranch = useCallback(() => {
    const selectedParent = nodes.find(n => n.selected);
    if (!selectedParent) return;

    const branchIds = new Set<string>();
    const findChildren = (parentId: string) => {
      edges
        .filter(edge => edge.source === parentId)
        .forEach(edge => {
          if (!branchIds.has(edge.target)) {
            branchIds.add(edge.target);
            findChildren(edge.target);
          }
        });
    };

    findChildren(selectedParent.id);
    if (branchIds.size === 0) return;

    setNodes(nds => nds.map(node => ({
      ...node,
      selected: branchIds.has(node.id) || node.id === selectedParent.id
    })));
  }, [nodes, edges, setNodes]);

  const handleMirrorHorizontal = useCallback(() => {
    const selected = nodes.filter(n => n.selected && !n.id.startsWith("pl_"));
    if (selected.length < 2) return;

    const minX = Math.min(...selected.map(n => n.position.x));
    const maxX = Math.max(...selected.map(n => n.position.x));
    const centerX = (minX + maxX) / 2;

    setNodes(nds => nds.map(n => {
      if (n.selected && !n.id.startsWith("pl_")) {
        return {
          ...n,
          position: { ...n.position, x: Math.round(centerX - (n.position.x - centerX)) }
        };
      }
      return n;
    }));
  }, [nodes, setNodes]);

  const handleCopyPattern = useCallback(() => {
    const selected = nodes.find(n => n.selected);
    if (!selected) return;

    const scaleId = getScaleId(selected.id);
    const scaleNodes = nodes.filter(n => getScaleId(n.id) === scaleId);

    const root = scaleNodes.find(n => n.id.endsWith("_pos1_asc")) || scaleNodes[0];
    const pattern: Record<string, { x: number; y: number }> = {};

    scaleNodes.forEach(n => {
      const suffix = n.id.replace(scaleId + "_", "");
      pattern[suffix] = {
        x: n.position.x - root.position.x,
        y: n.position.y - root.position.y
      };
    });

    setCopiedPattern(pattern);
  }, [nodes]);

  const handlePastePattern = useCallback(() => {
    if (!copiedPattern) return;
    const selected = nodes.find(n => n.selected);
    if (!selected) return;

    const scaleId = getScaleId(selected.id);
    const scaleNodes = nodes.filter(n => getScaleId(n.id) === scaleId);
    const root = scaleNodes.find(n => n.id.endsWith("_pos1_asc")) || scaleNodes[0];

    setNodes(nds => nds.map(n => {
      if (getScaleId(n.id) === scaleId) {
        const suffix = n.id.replace(scaleId + "_", "");
        if (copiedPattern[suffix]) {
          return {
            ...n,
            position: {
              x: Math.round(root.position.x + copiedPattern[suffix].x),
              y: Math.round(root.position.y + copiedPattern[suffix].y)
            }
          };
        }
      }
      return n;
    }));
  }, [nodes, copiedPattern, setNodes]);

  const handleDistributeH = useCallback(() => {
    const selected = nodes.filter(n => n.selected && !n.id.startsWith("pl_"));
    if (selected.length < 2) return;

    const sortedByX = [...selected].sort((a, b) => a.position.x - b.position.x);
    const minX = sortedByX[0].position.x;
    const maxX = sortedByX[sortedByX.length - 1].position.x;
    const spacing = (maxX - minX) / (sortedByX.length - 1);

    setNodes(nds => nds.map((n) => {
      const idx = sortedByX.findIndex(s => s.id === n.id);
      if (idx !== -1) {
        return {
          ...n,
          position: { ...n.position, x: Math.round(minX + idx * spacing) }
        };
      }
      return n;
    }));
  }, [nodes, setNodes]);

  const handleDistributeV = useCallback(() => {
    const selected = nodes.filter(n => n.selected && !n.id.startsWith("pl_"));
    if (selected.length < 2) return;

    const sortedByY = [...selected].sort((a, b) => a.position.y - b.position.y);
    const minY = sortedByY[0].position.y;
    const maxY = sortedByY[sortedByY.length - 1].position.y;
    const spacing = (maxY - minY) / (sortedByY.length - 1);

    setNodes(nds => nds.map((n) => {
      const idx = sortedByY.findIndex(s => s.id === n.id);
      if (idx !== -1) {
        return {
          ...n,
          position: { ...n.position, y: Math.round(minY + idx * spacing) }
        };
      }
      return n;
    }));
  }, [nodes, setNodes]);

  const handleGridLayout = useCallback((cols: number) => {
    const selected = nodes.filter(n => n.selected && !n.id.startsWith("pl_"));
    if (selected.length < 2) return;

    const avgX = selected.reduce((sum, n) => sum + n.position.x, 0) / selected.length;
    const avgY = selected.reduce((sum, n) => sum + n.position.y, 0) / selected.length;

    const spacing = 150;
    const rows = Math.ceil(selected.length / cols);

    setNodes(nds => nds.map((n) => {
      const idx = selected.findIndex(s => s.id === n.id);
      if (idx !== -1) {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        return {
          ...n,
          position: {
            x: Math.round(avgX - ((cols - 1) * spacing) / 2 + col * spacing),
            y: Math.round(avgY - ((rows - 1) * spacing) / 2 + row * spacing)
          }
        };
      }
      return n;
    }));
  }, [nodes, setNodes]);

  const handleLineLayout = useCallback((direction: 'horizontal' | 'vertical') => {
    const selected = nodes.filter(n => n.selected && !n.id.startsWith("pl_"));
    if (selected.length < 2) return;

    const avgX = selected.reduce((sum, n) => sum + n.position.x, 0) / selected.length;
    const avgY = selected.reduce((sum, n) => sum + n.position.y, 0) / selected.length;

    const spacing = 120;

    if (direction === 'horizontal') {
      setNodes(nds => nds.map((n) => {
        const idx = selected.findIndex(s => s.id === n.id);
        if (idx !== -1) {
          return {
            ...n,
            position: {
              x: Math.round(avgX - ((selected.length - 1) * spacing) / 2 + idx * spacing),
              y: Math.round(avgY)
            }
          };
        }
        return n;
      }));
    } else {
      setNodes(nds => nds.map((n) => {
        const idx = selected.findIndex(s => s.id === n.id);
        if (idx !== -1) {
          return {
            ...n,
            position: {
              x: Math.round(avgX),
              y: Math.round(avgY - ((selected.length - 1) * spacing) / 2 + idx * spacing)
            }
          };
        }
        return n;
      }));
    }
  }, [nodes, setNodes]);

  const handleHexagonLayout = useCallback(() => {
    const selected = nodes.filter(n => n.selected && !n.id.startsWith("pl_"));
    if (selected.length < 3) return;

    const avgX = selected.reduce((sum, n) => sum + n.position.x, 0) / selected.length;
    const avgY = selected.reduce((sum, n) => sum + n.position.y, 0) / selected.length;
    const radius = 150;

    setNodes(nds => nds.map((n) => {
      const idx = selected.findIndex(s => s.id === n.id);
      if (idx !== -1) {
        const angle = (idx / selected.length) * Math.PI * 2;
        return {
          ...n,
          position: {
            x: Math.round(avgX + Math.cos(angle) * radius),
            y: Math.round(avgY + Math.sin(angle) * radius)
          }
        };
      }
      return n;
    }));
  }, [nodes, setNodes]);

  const handleSpiralLayout = useCallback(() => {
    const selected = nodes.filter(n => n.selected && !n.id.startsWith("pl_"));
    if (selected.length < 2) return;

    const avgX = selected.reduce((sum, n) => sum + n.position.x, 0) / selected.length;
    const avgY = selected.reduce((sum, n) => sum + n.position.y, 0) / selected.length;

    setNodes(nds => nds.map((n) => {
      const idx = selected.findIndex(s => s.id === n.id);
      if (idx !== -1) {
        const t = idx / selected.length;
        const angle = t * Math.PI * 6;
        const radius = t * 200;
        return {
          ...n,
          position: {
            x: Math.round(avgX + Math.cos(angle) * radius),
            y: Math.round(avgY + Math.sin(angle) * radius)
          }
        };
      }
      return n;
    }));
  }, [nodes, setNodes]);

  const handleWaveLayout = useCallback((direction: 'horizontal' | 'vertical') => {
    const selected = nodes.filter(n => n.selected && !n.id.startsWith("pl_"));
    if (selected.length < 2) return;

    const avgX = selected.reduce((sum, n) => sum + n.position.x, 0) / selected.length;
    const avgY = selected.reduce((sum, n) => sum + n.position.y, 0) / selected.length;

    if (direction === 'horizontal') {
      setNodes(nds => nds.map((n) => {
        const idx = selected.findIndex(s => s.id === n.id);
        if (idx !== -1) {
          const x = avgX - ((selected.length - 1) * 120) / 2 + idx * 120;
          const y = avgY + Math.sin((idx / selected.length) * Math.PI * 2) * 80;
          return { ...n, position: { x: Math.round(x), y: Math.round(y) } };
        }
        return n;
      }));
    } else {
      setNodes(nds => nds.map((n) => {
        const idx = selected.findIndex(s => s.id === n.id);
        if (idx !== -1) {
          const x = avgX + Math.sin((idx / selected.length) * Math.PI * 2) * 80;
          const y = avgY - ((selected.length - 1) * 120) / 2 + idx * 120;
          return { ...n, position: { x: Math.round(x), y: Math.round(y) } };
        }
        return n;
      }));
    }
  }, [nodes, setNodes]);

  const handlePolygonLayout = useCallback(() => {
    const selected = nodes.filter(n => n.selected && !n.id.startsWith("pl_"));
    if (selected.length < 3) return;

    const avgX = selected.reduce((sum, n) => sum + n.position.x, 0) / selected.length;
    const avgY = selected.reduce((sum, n) => sum + n.position.y, 0) / selected.length;
    const radius = 120 + (selected.length * 15);

    setNodes(nds => nds.map((n) => {
      const idx = selected.findIndex(s => s.id === n.id);
      if (idx !== -1) {
        const angle = (idx / selected.length) * Math.PI * 2 - Math.PI / 2;
        return {
          ...n,
          position: {
            x: Math.round(avgX + Math.cos(angle) * radius),
            y: Math.round(avgY + Math.sin(angle) * radius)
          }
        };
      }
      return n;
    }));
  }, [nodes, setNodes]);

  const handleRadialLayout = useCallback(() => {
    const selected = nodes.filter(n => n.selected && !n.id.startsWith("pl_"));
    if (selected.length < 2) return;

    const avgX = selected.reduce((sum, n) => sum + n.position.x, 0) / selected.length;
    const avgY = selected.reduce((sum, n) => sum + n.position.y, 0) / selected.length;

    setNodes(nds => nds.map((n) => {
      const idx = selected.findIndex(s => s.id === n.id);
      if (idx !== -1) {
        const angle = (idx / selected.length) * Math.PI * 2;
        const radius = 140;
        return {
          ...n,
          position: {
            x: Math.round(avgX + Math.cos(angle) * radius),
            y: Math.round(avgY + Math.sin(angle) * radius)
          }
        };
      }
      return n;
    }));
  }, [nodes, setNodes]);

  const handleStaircaseLayout = useCallback(() => {
    const selected = nodes.filter(n => n.selected && !n.id.startsWith("pl_"));
    if (selected.length < 2) return;

    const avgX = selected.reduce((sum, n) => sum + n.position.x, 0) / selected.length;
    const avgY = selected.reduce((sum, n) => sum + n.position.y, 0) / selected.length;
    const spacing = 130;

    setNodes(nds => nds.map((n) => {
      const idx = selected.findIndex(s => s.id === n.id);
      if (idx !== -1) {
        return {
          ...n,
          position: {
            x: Math.round(avgX - ((selected.length - 1) * spacing) / 2 + idx * spacing),
            y: Math.round(avgY - ((selected.length - 1) * spacing) / 2 + idx * spacing)
          }
        };
      }
      return n;
    }));
  }, [nodes, setNodes]);

  const handleSCurveLayout = useCallback(() => {
    const selected = nodes.filter(n => n.selected && !n.id.startsWith("pl_"));
    if (selected.length < 2) return;

    const avgX = selected.reduce((sum, n) => sum + n.position.x, 0) / selected.length;
    const avgY = selected.reduce((sum, n) => sum + n.position.y, 0) / selected.length;

    setNodes(nds => nds.map((n) => {
      const idx = selected.findIndex(s => s.id === n.id);
      if (idx !== -1) {
        const t = idx / (selected.length - 1);
        const x = avgX - 150 + t * 300;
        const y = avgY + Math.sin(t * Math.PI) * 150 * (t < 0.5 ? 1 : -1);
        return { ...n, position: { x: Math.round(x), y: Math.round(y) } };
      }
      return n;
    }));
  }, [nodes, setNodes]);

  const handleResetPositions = useCallback(() => {
    const selected = nodes.filter(n => n.selected && !n.id.startsWith("pl_"));
    if (selected.length === 0) return;

    setNodes(nds => nds.map((n) => {
      if (selected.some(s => s.id === n.id)) {
        const original = initialNodes.find(in_ => in_.id === n.id);
        if (original) {
          return { ...n, position: { ...original.position } };
        }
      }
      return n;
    }));
  }, [nodes, initialNodes, setNodes]);

  const handleLoadPresetLayout = useCallback((preset: 'byFamily' | 'byScaleRings' | 'byScaleHierarchy' | 'gridSimple') => {
    let result;

    if (preset === 'byFamily') {
      result = organizeNodesByFamily(nodes, edges);
    } else if (preset === 'byScaleRings') {
      result = organizeByScaleTypeRings(nodes, edges);
    } else if (preset === 'byScaleHierarchy') {
      result = organizeByScaleTypeHierarchy(nodes, edges);
    } else {
      result = organizeByGridSimple(nodes, edges);
    }

    setNodes(result.nodes);
  }, [nodes, edges, setNodes]);

  const handleSnapToGrid = useCallback(() => {
    const selected = nodes.filter((n) => n.selected && !n.id.startsWith("pl_"));
    const targets = selected.length > 0 ? selected : nodes.filter((n) => !n.id.startsWith("pl_"));
    const GRID_SIZE = 50;

    setNodes((nds) => nds.map((n) => {
      if (targets.some((t) => t.id === n.id)) {
        return {
          ...n,
          position: {
            x: Math.round(n.position.x / GRID_SIZE) * GRID_SIZE,
            y: Math.round(n.position.y / GRID_SIZE) * GRID_SIZE,
          },
        };
      }
      return n;
    }));
  }, [nodes, setNodes]);

  const handlePractice = useCallback(() => {
    if (!selectedNode) return;
    const req = selectedNode.requiredExercises[0];
    if (!req) return;
    if (req.stringNum != null) {
      router.push(`/practice/scale?type=${selectedNode.scaleType}&string=${req.stringNum}`);
    } else {
      router.push(`/practice/scale?type=${selectedNode.scaleType}&pos=${req.position}&pattern=${req.patternType}`);
    }
  }, [selectedNode, router]);

  const handleCloseModal = useCallback(() => {
    setSelectedNodeId(null);
  }, [setSelectedNodeId]);

  const handleMarkComplete = useCallback(async () => {
    if (!selectedNode || !userId) return;
    try {
      const req = selectedNode.requiredExercises[0];
      if (req) {
        await toggleBpmStage(userId, req.exerciseId, req.requiredBpm, req.label, "theory");
        refreshProgress();
      }
    } catch (e) {
      console.error("Failed to mark complete:", e);
    }
  }, [selectedNode, userId, refreshProgress]);

  const handleFamilyFilter = useCallback((key: FamilyKey) => {
    setFamilyFilter((prev) => prev === key ? null : key);
  }, []);

  // Handle 'T' key for auto-aligning children
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "t") {
        handleAlignChildren(e.shiftKey ? 'up' : 'down');
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleAlignChildren]);

  // Handle 'G' key for snapping to grid
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "g") {
        handleSnapToGrid();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSnapToGrid]);

  // Handle 'R' key for restoring original positions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "r" && !e.ctrlKey && !e.metaKey) {
        const selectedIds = nodes.filter(n => n.selected).map(n => n.id);
        if (selectedIds.length === 0) return;

        setNodes(nds => nds.map(node => {
          if (selectedIds.includes(node.id)) {
            const original = initialNodes.find(inNode => inNode.id === node.id);
            if (original) {
              return {
                ...node,
                position: { ...original.position }
              };
            }
          }
          return node;
        }));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nodes, initialNodes, setNodes]);

  // Handle 'B' key for selecting branch
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "b") {
        handleSelectBranch();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSelectBranch]);

  // Handle 'C' key for circular layout
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "c") {
        handleCircularLayout();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleCircularLayout]);

  // Handle 'L' key for horizontal alignment
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "l") {
        handleAlignHorizontal(e.shiftKey ? 'left' : 'right');
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleAlignHorizontal]);

  // Handle Mirror, Copy Pattern, Paste Pattern
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Mirror Horizontal (M)
      if (key === "m") {
        handleMirrorHorizontal();
      }

      // Copy Pattern (Alt + C)
      if (key === "c" && e.altKey) {
        handleCopyPattern();
        alert("Skopiowano układ skali");
      }

      // Paste Pattern (Alt + V)
      if (key === "v" && e.altKey) {
        if (!copiedPattern) return alert("Najpierw skopiuj układ (Alt + C)");
        handlePastePattern();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [copiedPattern, handleMirrorHorizontal, handleCopyPattern, handlePastePattern]);

  // Handle 'H' key for toggling grid
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "h") {
        setShowGrid(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl" style={{ background: "#0f1115" }}>
      <style>{`
        .react-flow__handle {
          cursor: crosshair;
        }
        .react-flow__handle::after {
          content: "";
          position: absolute;
          top: -15px;
          left: -15px;
          width: 34px;
          height: 34px;
          background: transparent;
        }
      `}</style>
      
      {/* High-Performance Atmospheric Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" style={{ background: "radial-gradient(circle at center, #1e293b 0%, #020617 100%)" }}>
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-10"
          style={{ 
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.1) 2px, transparent 2px)`,
            backgroundSize: "60px 60px"
          }} />
        {/* Deep Vignette */}
        <div className="absolute inset-0" style={{ boxShadow: "inset 0 0 150px rgba(0,0,0,1)" }} />
      </div>

      {/* Title header */}
      <div className="absolute left-4 top-4 z-10 pointer-events-none">
        <h1 style={{
          fontSize: 18,
          fontWeight: 700,
          color: "#f0f4ff",
          letterSpacing: "0.04em",
          lineHeight: 1.2,
          textShadow: "0 0 30px rgba(34,211,238,0.35)",
          margin: 0,
        }}>
          Ścieżka Mistrzostwa Gitary
        </h1>
        <p style={{
          fontSize: 11,
          fontWeight: 300,
          color: "rgba(160,170,200,0.65)",
          letterSpacing: "0.12em",
          marginTop: 3,
          textTransform: "uppercase",
        }}>
          Wybierz swoją ścieżkę rozwoju
        </p>
      </div>

      {/* Dev Tool Export Button - HIDDEN */}

      {/* Progress + refresh */}
      <div
        className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-lg px-3 py-1.5"
        style={{
          border: "1px solid rgba(34,211,238,0.18)",
          background: "rgba(2,2,16,0.75)",
          boxShadow: "0 0 24px rgba(34,211,238,0.06), inset 0 0 16px rgba(34,211,238,0.03)",
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
          <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* React Flow canvas */}
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onEdgesDelete={onEdgesDelete}
        nodeTypes={NODE_TYPES}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        fitView
        fitViewOptions={{ padding: 0.12 }}
        nodeOrigin={[0.5, 0.5]}
        minZoom={0.08}
        maxZoom={2}
        connectionRadius={34}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        selectionMode={SelectionMode.Partial}
        selectionOnDrag={false}
        panOnDrag={[1, 2]}
        panOnScroll={true}
        onConnect={onConnect}
        proOptions={{ hideAttribution: true }}
        colorMode="dark"
      >
        <svg style={{ position: "absolute", width: 0, height: 0 }}>
          <defs>
            <filter id="edge-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComponentTransfer in="blur" result="glow1">
                 <feFuncA type="linear" slope="3" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode in="glow1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>
        {showGrid && <Background variant={BackgroundVariant.Dots} gap={50} size={1} color="rgba(255,255,255,0.15)" />}
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
