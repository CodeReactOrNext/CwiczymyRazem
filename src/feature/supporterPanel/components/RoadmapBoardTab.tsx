import { Button } from "assets/components/ui/button";
import { Skeleton } from "assets/components/ui/skeleton";
import { EmptyState } from "components/EmptyState/EmptyState";
import { SectionHeader } from "components/SectionHeader/SectionHeader";
import { SupportToken } from "components/UI/SupportToken/SupportToken";
import { NewIdeaDialog } from "feature/supporterPanel/components/NewIdeaDialog";
import { RoadmapIdeaCard } from "feature/supporterPanel/components/RoadmapIdeaCard";
import { IDEA_COST } from "feature/supporterPanel/constants/supporterPanel.constants";
import { useRoadmapMutations } from "feature/supporterPanel/hooks/useSupporterRoadmap";
import type {
  RoadmapBoard,
  RoadmapIdeaStatus,
} from "feature/supporterPanel/types/supporterPanel.types";
import { groupIdeas } from "feature/supporterPanel/utils/ideaGroups";
import { useTranslation } from "hooks/useTranslation";
import { Lightbulb, Plus } from "lucide-react";
import { useState } from "react";

const BoardSkeleton = () => (
  <div className='space-y-8' aria-busy='true'>
    <div className='space-y-3'>
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} variant='block' className='h-28' />
      ))}
    </div>
  </div>
);

const EmptyBoard = ({ onPost }: { onPost: () => void }) => {
  const { t } = useTranslation("supporter");
  return (
    <EmptyState
      icon={<Lightbulb />}
      title={t("panel.board.empty_title")}
      description={t("panel.board.empty_body")}
      action={
        <Button onClick={onPost}>
          <Plus size={16} />
          {t("panel.board.post")}
        </Button>
      }
    />
  );
};

/**
 * The board itself: what supporters want built, ranked by how much of their
 * vote budget is sitting on it.
 */
export const RoadmapBoardTab = ({
  board,
  isLoading,
}: {
  board: RoadmapBoard | undefined;
  isLoading: boolean;
}) => {
  const { t } = useTranslation("supporter");
  const [isPosting, setIsPosting] = useState(false);
  const { back, postIdea, changeStatus } = useRoadmapMutations();

  if (isLoading || !board) return <BoardSkeleton />;

  const tokensLeft = board.wallet.left;
  const busy = back.isPending || postIdea.isPending || changeStatus.isPending;

  return (
    <div className='space-y-8'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <p className='text-sm text-zinc-400'>{t("panel.board.intro")}</p>
        <Button
          onClick={() => setIsPosting(true)}
          disabled={tokensLeft < IDEA_COST}
          title={
            tokensLeft < IDEA_COST ? t("panel.not_enough_left") : undefined
          }>
          <span className='flex items-center gap-2'>
            <Plus size={16} />
            {t("panel.board.post")}
            <SupportToken size={16} />
            {IDEA_COST}
          </span>
        </Button>
      </div>

      {board.ideas.length === 0 ? (
        <EmptyBoard onPost={() => setIsPosting(true)} />
      ) : (
        <div className='space-y-12'>
          {groupIdeas(board.ideas).map((group) => (
            <section key={group.key} className='space-y-4'>
              <SectionHeader
                title={t(`panel.board.groups.${group.key}`, group.title)}
                count={group.ideas.length}
                className='mb-0'
              />
              <div className='space-y-3'>
                {group.ideas.map((idea, index) => (
                  <RoadmapIdeaCard
                    key={idea.id}
                    idea={idea}
                    rank={group.key === "open" ? index + 1 : undefined}
                    mine={board.myBacking[idea.id] ?? 0}
                    myUid={board.myUid}
                    tokensLeft={tokensLeft}
                    busy={busy}
                    isOwner={board.isOwner}
                    onBack={() => back.mutate({ ideaId: idea.id, amount: 1 })}
                    onStatusChange={(status: RoadmapIdeaStatus) =>
                      changeStatus.mutate({ ideaId: idea.id, status })
                    }
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <NewIdeaDialog
        open={isPosting}
        onOpenChange={setIsPosting}
        tokensLeft={tokensLeft}
        busy={postIdea.isPending}
        onSubmit={async (input) => {
          await postIdea.mutateAsync(input);
        }}
      />
    </div>
  );
};
