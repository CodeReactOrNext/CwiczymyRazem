import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Menu, X } from 'lucide-react';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { BASE_ROOT_NOTE, isScaleTreeKey, transposeFret } from '../data/scaleTreeKeys';
import { useScaleTree } from '../hooks/useScaleTree';
import { ScaleNodeModal } from './ScaleNodeModal';
import { ScaleTreeGrid } from './ScaleTreeGrid';
import { ScaleTreeSidebar } from './ScaleTreeSidebar';

const ROOT_NOTE_STORAGE_KEY = 'scaleTree.rootNote';

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
    selectedNodeRecord,
    setSelectedNodeId,
  } = useScaleTree();

  const containerRef = useRef<HTMLDivElement>(null);
  const [activeScaleType, setActiveScaleType] = useState('minor_pentatonic');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // The key the whole tree is played in. Node data is authored in C; every other
  // key is the same shapes moved along the neck (see transposeFret). The view is
  // client-only (dynamic import, ssr: false), so the stored key can be read
  // straight into the first render.
  const [rootNote, setRootNote] = useState(() => {
    if (typeof window === 'undefined') return BASE_ROOT_NOTE;
    const stored = window.localStorage.getItem(ROOT_NOTE_STORAGE_KEY);
    return isScaleTreeKey(stored) ? stored : BASE_ROOT_NOTE;
  });

  const handleSelectRootNote = useCallback((note: string) => {
    setRootNote(note);
    window.localStorage.setItem(ROOT_NOTE_STORAGE_KEY, note);
  }, []);

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

  // All three actions run the same exercise. Exam and record runs are timed and
  // locked to a tempo; only the exam clears the node, only a record run is scored
  // against the node's personal best.
  const startSession = useCallback(
    (mode: 'exam' | 'practice' | 'record', bpm?: number) => {
      if (!selectedNode) return;
      const req = selectedNode.requiredExercises[0];
      if (!req) return;

      const params = new URLSearchParams({ type: selectedNode.scaleType, root: rootNote });
      if (req.stringNum != null) {
        params.set('string', String(req.stringNum));
      } else {
        // The fret follows the key; the shape (and therefore the node) does not.
        params.set('pos', String(transposeFret(req.position, rootNote)));
        params.set('pattern', req.patternType);
      }
      if (mode !== 'practice') {
        params.set('exam', 'true');
        params.set('requiredBpm', String(mode === 'record' ? bpm ?? req.requiredBpm : req.requiredBpm));
      }
      if (mode === 'record') {
        params.set('mode', 'record');
      }
      // Progress is filed under the C exercise whatever key it was played in —
      // the same shape in another key is the same achievement.
      params.set('exerciseId', req.exerciseId);
      params.set('nodeId', selectedNode.id);

      router.push(`/practice/scale?${params.toString()}`);
    },
    [selectedNode, rootNote, router]
  );

  const handleStartExam = useCallback(() => startSession('exam'), [startSession]);
  const handleStartPractice = useCallback(() => startSession('practice'), [startSession]);
  const handleStartRecord = useCallback(
    (bpm: number) => startSession('record', bpm),
    [startSession]
  );

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
      className="relative flex h-full w-full overflow-hidden rounded-lg bg-zinc-950"
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
        rootNote={rootNote}
        onSelectRootNote={handleSelectRootNote}
        rfNodes={rfNodes}
        rfEdges={rfEdges}
        selectedNodeId={selectedNodeId}
        onNodeClick={setSelectedNodeId}
      />

      <button
        onClick={() => setIsSidebarOpen(true)}
        className="absolute left-3 top-3 z-10 flex h-9 items-center gap-2 rounded-lg bg-zinc-900/80 px-3 backdrop-blur-md transition-background hover:bg-zinc-800/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:hidden"
        aria-label="Open scale selector"
      >
        <Menu className="h-4 w-4 text-zinc-400" />
        <span className="text-xs font-semibold text-zinc-300">Scales</span>
      </button>

      <button
        onClick={() => router.push('/timer')}
        className="absolute right-3 top-3 z-10 flex h-9 items-center gap-2 rounded-lg bg-zinc-900/80 px-3 backdrop-blur-md transition-background hover:bg-zinc-800/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        aria-label="Back to Practice"
      >
        <ArrowLeft className="h-4 w-4 text-zinc-400" />
        <span className="text-xs font-semibold text-zinc-300">Practice</span>
      </button>

      <ScaleNodeModal
        node={selectedNode}
        status={selectedNodeStatus}
        rootNote={rootNote}
        record={selectedNodeRecord}
        onClose={handleCloseModal}
        onStartExam={handleStartExam}
        onStartPractice={handleStartPractice}
        onStartRecord={handleStartRecord}
      />
    </div>
  );
}
