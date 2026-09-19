export interface LandingFeature {
  label: string;
  desc: string;
}

interface FeatureListProps {
  features: LandingFeature[];
  /** `row` lays the items out side by side on wide screens. */
  layout?: "stack" | "row";
}

/**
 * Numbered feature rows shared by the landing's product sections. The index
 * is set in Teko, the same condensed face the app uses for its timer and
 * score counters, so the landing's numerals carry the product's own voice
 * instead of a stock icon-in-a-tile that says nothing about the row.
 */
export const FeatureList = ({
  features,
  layout = "stack",
}: FeatureListProps) => (
  <ul
    className={
      layout === "row"
        ? "grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-3"
        : "space-y-6"
    }>
    {features.map((feature, i) => (
      <li key={feature.label} className='flex items-start gap-5'>
        <span
          aria-hidden='true'
          className='-mt-0.5 w-7 shrink-0 font-teko text-[26px] font-medium tabular-nums leading-none text-zinc-600'>
          {String(i + 1).padStart(2, "0")}
        </span>
        <div>
          <div className='mb-1 text-sm font-bold text-white'>
            {feature.label}
          </div>
          <div className='text-sm leading-relaxed text-zinc-400'>
            {feature.desc}
          </div>
        </div>
      </li>
    ))}
  </ul>
);
