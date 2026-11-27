import { SegmentedControl, type SegmentOption } from "components/SegmentedControl/SegmentedControl";
import {
  type NoteLearnerNotes,
  type NoteLearnerStrings,
  useNoteLearnerStore,
} from "feature/exercisePlan/data/exerises/noteLearner/noteLearnerStore";
import { useTranslation } from "hooks/useTranslation";

// Low E first: the order the strings are learned in, and the one the neck
// diagram puts at the bottom.
const STRING_ORDER = [6, 5, 4, 3, 2, 1] as const;
const STRING_SHORT = ["", "e", "B", "G", "D", "A", "E"];

/**
 * The learning hunt's two choices — which string and which notes — under the
 * neck. A change takes effect on the spot: `onChange` brings up a fresh note
 * from the new pool rather than finishing one the player no longer asked for.
 */
export function NoteLearnerPicker({ onChange }: { onChange: () => void }) {
  const { t } = useTranslation("session");
  const strings = useNoteLearnerStore((state) => state.strings);
  const notes = useNoteLearnerStore((state) => state.notes);
  const setStrings = useNoteLearnerStore((state) => state.setStrings);
  const setNotes = useNoteLearnerStore((state) => state.setNotes);

  const stringOptions: SegmentOption[] = [
    ...STRING_ORDER.map((string) => ({
      value: String(string),
      label: t(`note_hunt.strings.${string}`),
      shortLabel: STRING_SHORT[string],
    })),
    { value: "all", label: t("note_hunt.learn_whole_neck"), shortLabel: "1–6" },
  ];
  const noteOptions: SegmentOption<NoteLearnerNotes>[] = [
    { value: "naturals", label: t("note_hunt.learn_naturals"), shortLabel: "C–B" },
    { value: "all", label: t("note_hunt.learn_all_notes") },
  ];

  return (
    <div className='flex flex-wrap items-center justify-center gap-2'>
      <SegmentedControl
        label={t("note_hunt.learn_strings")}
        options={stringOptions}
        selected={[String(strings)]}
        onSelect={(value) => {
          const next: NoteLearnerStrings = value === "all" ? "all" : (Number(value) as NoteLearnerStrings);
          if (next === strings) return;
          setStrings(next);
          onChange();
        }}
      />
      <SegmentedControl
        label={t("note_hunt.learn_notes")}
        options={noteOptions}
        selected={[notes]}
        onSelect={(value) => {
          if (value === notes) return;
          setNotes(value);
          onChange();
        }}
      />
    </div>
  );
}
