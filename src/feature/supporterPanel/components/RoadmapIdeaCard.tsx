import { Chip } from "assets/components/ui/chip";
import { BackerRow } from "feature/supporterPanel/components/BackerRow";
import { VotePill } from "feature/supporterPanel/components/VotePill";
import { renderIdeaIcon } from "feature/supporterPanel/constants/ideaIcons";
import { MAX_BACKING_PER_IDEA } from "feature/supporterPanel/constants/supporterPanel.constants";
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
  mine,
  myUid,
  tokensLeft,
  busy,
  isOwner,
  onBack,
  onStatusChange,
}: RoadmapIdeaCardProps) => {
  return (
    <article className='flex gap-4 rounded-lg bg-zinc-900/40 p-5 transition-background hover:bg-zinc-900/60'>
      <VotePill
        total={idea.voteCount}
        mine={mine}
        max={MAX_BACKING_PER_IDEA}
        tokensLeft={tokensLeft}
        busy={busy}
        what='idea'
        onBack={onBack}
      />

      <div className='min-w-0 flex-1 space-y-2'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <h3 className='flex min-w-0 items-center gap-2.5 text-base font-bold text-zinc-100'>
            {renderIdeaIcon(idea.icon, 17, "shrink-0 text-zinc-400")}
            {idea.title}
          </h3>

          {isOwner ? (
            <select
              aria-label='Idea status'
              value={idea.status}
              disabled={busy}
              onChange={(event) =>
                onStatusChange(event.target.value as RoadmapIdeaStatus)
              }
              className='rounded bg-zinc-800/60 px-2 py-1 text-xs font-semibold text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring hover:bg-zinc-800'>
              {ROADMAP_IDEA_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_LABEL[status]}
                </option>
              ))}
            </select>
          ) : (
            idea.status !== "open" && (
              <Chip color={STATUS_COLOR[idea.status]}>
                {STATUS_LABEL[idea.status]}
              </Chip>
            )
          )}
        </div>

        {idea.description && (
          <p className='whitespace-pre-line text-sm text-zinc-400'>
            {idea.description}
          </p>
        )}

        <div className='space-y-2 pt-1'>
          <p className='text-xs text-zinc-500'>{idea.authorName}</p>
          <BackerRow
            backers={idea.backers}
            total={idea.backerCount}
            myUid={myUid}
          />
        </div>
      </div>
    </article>
  );
};
