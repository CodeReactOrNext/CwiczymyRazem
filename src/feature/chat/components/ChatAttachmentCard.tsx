import { cn } from "assets/lib/utils";
import type { ChatAttachment } from "feature/chat/types/chat.types";
import { exercisesAgregat } from "feature/exercisePlan/data/exercisesAgregat";
import { defaultPlans } from "feature/exercisePlan/data/plansAgregat";
import type {
  Exercise,
  ExercisePlan,
} from "feature/exercisePlan/types/exercise.types";
import {
  ItemPill,
  resolveRolledItem,
} from "layouts/LogsBoxLayout/components/Logs/Logs";
import { Dumbbell, ListChecks, Music, Play, Video } from "lucide-react";
import Link from "next/link";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/60";

const KIND_META = {
  exercise: { label: "Exercise", Icon: Dumbbell, tone: "text-emerald-400" },
  plan: { label: "Plan", Icon: ListChecks, tone: "text-cyan-400" },
  song: { label: "Song", Icon: Music, tone: "text-purple-400" },
  recording: { label: "Recording", Icon: Video, tone: "text-amber-400" },
} as const;

/** The card body shared by everything but gear: kind, title, a line under it, and what clicking does. */
const CardBody = ({
  kind,
  title,
  subtitle,
  action,
}: {
  kind: keyof typeof KIND_META;
  title: string;
  subtitle?: string | null;
  action: string;
}) => {
  const { label, Icon, tone } = KIND_META[kind];

  return (
    <>
      <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-800/80'>
        <Icon className={cn("h-5 w-5", tone)} />
      </span>
      <span className='flex min-w-0 flex-1 flex-col'>
        <span className={cn("text-[11px] font-semibold", tone)}>{label}</span>
        <span className='truncate text-sm font-semibold text-zinc-100'>
          {title}
        </span>
        {subtitle && (
          <span className='truncate text-xs text-zinc-400'>{subtitle}</span>
        )}
      </span>
      <span className='flex shrink-0 items-center gap-1 text-xs font-semibold text-zinc-300'>
        <Play className='h-3.5 w-3.5' />
        {action}
      </span>
    </>
  );
};

const cardClass = cn(
  "flex w-full min-w-0 items-center gap-3 rounded-lg bg-zinc-900/60 p-3 text-left transition-colors hover:bg-zinc-800/80 active:click-behavior",
  FOCUS_RING,
);

/**
 * Something from the app shared into the room. Exercises and plans open the
 * same "start this" preview the activity feed uses, so seeing it in chat is one
 * click from playing it too.
 */
export const ChatAttachmentCard = ({
  attachment,
  onOpenActivity,
  onOpenRecording,
}: {
  attachment: ChatAttachment;
  onOpenActivity: (target: { plan?: ExercisePlan; exercise?: Exercise }) => void;
  onOpenRecording: (recordingId: string) => void;
}) => {
  switch (attachment.kind) {
    case "exercise": {
      const exercise = exercisesAgregat.find((ex) => ex.id === attachment.id);
      return (
        <button
          type='button'
          disabled={!exercise}
          onClick={() => exercise && onOpenActivity({ exercise })}
          className={cardClass}>
          <CardBody
            kind='exercise'
            title={attachment.title}
            subtitle={attachment.subtitle}
            action='Play'
          />
        </button>
      );
    }
    case "plan": {
      const plan = defaultPlans.find((p) => p.id === attachment.id);
      return (
        <button
          type='button'
          disabled={!plan}
          onClick={() => plan && onOpenActivity({ plan })}
          className={cardClass}>
          <CardBody
            kind='plan'
            title={attachment.title}
            subtitle={attachment.subtitle}
            action='Play'
          />
        </button>
      );
    }
    case "song":
      return (
        <Link
          href={`/songs?view=explore&songId=${encodeURIComponent(attachment.id)}`}
          className={cardClass}>
          <CardBody
            kind='song'
            title={attachment.title}
            subtitle={attachment.artist}
            action='Open'
          />
        </Link>
      );
    case "recording":
      return (
        <button
          type='button'
          onClick={() => onOpenRecording(attachment.id)}
          className={cardClass}>
          <CardBody
            kind='recording'
            title={attachment.title}
            subtitle={attachment.subtitle}
            action='Watch'
          />
        </button>
      );
    case "item": {
      const { rolledGuitar, rolledEffect, level } = resolveRolledItem(
        attachment.rolledItem,
      );
      return (
        <div className='rounded-lg bg-zinc-900/60 p-3'>
          <ItemPill
            itemType={attachment.itemType}
            itemName={attachment.itemName}
            itemBrand={attachment.itemBrand}
            itemRarity={attachment.itemRarity}
            itemImageId={attachment.itemImageId}
            level={level}
            rolledGuitar={rolledGuitar}
            rolledEffect={rolledEffect}
          />
        </div>
      );
    }
  }
};
