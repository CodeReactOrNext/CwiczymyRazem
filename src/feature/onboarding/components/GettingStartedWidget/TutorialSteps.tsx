import { cn } from "assets/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  ChevronRight,
  Clock,
  Guitar,
  ListChecks,
} from "lucide-react";
import type { ReactNode } from "react";
import { Fragment } from "react";

interface TutorialStepItem {
  text: ReactNode;
  /** Optional mock of the UI element the user should look for (e.g. a fake button). */
  visual?: ReactNode;
}

/** Numbered step-by-step list used inside the Getting Started modals. */
export const TutorialSteps = ({ steps }: { steps: TutorialStepItem[] }) => (
  <ol className='space-y-2'>
    {steps.map((step, index) => (
      <li
        key={index}
        className='flex items-start gap-3 rounded-lg bg-zinc-900/60 p-3'>
        <span className='mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-[11px] font-semibold text-cyan-400'>
          {index + 1}
        </span>
        <div className='min-w-0 flex-1 space-y-2.5'>
          <p className='text-sm leading-relaxed text-zinc-300'>{step.text}</p>
          {step.visual}
        </div>
      </li>
    ))}
  </ol>
);

type FakeButtonTone =
  | "solid"
  | "cyanSolid"
  | "cyan"
  | "zinc"
  | "violet"
  | "sky"
  | "orange";

/**
 * Tones mirror the real UI: `solid` = default app Button (white),
 * `cyanSolid` = the exercise page "Start Practice" CTA, the tinted ones =
 * category chips from the exercises landing page.
 */
const FAKE_BUTTON_TONES: Record<FakeButtonTone, string> = {
  solid: "bg-zinc-50 font-medium text-zinc-950 shadow",
  cyanSolid: "bg-cyan-500 font-bold text-zinc-950",
  cyan: "bg-cyan-500/10 text-cyan-400",
  zinc: "bg-zinc-800 text-zinc-300",
  violet: "bg-violet-500/10 text-violet-400",
  sky: "bg-sky-500/10 text-sky-400",
  orange: "bg-orange-500/10 text-orange-400",
};

/** Non-interactive replica of a button/pill from the app, so users know what to look for. */
export const FakeButton = ({
  icon: Icon,
  children,
  tone = "cyan",
}: {
  icon?: LucideIcon;
  children: ReactNode;
  tone?: FakeButtonTone;
}) => (
  <span
    aria-hidden='true'
    className={cn(
      "inline-flex select-none items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold",
      FAKE_BUTTON_TONES[tone],
    )}>
    {Icon && <Icon size={13} />}
    {children}
  </span>
);

/** Breadcrumb-style path showing where something lives in the app (e.g. Practice → Plans). */
export const FakeNavPath = ({
  items,
}: {
  items: { icon?: LucideIcon; label: string }[];
}) => (
  <span aria-hidden='true' className='flex flex-wrap items-center gap-1'>
    {items.map((item, index) => (
      <Fragment key={item.label}>
        {index > 0 && <ChevronRight size={12} className='text-zinc-600' />}
        <span className='inline-flex select-none items-center gap-1.5 rounded-md bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300'>
          {item.icon && <item.icon size={12} className='text-zinc-400' />}
          {item.label}
        </span>
      </Fragment>
    ))}
  </span>
);

/** Mock of a form field styled like the real Add Song modal inputs. */
export const FakeInput = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <span aria-hidden='true' className='flex min-w-0 flex-col gap-1.5'>
    <span className='ml-1 text-[10px] font-bold text-zinc-400'>{label}</span>
    <span className='truncate rounded-lg bg-white/5 px-3 py-2 text-xs font-medium text-zinc-100'>
      {value}
    </span>
  </span>
);

type FakeStatusTone = "zinc" | "amber" | "green";

/** Mirrors STATUS_CONFIG from the real Add Song modal. */
const FAKE_STATUS_TONES: Record<
  FakeStatusTone,
  { text: string; tile: string; border: string }
> = {
  zinc: {
    text: "text-zinc-400",
    tile: "bg-zinc-400/10 text-zinc-400",
    border: "border-zinc-400/20",
  },
  amber: {
    text: "text-amber-400",
    tile: "bg-amber-400/10 text-amber-400",
    border: "border-amber-400/20",
  },
  green: {
    text: "text-green-500",
    tile: "bg-green-500/10 text-green-500",
    border: "border-green-500/20",
  },
};

/** Compact replica of the status cards shown in the real Add Song modal. */
export const FakeStatusCard = ({
  icon: Icon,
  label,
  sub,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  sub: string;
  tone: FakeStatusTone;
}) => (
  <span
    aria-hidden='true'
    className={cn(
      "flex select-none items-center gap-3 rounded-xl border bg-white/[0.02] p-2.5",
      FAKE_STATUS_TONES[tone].border,
    )}>
    <span className={cn("rounded-lg p-2", FAKE_STATUS_TONES[tone].tile)}>
      <Icon size={14} />
    </span>
    <span className='flex min-w-0 flex-col'>
      <span className={cn("text-xs font-bold", FAKE_STATUS_TONES[tone].text)}>
        {label}
      </span>
      <span className='text-[10px] text-zinc-500'>{sub}</span>
    </span>
  </span>
);

/** Compact replica of a real PlanCard (gradient background, icon tile, meta row). */
export const FakePlanCard = ({
  title,
  duration,
  exercises,
}: {
  title: string;
  duration: string;
  exercises: string;
}) => (
  <span
    aria-hidden='true'
    className='flex select-none items-center gap-3 rounded-xl bg-gradient-to-br from-blue-500/15 via-zinc-900/60 to-zinc-950 p-3'>
    <span className='rounded-lg bg-blue-500/10 p-2 text-blue-400'>
      <Guitar size={14} />
    </span>
    <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
      <span className='truncate text-xs font-bold text-white'>{title}</span>
      <span className='flex items-center gap-3 text-[10px] text-zinc-400'>
        <span className='inline-flex items-center gap-1'>
          <Clock size={10} />
          {duration}
        </span>
        <span className='inline-flex items-center gap-1'>
          <ListChecks size={10} />
          {exercises}
        </span>
      </span>
    </span>
    <ArrowUpRight size={14} className='shrink-0 text-zinc-500' />
  </span>
);

/** Icon + title + description row for feature overviews (welcome modal). */
export const TutorialFeature = ({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) => (
  <div className='flex items-start gap-3 rounded-lg bg-zinc-900/60 p-3'>
    <Icon size={16} className='mt-0.5 shrink-0 text-cyan-400' />
    <p className='text-sm leading-relaxed text-zinc-300'>
      <span className='font-medium text-zinc-100'>{title}</span> {children}
    </p>
  </div>
);
