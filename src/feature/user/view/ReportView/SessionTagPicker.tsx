import { Input } from "assets/components/ui/input";
import { cn } from "assets/lib/utils";
import { useTranslation } from "hooks/useTranslation";

/** Tag labels double as ids; this is the key their translation lives under. */
export const tagKey = (label: string) => label.toLowerCase().replace(/[^a-z0-9]+/g, "_");

const TAG_GROUPS = [
  { label: "Goal", icon: "🎯", tags: [
    { label: "Warmup", icon: "🎸" },
    { label: "Technique", icon: "⚡" },
    { label: "Speed Building", icon: "🏎️" },
    { label: "Ear Training", icon: "👂" },
  ]},
  { label: "Playing Style", icon: "🎸", tags: [
    { label: "Fingerpicking", icon: "🖐️" },
    { label: "Rhythm Training", icon: "🥁" },
    { label: "Vibrato", icon: "〰️" },
    { label: "Bends", icon: "🎯" },
  ]},
  { label: "Techniques", icon: "🧩", tags: [
    { label: "Legato", icon: "🌊" },
    { label: "Alt Picking", icon: "🔄" },
    { label: "Hybrid Picking", icon: "🤟" },
    { label: "Sweep Picking", icon: "🌪️" },
    { label: "Tapping", icon: "👆" },
    { label: "Picking Control", icon: "🤏" },
    { label: "String Skipping", icon: "⏩" },
    { label: "Down Picking", icon: "⬇️" },
  ]},
  { label: "Theory & Knowledge", icon: "🎼", tags: [
    { label: "Scales", icon: "🎹" },
    { label: "Arpeggios", icon: "🎼" },
    { label: "Chords", icon: "🔗" },
    { label: "Theory", icon: "📚" },
    { label: "Sight Reading", icon: "👁️" },
    { label: "Transcribing", icon: "🎧" },
  ]},
  { label: "Creative", icon: "🎵", tags: [
    { label: "Improvisation", icon: "✨" },
    { label: "New Song", icon: "🎵" },
    { label: "Song Writing", icon: "✍️" },
    { label: "Composition", icon: "🖊️" },
    { label: "Jamming", icon: "🔊" },
  ]},
  { label: "Performance", icon: "🎤", tags: [
    { label: "Performance Prep", icon: "🎭" },
    { label: "Performing", icon: "🎤" },
    { label: "Cover Song", icon: "🎵" },
    { label: "Soloing", icon: "🌟" },
    { label: "Recording", icon: "⏺️" },
  ]},
];

interface SessionTagPickerProps {
  title: string;
  titleError?: string;
  selectedTags: string[];
  /** Typing a title of your own; the tags stop writing it. */
  onTitleChange: (title: string) => void;
  onToggleTag: (label: string) => void;
}

/**
 * The session's title, typed or built from tags: every tag ticked joins the
 * title, so a few taps describe the session without writing anything.
 */
const SessionTagPicker = ({
  title,
  titleError,
  selectedTags,
  onTitleChange,
  onToggleTag,
}: SessionTagPickerProps) => {
  const { t } = useTranslation("report");

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-col gap-2'>
        <label htmlFor='reportTitle' className='text-sm font-semibold text-zinc-300'>
          {t("form.session_title")}
        </label>
        <Input
          id='reportTitle'
          name='reportTitle'
          placeholder={t("form.session_title_placeholder")}
          className={cn(
            "h-11 bg-zinc-900/40 text-base focus-visible:ring-cyan-500/40 sm:text-sm",
            titleError && "ring-1 ring-red-500/40"
          )}
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
        />
        {titleError && (
          <p className='text-xs font-medium text-red-400'>{titleError}</p>
        )}
      </div>

      {TAG_GROUPS.map((group) => (
        <div key={group.label} className='flex flex-col gap-2.5'>
          <p className='text-sm font-semibold text-zinc-300'>
            {group.icon} {t(`tag_groups.${tagKey(group.label)}`, group.label)}
          </p>
          <div className='flex flex-wrap gap-2'>
            {group.tags.map((tag) => {
              const isActive = selectedTags.includes(tag.label);
              return (
                <button
                  key={tag.label}
                  type='button'
                  aria-pressed={isActive}
                  onClick={() => onToggleTag(tag.label)}
                  className={cn(
                    "flex min-h-10 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "bg-zinc-100 text-zinc-950"
                      : "bg-zinc-800/60 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  )}>
                  <span aria-hidden>{tag.icon}</span>
                  {t(`tags.${tagKey(tag.label)}`, tag.label)}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SessionTagPicker;
