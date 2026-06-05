import { Menu, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { AnimatePresence, motion } from 'framer-motion';

import { ScaleNodeModal } from './ScaleNodeModal';
import { ScaleTreeSidebar } from './ScaleTreeSidebar';
import { ScaleTreeGrid } from './ScaleTreeGrid';
import { useScaleTree } from '../hooks/useScaleTree';

const PREFIX_TO_SCALE: Record<string, string> = {
  min_pent: 'minor_pentatonic',
  maj_pent: 'major_pentatonic',
  nat_minor: 'minor',
  major: 'major',
  dorian: 'dorian',
  phrygian: 'phrygian',
  mixolydian: 'mixolydian',
  lydian: 'lydian',
  locrian: 'locrian',
};

export function ScaleTreeView() {
  const router = useRouter();
  const {
    rfNodes,
    rfEdges,
    selectedNode,
    selectedNodeId,
    selectedNodeStatus,
    setSelectedNodeId,
  } = useScaleTree();

  const containerRef = useRef<HTMLDivElement>(null);
  const [activeScaleType, setActiveScaleType] = useState('minor_pentatonic');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (router.query.fromExam === 'true' && router.query.nodeId && rfNodes.length > 0) {
      const targetId = router.query.nodeId as string;
      setSelectedNodeId(targetId);

      const match = targetId.match(/^(.+?)_(?:pos\d+|single_string|reward)/);
      if (match) {
        const prefix = match[1];
        const scaleType = PREFIX_TO_SCALE[prefix];
        if (scaleType) {
          setActiveScaleType(scaleType);
        }
      }

      router.replace('/scale-tree', undefined, { shallow: true });
    }
  }, [router.query, rfNodes, setSelectedNodeId]);

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

  const handleSelectScale = useCallback((scaleType: string) => {
    setActiveScaleType(scaleType);
    setIsSidebarOpen(false);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full overflow-hidden rounded-lg bg-[#08080a]"
    >
      <div className="hidden md:flex">
        <ScaleTreeSidebar
          activeScaleType={activeScaleType}
          onSelectScale={setActiveScaleType}
          rfNodes={rfNodes}
        />
      </div>

      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsSidebarOpen(false)}
              className="absolute inset-0 z-30 bg-black/70 backdrop-blur-sm md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
              className="absolute left-0 top-0 bottom-0 z-40 flex md:hidden"
            >
              <div className="relative">
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="absolute right-2 top-2 z-50 flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800/60 text-zinc-400 transition-background hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  aria-label="Close sidebar"
                >
                  <X className="h-4 w-4" />
                </button>
                <ScaleTreeSidebar
                  activeScaleType={activeScaleType}
                  onSelectScale={handleSelectScale}
                  rfNodes={rfNodes}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ScaleTreeGrid
        scaleType={activeScaleType}
        rfNodes={rfNodes}
        rfEdges={rfEdges}
        selectedNodeId={selectedNodeId}
        onNodeClick={setSelectedNodeId}
      />

      <button
        onClick={() => setIsSidebarOpen(true)}
        className="absolute left-3 top-3 z-10 flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900/80 px-2.5 backdrop-blur-md transition-background hover:bg-zinc-800/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:hidden"
        aria-label="Open scale selector"
      >
        <Menu className="h-4 w-4 text-zinc-300" />
        <span className="text-[10px] font-bold capitalize tracking-wider text-zinc-300">
          Scales
        </span>
      </button>

      <ScaleNodeModal
        node={selectedNode}
        status={selectedNodeStatus}
        onClose={handleCloseModal}
        onPractice={handlePractice}
      />
    </div>
  );
}
