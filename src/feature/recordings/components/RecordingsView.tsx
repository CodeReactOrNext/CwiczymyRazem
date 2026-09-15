import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import MainContainer from "components/MainContainer";
import { tabNavItemClass, tabNavListClass } from "components/PageTabs/tabNav";
import { HeroBanner } from "components/UI/HeroBanner";
import { AddRecordingModal } from "feature/recordings/components/AddRecordingModal";
import { RecordingsGrid } from "feature/recordings/components/RecordingsGrid";
import { RecordingViewModal } from "feature/recordings/components/RecordingViewModal";
import { useRecordings } from "feature/recordings/hooks/useRecordings";
import { selectUserAuth } from "feature/user/store/userSlice";
import { LayoutGrid, Plus, User } from "lucide-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAppSelector } from "store/hooks";

type ViewType = "all" | "mine";

/** Segmented control shared by both tabs, so they cannot drift apart. */
const viewTabClass = tabNavItemClass;

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

  const {
    recordings,
    total,
    isLoading,
    page,
    setPage,
    totalPages,
    setFilterByUserId,
  } = useRecordings(view === "mine" ? userId || undefined : undefined);

  // useRecordings keeps the filter in its own state, so switching tabs has to push
  // the new value in rather than relying on the initial prop.
  useEffect(() => {
    setFilterByUserId(view === "mine" ? userId || undefined : undefined);
  }, [view, userId, setFilterByUserId]);

  return (
    <MainContainer>
      <HeroBanner
        title='Recordings'
        subtitle='Listen back and share your practice sessions'
        eyebrow='Recordings'
        className='w-full !rounded-none'
        rightContent={
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className='h-11 bg-cyan-600 px-6 font-bold text-white hover:bg-cyan-500'>
            <Plus className='mr-2 h-5 w-5' />
            Add Recording
          </Button>
        }
      />

      {/* Horizontal padding matches the banner's, so the toolbar and the cards
          line up with the title above them. */}
      <div className='font-openSans flex flex-col gap-6 px-6 pb-16 pt-6 md:px-8 lg:px-10'>
        {/* The rail is the row, not just the tabs: the count rides on it so the
            underline has one continuous line to sit against. */}
        <div className='flex items-center gap-3 border-b border-zinc-800'>
          <div className={cn(tabNavListClass, "border-b-0")}>
            <button
              onClick={() => setView("all")}
              className={viewTabClass(view === "all", false)}>
              <LayoutGrid className='h-4 w-4' />
              All Recordings
            </button>
            <button
              onClick={() => setView("mine")}
              disabled={!userId}
              className={viewTabClass(view === "mine", !userId)}>
              <User className='h-4 w-4' />
              My Recordings
            </button>
          </div>

          {!isLoading && total > 0 && (
            <span className='ml-auto shrink-0 text-sm text-zinc-400'>
              {total} {total === 1 ? "recording" : "recordings"}
            </span>
          )}
        </div>

        <RecordingsGrid
          recordings={recordings}
          isLoading={isLoading}
          page={page}
          totalPages={totalPages}
          setPage={setPage}
          onViewRecording={openRecording}
        />

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
