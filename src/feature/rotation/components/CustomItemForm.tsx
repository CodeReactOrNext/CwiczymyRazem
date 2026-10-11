import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import { cn } from "assets/lib/utils";
import { SKILL_CATEGORY_ICONS } from "components/Icon/skillCategoryIcons";
import { Plus, Timer } from "lucide-react";
import { useState } from "react";
import type { SkillsType } from "types/skillsTypes";

import { useRotationDisplay } from "../hooks/useRotationDisplay";
import type { RotationItem } from "../types/rotation.types";
import { normalizeLink } from "../utils/rotation.utils";

const CATEGORIES: SkillsType[] = [
  "technique",
  "theory",
  "hearing",
  "creativity",
];
const MAX_TITLE = 80;
const MAX_NOTE = 120;

/** Tap-to-fill starting points, one per category, so the form never starts blank in your head. */
const EXAMPLES: { key: string; category: SkillsType }[] = [
  { key: "course", category: "technique" },
  { key: "chord", category: "theory" },
  { key: "transcribe", category: "hearing" },
  { key: "jam", category: "creativity" },
];

type CustomCandidate = Omit<RotationItem, "addedAt">;

interface CustomItemFormProps {
  onAdd: (item: CustomCandidate) => Promise<boolean>;
}

/** A custom rotation item: a name, an optional note and link, and whether it runs on the free timer. */
export const CustomItemForm = ({ onAdd }: CustomItemFormProps) => {
  const { t } = useRotationDisplay();
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [link, setLink] = useState("");
  const [timer, setTimer] = useState(true);
  const [category, setCategory] = useState<SkillsType>("technique");
  const [isSaving, setIsSaving] = useState(false);

  const normalizedLink = link.trim() ? normalizeLink(link) : null;
  const isLinkInvalid = link.trim() !== "" && normalizedLink === null;
  const canSave = title.trim() !== "" && !isLinkInvalid && !isSaving;

  const fillExample = (example: (typeof EXAMPLES)[number]) => {
    setTitle(t(`custom.examples.${example.key}.title`));
    setNote(t(`custom.examples.${example.key}.note`));
    setCategory(example.category);
    setTimer(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    setIsSaving(true);
    const added = await onAdd({
      type: "custom",
      id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim().slice(0, MAX_TITLE),
      ...(note.trim() && { note: note.trim().slice(0, MAX_NOTE) }),
      ...(normalizedLink && { link: normalizedLink }),
      ...(timer && { timer: true, category }),
    });
    setIsSaving(false);
    if (!added) return;
    setTitle("");
    setNote("");
    setLink("");
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <div className='space-y-3'>
        <p className='text-sm text-zinc-400'>{t("custom.examples_label")}</p>
        <div className='flex flex-wrap gap-2'>
          {EXAMPLES.map((example) => (
            <button
              key={example.key}
              type='button'
              onClick={() => fillExample(example)}
              className='rounded-lg bg-zinc-800/60 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'>
              {t(`custom.examples.${example.key}.title`)}
            </button>
          ))}
        </div>
      </div>

      <div className='space-y-4'>
        <label className='block space-y-2'>
          <span className='text-sm font-medium text-zinc-200'>
            {t("custom.name_label")}
          </span>
          <Input
            value={title}
            maxLength={MAX_TITLE}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={t("custom.name_placeholder")}
            className='h-11 border-0 bg-zinc-800/60 text-zinc-100'
          />
        </label>
        <label className='block space-y-2'>
          <span className='text-sm font-medium text-zinc-200'>
            {t("custom.note_label")}
          </span>
          <Input
            value={note}
            maxLength={MAX_NOTE}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t("custom.note_placeholder")}
            className='h-11 border-0 bg-zinc-800/60 text-zinc-100'
          />
        </label>
        <label className='block space-y-2'>
          <span className='text-sm font-medium text-zinc-200'>
            {t("custom.link_label")}
          </span>
          <Input
            value={link}
            inputMode='url'
            onChange={(event) => setLink(event.target.value)}
            placeholder={t("custom.link_placeholder")}
            aria-invalid={isLinkInvalid}
            className='h-11 border-0 bg-zinc-800/60 text-zinc-100'
          />
          {isLinkInvalid && (
            <span className='block text-xs text-orange-400'>
              {t("custom.link_invalid")}
            </span>
          )}
        </label>
      </div>

      <div className='space-y-4 rounded-lg bg-zinc-800/40 p-4'>
        <button
          type='button'
          role='switch'
          aria-checked={timer}
          onClick={() => setTimer((value) => !value)}
          className='flex w-full items-start gap-4 rounded text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400'>
          <Timer className='mt-0.5 h-4 w-4 shrink-0 text-zinc-400' />
          <span className='min-w-0 flex-1'>
            <span className='block text-sm font-medium text-zinc-100'>
              {t("custom.timer_label")}
            </span>
            <span className='mt-1 block text-xs leading-relaxed text-zinc-400'>
              {t(timer ? "custom.timer_on" : "custom.timer_off")}
            </span>
          </span>
          <span
            className={cn(
              "relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors",
              timer ? "bg-emerald-500" : "bg-zinc-700",
            )}>
            <span
              className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all",
                timer ? "left-[18px]" : "left-0.5",
              )}
            />
          </span>
        </button>

        {timer && (
          <div
            role='radiogroup'
            aria-label={t("custom.category_label")}
            className='grid grid-cols-4 gap-2'>
            {CATEGORIES.map((id) => {
              const Icon = SKILL_CATEGORY_ICONS[id];
              const active = category === id;
              return (
                <button
                  key={id}
                  type='button'
                  role='radio'
                  aria-checked={active}
                  onClick={() => setCategory(id)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-lg px-2 py-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400",
                    active
                      ? "bg-zinc-700 text-zinc-100"
                      : "bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
                  )}>
                  <Icon className='h-4 w-4' />
                  {t(`common:categories.${id}`)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Button
        type='submit'
        disabled={!canSave}
        className='h-11 w-full rounded-lg bg-zinc-100 font-bold text-black focus-visible:ring-1 focus-visible:ring-zinc-400 hover:bg-white'>
        <span className='flex items-center gap-2'>
          <Plus className='h-4 w-4' />
          {t("custom.add")}
        </span>
      </Button>
    </form>
  );
};
