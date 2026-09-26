import { Chip } from "assets/components/ui/chip";
import { cn } from "assets/lib/utils";
import { BackerRow } from "feature/supporterPanel/components/BackerRow";
import { ClampedText } from "feature/supporterPanel/components/ClampedText";
import { VotePill } from "feature/supporterPanel/components/VotePill";
import { renderIdeaIcon } from "feature/supporterPanel/constants/ideaIcons";
import {
  IDEA_BACK_COST,
  MAX_BACKING_PER_IDEA,
} from "feature/supporterPanel/constants/supporterPanel.constants";
import type {
  RoadmapIdea,
  RoadmapIdeaStatus,
} from "feature/supporterPanel/types/supporterPanel.types";
import { ROADMAP_IDEA_STATUSES } from "feature/supporterPanel/types/supporterPanel.types";

type ChipColor = React.ComponentProps<typeof Chip>["color"];

const STATUS_LABEL: Record<RoadmapIdeaStatus, string> = {
  open: "Open",
  planned: "Planned",
  in_progress: "In progress",
  shipped: "Shipped",
  declined: "Not doing",
};

const STATUS_COLOR: Record<RoadmapIdeaStatus, ChipColor> = {
  open: "gray",
  planned: "cyan",
  in_progress: "amber",
  shipped: "emerald",
  declined: "gray",
};

interface RoadmapIdeaCardProps {
  idea: RoadmapIdea;
  /** Place on the board, 1-based — the board is already ranked by backing. */
  rank: number;
  mine: number;
  myUid: string;
  tokensLeft: number;
  busy: boolean;
  isOwner: boolean;
  onBack: () => void;
  onStatusChange: (status: RoadmapIdeaStatus) => void;
}

export const RoadmapIdeaCard = ({
  idea,
  rank,
  mine,
  myUid,
  tokensLeft,
  busy,
  isOwner,
  onBack,
  onStatusChange,
}: RoadmapIdeaCardProps) => {
  const decided = idea.status === "shipped" || idea.status === "declined";

  return (
    <article
      className={cn(
        "flex gap-5 rounded-lg bg-zinc-900/40 p-5 transition-background hover:bg-zinc-900/60 sm:p-6",
        idea.status === "declined" && "opacity-60",
      )}>
      {/* The place on the board, so "what is next" is a number, not a guess.
          The top three are lit; the rest are just order. */}
      <span
        aria-label={`Rank ${rank}`}
        className={cn(
          "w-8 shrink-0 text-right text-3xl font-bold tabular-nums leading-none",
          rank <= 3 ? "text-zinc-400" : "text-zinc-700",
        )}>
        {rank}
      </span>

      <div className='flex min-w-0 flex-1 flex-col gap-5 sm:flex-row'>
        <div className='min-w-0 flex-1'>
          <div className='flex flex-wrap items-center gap-x-3 gap-y-2'>
            <h3 className='flex min-w-0 items-center gap-2.5 text-xl font-bold leading-tight tracking-tight text-white'>
              {renderIdeaIcon(idea.icon, 18, "shrink-0 text-zinc-600")}
              {idea.title}
            </h3>
            {!isOwner && idea.status !== "open" && (
              <Chip color={STATUS_COLOR[idea.status]}>
                {STATUS_LABEL[idea.status]}
              </Chip>
            )}
          </div>

          {idea.description && (
            <ClampedText text={idea.description} className='mt-2' />
          )}

          <div className='mt-5 flex flex-wrap items-center gap-x-5 gap-y-2'>
            <p className='text-xs text-zinc-500'>
              by{" "}
              <span className='font-medium text-zinc-400'>
                {idea.authorName}
              </span>
            </p>
            <BackerRow
              muted
              backers={idea.backers}
              total={idea.backerCount}
              myUid={myUid}
            />
          </div>
        </div>

        <div className='flex w-full shrink-0 flex-col items-stretch gap-2 self-start sm:w-56'>
          <VotePill
            wide
            total={idea.voteCount}
            mine={mine}
            max={MAX_BACKING_PER_IDEA}
            tokensLeft={tokensLeft}
            busy={busy}
            what='idea'
            name={idea.title}
            cost={IDEA_BACK_COST}
            closed={decided}
            onBack={onBack}
          />

          {isOwner && (
            <select
              aria-label='Idea status'
              value={idea.status}
              disabled={busy}
              onChange={(event) =>
                onStatusChange(event.target.value as RoadmapIdeaStatus)
              }
              className='rounded bg-zinc-800/60 px-2 py-1.5 text-xs font-semibold text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800'>
              {ROADMAP_IDEA_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABEL[status]}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </article>
  );
};
