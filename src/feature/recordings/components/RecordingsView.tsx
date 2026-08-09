import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import MainContainer from "components/MainContainer";
import { HeroBanner } from "components/UI/HeroBanner";
import { AddRecordingModal } from "feature/recordings/components/AddRecordingModal";
import { RecordingsGrid } from "feature/recordings/components/RecordingsGrid";
import { RecordingViewModal } from "feature/recordings/components/RecordingViewModal";
import { useRecordings } from "feature/recordings/hooks/useRecordings";
import { selectUserAuth } from "feature/user/store/userSlice";
import { LayoutGrid,Plus, User } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect,useState } from "react";
import { useAppSelector } from "store/hooks";

type ViewType = "all" | "mine";

const RecordingsView = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [view, setView] = useState<ViewType>("all");

  const router = useRouter();
  // The open recording lives in the URL so notifications ("X commented on your recording")
  // can deep-link straight to it, and the modal stays shareable / back-button friendly.
  const activeRecordingId = (router.query.recordingId as string) || null;

  const openRecording = (recordingId: string | null) => {
    const query: Record<string, any> = { ...router.query };
    if (recordingId) query.recordingId = recordingId;
    else delete query.recordingId;
    router.push({ query }, undefined, { shallow: true });
  };

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
    <MainContainer>
      <HeroBanner
        title="Recordings"
        subtitle="Listen back and share your practice sessions"
        eyebrow="Recordings"
        className="w-full !rounded-none !shadow-none min-h-[100px] md:min-h-[90px] lg:min-h-[100px]"
        rightContent={
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="h-11 bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-6"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Recording
          </Button>
        }
      >
        <div className="flex items-center gap-2 p-1 bg-zinc-900 rounded-lg w-fit mt-4">
          <button
            onClick={() => setView("all")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors",
              view === "all"
                ? "bg-zinc-800 text-white"
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
              "px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors",
              view === "mine"
                ? "bg-zinc-800 text-white"
                : "text-zinc-500 hover:text-zinc-300",
              !userId && "opacity-50 cursor-not-allowed"
            )}
          >
            <User className="h-4 w-4" />
            My Recordings
          </button>
        </div>
      </HeroBanner>
      <div className="flex flex-col gap-6 p-4 lg:p-8 min-h-screen font-openSans">

        {/* Grid */}
        <div className="flex-1">
            <RecordingsGrid
                recordings={recordings}
                isLoading={isLoading}
                page={page}
                totalPages={totalPages}
                setPage={setPage}
                onViewRecording={openRecording}
            />
        </div>

        {/* Modals */}
        <AddRecordingModal 
            isOpen={isAddModalOpen} 
            onClose={() => setIsAddModalOpen(false)} 
        />
        
        <RecordingViewModal
            isOpen={!!activeRecordingId}
            onClose={() => openRecording(null)}
            recordingId={activeRecordingId}
        />

      </div>
    </MainContainer>
  );
};

export default RecordingsView;
