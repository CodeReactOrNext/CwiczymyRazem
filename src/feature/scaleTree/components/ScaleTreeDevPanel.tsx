import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, ArrowRight, ArrowLeft, Circle, Copy, Clipboard, Trash2 } from "lucide-react";
import { cn } from "assets/lib/utils";
import type { Node, Edge } from "@xyflow/react";

interface ScaleTreeDevPanelProps {
  selectedNodes: Node[];
  edges: Edge[];
  copiedPattern: Record<string, { x: number; y: number }> | null;
  onAlignX: () => void;
  onAlignY: () => void;
  onSnapToGrid: () => void;
  onAlignChildren: (direction: 'down' | 'up') => void;
  onAlignHorizontal: (direction: 'right' | 'left') => void;
  onCircular: () => void;
  onSelectBranch: () => void;
  onMirror: () => void;
  onCopyPattern: () => void;
  onPastePattern: () => void;
  onDistributeH: () => void;
  onDistributeV: () => void;
  onGridLayout: (cols: number) => void;
  onLineLayout: (direction: 'horizontal' | 'vertical') => void;
  onHexagonLayout: () => void;
  onSpiralLayout: () => void;
  onWaveLayout: (direction: 'horizontal' | 'vertical') => void;
  onPolygonLayout: () => void;
  onRadialLayout: () => void;
  onStaircaseLayout: () => void;
  onSCurveLayout: () => void;
  onResetPositions: () => void;
  onLoadPresetLayout: (preset: 'byFamily' | 'byScaleRings' | 'byScaleHierarchy' | 'gridSimple') => void;
}

export function ScaleTreeDevPanel({
  selectedNodes,
  edges,
  copiedPattern,
  onAlignX,
  onAlignY,
  onSnapToGrid,
  onAlignChildren,
  onAlignHorizontal,
  onCircular,
  onSelectBranch,
  onMirror,
  onCopyPattern,
  onPastePattern,
  onDistributeH,
  onDistributeV,
  onGridLayout,
  onLineLayout,
  onHexagonLayout,
  onSpiralLayout,
  onWaveLayout,
  onPolygonLayout,
  onRadialLayout,
  onStaircaseLayout,
  onSCurveLayout,
  onResetPositions,
  onLoadPresetLayout,
}: ScaleTreeDevPanelProps) {
  if (selectedNodes.length === 0) return null;

  const singleNode = selectedNodes.length === 1 ? selectedNodes[0] : null;
  const childIds = singleNode
    ? edges.filter(e => e.source === singleNode.id).map(e => e.target)
    : [];
  const hasChildren = childIds.length > 0;

  const PanelButton = ({ onClick, children, disabled = false, title = "" }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex-1",
        disabled
          ? "bg-zinc-900 text-zinc-600 cursor-not-allowed"
          : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700 active:bg-zinc-600"
      )}
    >
      {children}
    </button>
  );

  return (
    <AnimatePresence>
      <motion.div
        key="dev-panel"
        initial={{ x: 24, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 24, opacity: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 300 }}
        className="absolute right-4 top-[72px] z-20 w-72 rounded-xl border border-white/10 bg-black/80 backdrop-blur p-3 space-y-3 select-none"
      >
        {/* Header */}
        <div className="text-[11px] font-bold uppercase tracking-widest text-cyan-400/80 px-1">
          {selectedNodes.length === 1
            ? singleNode?.id || "1 selected"
            : `${selectedNodes.length} selected`}
        </div>

        {/* Multi-selection section */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest px-1">
            Alignment
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <PanelButton onClick={onAlignX} title="Align X (Shift+Click select, then click)">
              ⟷ X
            </PanelButton>
            <PanelButton onClick={onAlignY} title="Align Y">
              ⟨ Y
            </PanelButton>
            <PanelButton onClick={onSnapToGrid} title="Snap to Grid (50px)">
              ▦ Grid
            </PanelButton>
            <PanelButton onClick={onMirror} disabled={selectedNodes.length < 2} title="Mirror Horizontal (M)">
              ↔ Mirror
            </PanelButton>
          </div>
        </div>

        {/* Distribution & Layout section (multi-selection) */}
        {selectedNodes.length >= 2 && (
          <div className="space-y-2 border-t border-white/5 pt-2">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest px-1">
              Distribute / Layout
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <PanelButton onClick={onDistributeH} title="Distribute horizontally">
                ⋮ Dist. H
              </PanelButton>
              <PanelButton onClick={onDistributeV} title="Distribute vertically">
                ⋯ Dist. V
              </PanelButton>
              <PanelButton onClick={() => onGridLayout(Math.ceil(Math.sqrt(selectedNodes.length)))} title="Grid layout">
                ⊞ Grid
              </PanelButton>
              <PanelButton onClick={() => onLineLayout('horizontal')} title="Horizontal line">
                ⟷ Line H
              </PanelButton>
              <PanelButton onClick={() => onLineLayout('vertical')} title="Vertical line">
                ⟨ Line V
              </PanelButton>
              <PanelButton onClick={onHexagonLayout} title="Hexagon shape" disabled={selectedNodes.length < 3}>
                ⬡ Hexa
              </PanelButton>
              <PanelButton onClick={onSpiralLayout} title="Spiral layout">
                ◉ Spiral
              </PanelButton>
              <PanelButton onClick={() => onWaveLayout('horizontal')} title="Wave pattern">
                ≈ Wave
              </PanelButton>
              <PanelButton onClick={onPolygonLayout} title="Polygon layout" disabled={selectedNodes.length < 3}>
                ⬠ Polygon
              </PanelButton>
              <PanelButton onClick={onRadialLayout} title="Radial/Starburst">
                ✦ Radial
              </PanelButton>
              <PanelButton onClick={onStaircaseLayout} title="Staircase/Diagonal">
                ⤴ Stairs
              </PanelButton>
              <PanelButton onClick={onSCurveLayout} title="S-Curve pattern">
                ∿ S-Curve
              </PanelButton>
              <PanelButton onClick={onResetPositions} title="Reset to original positions">
                ⟲ Reset
              </PanelButton>
            </div>
          </div>
        )}

        {/* Children layout section */}
        {hasChildren && (
          <div className="space-y-2 border-t border-white/5 pt-2">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest px-1">
              Arrange Children
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <PanelButton onClick={() => onAlignChildren('down')} title="Align children down (T)">
                <ArrowDown size={12} /> Down
              </PanelButton>
              <PanelButton onClick={() => onAlignChildren('up')} title="Align children up (Shift+T)">
                <ArrowUp size={12} /> Up
              </PanelButton>
              <PanelButton onClick={() => onAlignHorizontal('right')} title="Align right (L)">
                <ArrowRight size={12} /> Right
              </PanelButton>
              <PanelButton onClick={() => onAlignHorizontal('left')} title="Align left (Shift+L)">
                <ArrowLeft size={12} /> Left
              </PanelButton>
            </div>
            <div>
              <PanelButton onClick={onCircular} title="Circular layout (C)">
                <Circle size={12} /> Circular
              </PanelButton>
            </div>
          </div>
        )}

        {/* Preset Layouts section */}
        <div className="space-y-2 border-t border-white/5 pt-2">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest px-1">
            Load Preset
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <PanelButton onClick={() => onLoadPresetLayout('byFamily')} title="3 columns: pentatonic | diatonic | modes">
              📊 By Family
            </PanelButton>
            <PanelButton onClick={() => onLoadPresetLayout('gridSimple')} title="Simple grid: scales as columns, positions as rows">
              📋 Grid Simple
            </PanelButton>
            <PanelButton onClick={() => onLoadPresetLayout('byScaleRings')} title="Each scale as hexagon with concentric rings">
              ◯ Scale Rings
            </PanelButton>
            <PanelButton onClick={() => onLoadPresetLayout('byScaleHierarchy')} title="Each scale with hierarchical tree children">
              🌳 Scale Tree
            </PanelButton>
          </div>
        </div>

        {/* Branch section */}
        {singleNode && (
          <div className="space-y-2 border-t border-white/5 pt-2">
            <PanelButton onClick={onSelectBranch} title="Select entire branch (B)">
              🌳 Select Branch
            </PanelButton>
          </div>
        )}

        {/* Pattern section */}
        {singleNode && (
          <div className="space-y-2 border-t border-white/5 pt-2">
            <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest px-1">
              Pattern
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              <PanelButton onClick={onCopyPattern} title="Copy scale pattern (Alt+C)">
                <Copy size={12} /> Copy
              </PanelButton>
              <PanelButton
                onClick={onPastePattern}
                disabled={!copiedPattern}
                title={copiedPattern ? "Paste pattern (Alt+V)" : "No pattern copied"}
              >
                <Clipboard size={12} /> Paste
              </PanelButton>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
