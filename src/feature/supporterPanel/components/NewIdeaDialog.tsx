import { Button } from "assets/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import { Input } from "assets/components/ui/input";
import { Label } from "assets/components/ui/label";
import { Textarea } from "assets/components/ui/textarea";
import { cn } from "assets/lib/utils";
import { SupportToken } from "components/UI/SupportToken/SupportToken";
import {
  IDEA_ICON_COMPONENTS,
  IDEA_ICON_LABELS,
} from "feature/supporterPanel/constants/ideaIcons";
import {
  IDEA_COST,
  IDEA_DESCRIPTION_MAX,
  IDEA_TITLE_MAX,
} from "feature/supporterPanel/constants/supporterPanel.constants";
import type { RoadmapIdeaIcon } from "feature/supporterPanel/types/supporterPanel.types";
import {
  DEFAULT_ROADMAP_IDEA_ICON,
  ROADMAP_IDEA_ICONS,
} from "feature/supporterPanel/types/supporterPanel.types";
import { useState } from "react";

interface NewIdeaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokensLeft: number;
  busy: boolean;
  onSubmit: (input: {
    title: string;
    description: string;
    icon: RoadmapIdeaIcon;
  }) => Promise<void>;
}

/**
 * Icon-only buttons: the label would just repeat the picture, so it lives in
 * the tooltip and the accessible name instead of on the grid.
 */
const IconPicker = ({
  value,
  onChange,
}: {
  value: RoadmapIdeaIcon;
  onChange: (icon: RoadmapIdeaIcon) => void;
}) => (
  <div className='flex flex-wrap gap-2'>
    {ROADMAP_IDEA_ICONS.map((icon) => {
      const Icon = IDEA_ICON_COMPONENTS[icon];
      const isActive = icon === value;

      return (
        <button
          key={icon}
          type='button'
          title={IDEA_ICON_LABELS[icon]}
          aria-label={IDEA_ICON_LABELS[icon]}
          aria-pressed={isActive}
          onClick={() => onChange(icon)}
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded transition-colors",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            isActive
              ? "bg-cyan-500/10 text-cyan-400"
              : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200",
          )}>
          <Icon size={18} />
        </button>
      );
    })}
  </div>
);

/**
 * Posting costs credits that never come back, so the price is on the button
 * itself rather than buried in a tooltip somebody finds afterwards.
 */
export const NewIdeaDialog = ({
  open,
  onOpenChange,
  tokensLeft,
  busy,
  onSubmit,
}: NewIdeaDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState<RoadmapIdeaIcon>(DEFAULT_ROADMAP_IDEA_ICON);

  const canSubmit = title.trim().length > 0 && tokensLeft >= IDEA_COST && !busy;

  const submit = async () => {
    if (!canSubmit) return;
    await onSubmit({
      title: title.trim(),
      description: description.trim(),
      icon,
    });
    setTitle("");
    setDescription("");
    setIcon(DEFAULT_ROADMAP_IDEA_ICON);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Put an idea on the roadmap</DialogTitle>
          <DialogDescription>
            It goes straight onto the board for every supporter to back. Costs{" "}
            <SupportToken size={18} className='inline-block align-middle' />{" "}
            {IDEA_COST} — you have{" "}
            <SupportToken size={18} className='inline-block align-middle' />{" "}
            {tokensLeft} left.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-5 py-2'>
          <div className='space-y-2'>
            <Label
              htmlFor='idea-title'
              className='ml-1 font-bold text-zinc-400'>
              Idea
            </Label>
            <Input
              id='idea-title'
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={IDEA_TITLE_MAX}
              placeholder='Metronome that follows the tab tempo map'
              className='h-12 bg-white/5 font-medium'
            />
          </div>

          <div className='space-y-3'>
            <Label className='ml-1 font-bold text-zinc-400'>
              Icon{" "}
              <span className='font-medium text-zinc-500'>
                {IDEA_ICON_LABELS[icon]}
              </span>
            </Label>
            <IconPicker value={icon} onChange={setIcon} />
          </div>

          <div className='space-y-2'>
            <Label
              htmlFor='idea-detail'
              className='ml-1 font-bold text-zinc-400'>
              Why it matters{" "}
              <span className='font-medium text-zinc-500'>optional</span>
            </Label>
            <Textarea
              id='idea-detail'
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={IDEA_DESCRIPTION_MAX}
              rows={4}
              placeholder='What you are trying to do today, and where the app gets in the way.'
              className='resize-none bg-white/5 font-medium'
            />
          </div>
        </div>

        <div className='flex justify-end gap-3'>
          <Button
            variant='ghost'
            onClick={() => onOpenChange(false)}
            className='text-zinc-400 hover:text-zinc-200'>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canSubmit}>
            {tokensLeft >= IDEA_COST ? (
              <span className='flex items-center gap-1.5'>
                Post for
                <SupportToken size={20} />
                {IDEA_COST}
              </span>
            ) : (
              "Not enough tokens"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
