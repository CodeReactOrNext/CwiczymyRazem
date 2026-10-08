import { Button } from "assets/components/ui/button";
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
  <div className='space-y-8'>
    <div className='space-y-3'>
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className='h-28 animate-pulse rounded-lg bg-zinc-900/40'
        />
      ))}
    </div>
  </div>
);

const SectionHeading = ({ title, count }: { title: string; count: number }) => (
  <h2 className='flex items-baseline gap-2 text-sm font-bold text-zinc-200'>
    {title}
    <span className='font-normal tabular-nums text-zinc-500'>{count}</span>
  </h2>
);

const EmptyBoard = ({ onPost }: { onPost: () => void }) => {
  const { t } = useTranslation("supporter");
  return (
    <div className='flex flex-col items-center rounded-lg bg-zinc-900/40 px-6 py-20 text-center'>
      <span className='mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/60 text-zinc-400'>
        <Lightbulb size={26} />
      </span>
      <h3 className='mb-2 text-lg font-bold text-zinc-100'>
        {t("panel.board.empty_title")}
      </h3>
      <p className='max-w-sm text-sm text-zinc-400'>
        {t("panel.board.empty_body")}
      </p>
      <Button onClick={onPost} className='mt-7'>
        <span className='flex items-center gap-2'>
          <Plus size={16} />
          {t("panel.board.post")}
        </span>
      </Button>
    </div>
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
            <span className='ml-1 inline-flex items-center gap-1 rounded bg-zinc-900/10 px-1.5 py-0.5 text-sm font-bold tabular-nums'>
              <SupportToken size={16} />
              {IDEA_COST}
            </span>
          </span>
        </Button>
      </div>

      {board.ideas.length === 0 ? (
        <EmptyBoard onPost={() => setIsPosting(true)} />
      ) : (
        <div className='space-y-12'>
          {groupIdeas(board.ideas).map((group) => (
            <section key={group.key} className='space-y-4'>
              <SectionHeading
                title={t(`panel.board.groups.${group.key}`, group.title)}
                count={group.ideas.length}
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
