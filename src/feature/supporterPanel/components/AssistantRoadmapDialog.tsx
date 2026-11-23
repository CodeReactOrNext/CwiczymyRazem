import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "assets/components/ui/button";
import { cn } from "assets/lib/utils";
import { BuilderHeading } from "feature/supporterPanel/components/roadmapBrief/BuilderFrame";
import { useElectronWindowControls } from "hooks/useElectronWindowControls";
import { useTranslation } from "hooks/useTranslation";
import { Check, Copy, X } from "lucide-react";
import Link from "next/link";
import posthog from "posthog-js";
import { useEffect, useState } from "react";

const MAX_GOAL_LENGTH = 500;
/** How long the button says "Copied" before it offers to copy again. */
const COPIED_FOR_MS = 2500;
const STEPS = [0, 1, 2];

interface AssistantRoadmapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * What "Create roadmap" opens now that riff.quest writes none itself: the
 * player's own AI assistant builds it through the MCP connection — from their
 * practice history and the app's library — and riff.quest checks and saves it.
 *
 * So this screen has one job: put the right request in the player's clipboard
 * and say where it goes. They can type the goal here, so the request they
 * paste is already about it; the assistant asks the rest.
 */
export const AssistantRoadmapDialog = ({
  open,
  onOpenChange,
}: AssistantRoadmapDialogProps) => {
  const { t } = useTranslation("supporter");
  const { isElectron } = useElectronWindowControls();
  const [goal, setGoal] = useState("");
  const [copied, setCopied] = useState(false);
  const close = () => onOpenChange(false);

  useEffect(() => {
    if (open) posthog.capture("roadmap_builder_opened", { via: "assistant" });
  }, [open]);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), COPIED_FOR_MS);
    return () => clearTimeout(timer);
  }, [copied]);

  const prompt = goal.trim()
    ? t("panel.assistant.prompt", { goal: goal.trim() })
    : t("panel.assistant.prompt_no_goal");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      posthog.capture("roadmap_assistant_prompt_copied", {
        withGoal: Boolean(goal.trim()),
      });
    } catch {
      // No clipboard access: the text is on screen to select by hand.
    }
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={cn(
            // The same layer the old builder took: over the phone's tab bar
            // and every in-app dialog, under the Electron title bar.
            "fixed inset-x-0 bottom-0 z-[120] flex flex-col bg-zinc-950 focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0",
            isElectron ? "top-10" : "top-0",
          )}>
          <DialogPrimitive.Title className='sr-only'>
            {t("panel.assistant.title")}
          </DialogPrimitive.Title>

          <div className='flex shrink-0 justify-end px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8 sm:pt-6'>
            <Button
              type='button'
              variant='subtle'
              size='icon'
              onClick={close}
              aria-label={t("panel.generate.close_builder")}>
              <X />
            </Button>
          </div>

          <div className='min-h-0 flex-1 overflow-y-auto px-4 pb-10 pt-4 sm:px-8 sm:pt-8'>
            <div className='mx-auto w-full max-w-2xl space-y-9'>
              <BuilderHeading
                title={t("panel.assistant.title")}
                hint={t("panel.assistant.body")}
              />

              <div className='space-y-2.5'>
                <label
                  htmlFor='assistant-roadmap-goal'
                  className='block text-sm font-semibold text-zinc-300'>
                  {t("panel.assistant.goal_label")}
                </label>
                <div className='rounded-lg bg-zinc-800/60 focus-within:ring-1 focus-within:ring-zinc-500'>
                  <textarea
                    id='assistant-roadmap-goal'
                    rows={3}
                    maxLength={MAX_GOAL_LENGTH}
                    value={goal}
                    onChange={(event) => setGoal(event.target.value)}
                    placeholder={t("panel.generate.goal_placeholder")}
                    className='block w-full resize-none bg-transparent px-4 py-3.5 text-base leading-relaxed text-zinc-100 outline-none placeholder:text-zinc-500'
                  />
                </div>
              </div>

              <div className='space-y-3'>
                <p className='text-sm font-semibold text-zinc-300'>
                  {t("panel.assistant.prompt_label")}
                </p>
                <p className='select-all whitespace-pre-wrap rounded-lg bg-zinc-900/60 px-5 py-4 text-sm leading-relaxed text-zinc-200'>
                  {prompt}
                </p>
                <div className='flex flex-wrap items-center gap-2'>
                  <Button type='button' size='lg' onClick={() => void copy()}>
                    {copied ? <Check /> : <Copy />}
                    {copied
                      ? t("panel.assistant.copied")
                      : t("panel.assistant.copy")}
                  </Button>
                  <Button asChild variant='ghost' size='lg'>
                    <Link href='/wiki/ai-assistants' target='_blank'>
                      {t("panel.assistant.connect")}
                    </Link>
                  </Button>
                </div>
              </div>

              <ol className='space-y-3'>
                {STEPS.map((index) => (
                  <li
                    key={index}
                    className='flex items-baseline gap-3 text-sm leading-relaxed text-zinc-400'>
                    <span className='text-sm font-semibold tabular-nums text-zinc-500'>
                      {index + 1}
                    </span>
                    {t(`panel.assistant.steps.${index}`)}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
