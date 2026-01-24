import { Button } from "assets/components/ui/button";
import MainContainer from "components/MainContainer";
import { AddRecordingModal } from "feature/recordings/components/AddRecordingModal";
import { RecordingViewModal } from "feature/recordings/components/RecordingViewModal";
import { RecordingsGrid } from "feature/recordings/components/RecordingsGrid";
import { useRecordings } from "feature/recordings/hooks/useRecordings";
import { selectUserAuth } from "feature/user/store/userSlice";
import { Plus, User, Video, LayoutGrid } from "lucide-react";
import { useState, useEffect } from "react";
import { useAppSelector } from "store/hooks";
import { cn } from "assets/lib/utils";

type ViewType = "all" | "mine";

const RecordingsView = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeRecordingId, setActiveRecordingId] = useState<string | null>(null);
  const [view, setView] = useState<ViewType>("all");
  
  const userId = useAppSelector(selectUserAuth);
  
  // Filter by userId if view is 'mine'
  const filterByUserId = view === "mine" ? userId : undefined;

  const { 
      recordings, 
      isLoading, 
      page, 
      setPage, 
      totalPages,
      setFilterByUserId, // Hook should expose this if we want to change it dynamically
  } = useRecordings(filterByUserId || undefined); 

  // When view changes, useRecordings hook should re-fetch because of the key dependency
  // But wait, the hook takes initial props. We should verify if it reacts to prop changes or if we need to call setFilterByUserId manually.
  // The current hook implementation uses internal state for filters. 
  // We need to ensure we sync our view state with the hook's filter state if the hook doesn't auto-update from props.
  // Looking at previous hook code: It sets initial state but also exposes `setFilterByUserId`.
  // So we should use an effect to update it when `view` changes.

  useEffect(() => {
      setFilterByUserId(view === "mine" ? (userId || undefined) : undefined);
  }, [view, userId, setFilterByUserId]);

  return (
    <MainContainer title="Recordings">
      <div className="flex flex-col gap-6 p-4 lg:p-8 min-h-screen font-openSans">
        
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="flex flex-col gap-4">
              <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
                  Share your progress, covers, and practice sessions with the community.
              </p>
              
              {/* Tabs */}
              <div className="flex items-center gap-2 p-1 bg-zinc-900 rounded-lg w-fit border border-white/5">
                  <button
                      onClick={() => setView("all")}
                      className={cn(
                          "px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all",
                          view === "all" 
                              ? "bg-zinc-800 text-white shadow-sm" 
                              : "text-zinc-500 hover:text-zinc-300"
                      )}
                  >
                      <LayoutGrid className="h-4 w-4" />
                      All Recordings
                  </button>
                  <button
                      onClick={() => setView("mine")}
                      disabled={!userId}
                      className={cn(
                          "px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all",
                          view === "mine" 
                              ? "bg-zinc-800 text-white shadow-sm" 
                              : "text-zinc-500 hover:text-zinc-300",
                          !userId && "opacity-50 cursor-not-allowed"
                      )}
                  >
                      <User className="h-4 w-4" />
                      My Recordings
                  </button>
              </div>
           </div>
           
           <Button 
                onClick={() => setIsAddModalOpen(true)}
                className="h-11 bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-[0_0_20px_rgba(8,145,178,0.3)] border-none px-6"
           >
                <Plus className="mr-2 h-5 w-5" />
                Add Recording
           </Button>
        </div>

        {/* Grid */}
        <div className="flex-1">
            <RecordingsGrid
                recordings={recordings}
                isLoading={isLoading}
                page={page}
                totalPages={totalPages}
                setPage={setPage}
                onViewRecording={setActiveRecordingId}
            />
        </div>

        {/* Modals */}
        <AddRecordingModal 
            isOpen={isAddModalOpen} 
            onClose={() => setIsAddModalOpen(false)} 
        />
        
        <RecordingViewModal
            isOpen={!!activeRecordingId}
            onClose={() => setActiveRecordingId(null)}
            recordingId={activeRecordingId}
        />

      </div>
    </MainContainer>
  );
};

export default RecordingsView;
