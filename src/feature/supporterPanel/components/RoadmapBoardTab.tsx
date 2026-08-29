import { Button } from "assets/components/ui/button";
import { SupportToken } from "components/UI/SupportToken/SupportToken";
import { NewIdeaDialog } from "feature/supporterPanel/components/NewIdeaDialog";
import { RoadmapIdeaCard } from "feature/supporterPanel/components/RoadmapIdeaCard";
import { IDEA_COST } from "feature/supporterPanel/constants/supporterPanel.constants";
import { IDEA_BACK_COST } from "feature/supporterPanel/constants/supporterPanel.constants";
import { useRoadmapMutations } from "feature/supporterPanel/hooks/useSupporterRoadmap";
import type {
  RoadmapBoard,
  RoadmapIdeaStatus,
} from "feature/supporterPanel/types/supporterPanel.types";
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

const EmptyBoard = ({ onPost }: { onPost: () => void }) => (
  <div className='flex flex-col items-center rounded-lg bg-zinc-900/40 px-6 py-20 text-center'>
    <span className='mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/60 text-zinc-400'>
      <Lightbulb size={26} />
    </span>
    <h3 className='mb-2 text-lg font-bold text-zinc-100'>
      Nothing on the board yet
    </h3>
    <p className='max-w-sm text-sm text-zinc-400'>
      Whatever lands here first sets the agenda. Post the thing you keep wishing
      the app did.
    </p>
    <Button onClick={onPost} className='mt-7'>
      <span className='flex items-center gap-2'>
        <Plus size={16} />
        Post an idea
      </span>
    </Button>
  </div>
);

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
  const [isPosting, setIsPosting] = useState(false);
  const { back, postIdea, changeStatus } = useRoadmapMutations();

  if (isLoading || !board) return <BoardSkeleton />;

  const tokensLeft = board.wallet.left;
  const busy = back.isPending || postIdea.isPending || changeStatus.isPending;

  return (
    <div className='space-y-8'>
      <div className='flex flex-wrap items-center justify-between gap-4'>
        <p className='text-sm text-zinc-400'>
          Back what you want built next —{" "}
          <SupportToken size={18} className='inline-block align-middle' />{" "}
          {IDEA_BACK_COST} a push,{" "}
          <SupportToken size={18} className='inline-block align-middle' />{" "}
          {IDEA_COST} to put an idea up. Spent is spent — tokens keep until you
          use them, and nothing puts them back.
        </p>
        <Button
          onClick={() => setIsPosting(true)}
          disabled={tokensLeft < IDEA_COST}>
          <span className='flex items-center gap-2'>
            <Plus size={16} />
            Post an idea
          </span>
        </Button>
      </div>

      {board.ideas.length === 0 ? (
        <EmptyBoard onPost={() => setIsPosting(true)} />
      ) : (
        <div className='space-y-3'>
          {board.ideas.map((idea) => (
            <RoadmapIdeaCard
              key={idea.id}
              idea={idea}
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
