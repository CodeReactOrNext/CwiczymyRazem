import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import MainContainer from "components/MainContainer";
import { PAGE_CONTENT } from "components/PageShell/PageShell";
import { tabNavItemClass, tabNavListClass } from "components/PageTabs/tabNav";
import { SegmentedControl } from "components/SegmentedControl/SegmentedControl";
import { HeroBanner } from "components/UI/HeroBanner";
import { AddRecordingModal } from "feature/recordings/components/AddRecordingModal";
import { RecordingsGrid } from "feature/recordings/components/RecordingsGrid";
import { RecordingViewModal } from "feature/recordings/components/RecordingViewModal";
import {
  type RecordingsSort,
  useRecordings,
} from "feature/recordings/hooks/useRecordings";
import { selectUserAuth } from "feature/user/store/userSlice";
import { useTranslation } from "hooks/useTranslation";
import { Clock, Flame, LayoutGrid, Plus, User } from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { useAppSelector } from "store/hooks";

type ViewType = "all" | "mine";

/** Segmented control shared by both tabs, so they cannot drift apart. */
const viewTabClass = tabNavItemClass;

const RecordingsView = () => {
  const { t } = useTranslation("recordings");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [view, setView] = useState<ViewType>("all");
  const [sort, setSort] = useState<RecordingsSort>("newest");

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
  } = useRecordings(view === "mine" ? userId || undefined : undefined, undefined, sort);

  return (
    <MainContainer>
      <HeroBanner
        title={t("view.title")}
        subtitle={t("view.subtitle")}
        eyebrow='Recordings'
        rightContent={
          <Button
            onClick={() => setIsAddModalOpen(true)}
            size='lg'>
            <Plus />
            {t("view.add")}
          </Button>
        }
      />

      {/* Horizontal padding matches the banner's, so the toolbar and the cards
          line up with the title above them. */}
      <div className={cn("flex flex-col gap-6", PAGE_CONTENT)}>
        {/* The rail is the row, not just the tabs: the count rides on it so the
            underline has one continuous line to sit against. */}
        <div className='flex items-center gap-3 border-b border-zinc-800'>
          <div className={cn(tabNavListClass, "border-b-0")}>
            <button
              onClick={() => setView("all")}
              className={viewTabClass(view === "all", false)}>
              <LayoutGrid className='h-4 w-4' />
              {t("view.all")}
            </button>
            <button
              onClick={() => setView("mine")}
              disabled={!userId}
              className={viewTabClass(view === "mine", !userId)}>
              <User className='h-4 w-4' />
              {t("view.mine")}
            </button>
          </div>

          {!isLoading && total > 0 && (
            <span className='ml-auto hidden shrink-0 text-sm text-zinc-400 sm:inline'>
              {t("view.count", { count: total })}
            </span>
          )}
        </div>

        <SegmentedControl
          label={t("view.sort_label")}
          options={[
            {
              value: "newest",
              label: t("view.sort_newest"),
              icon: <Clock className='h-3.5 w-3.5' />,
            },
            {
              value: "popular",
              label: t("view.sort_popular"),
              icon: <Flame className='h-3.5 w-3.5' />,
            },
          ]}
          selected={[sort]}
          onSelect={setSort}
          isLoading={isLoading}
        />

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
