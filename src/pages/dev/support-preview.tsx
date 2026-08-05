import { SupportModal } from "feature/support/components/SupportModal";
import {
  getSupportVariantCopy,
  type SupportVariantContext,
  type SupportVariantId,
} from "feature/support/content/supportVariants";
import { Coffee, Heart } from "lucide-react";
import { useState } from "react";

/**
 * TEMPORARY dev-only preview — not linked from any nav, writes nothing to
 * Firestore. Renders the 4 rotating Activity-feed support-ask card variants
 * plus the (non-rotating) Support modal, using mock data only. Delete this
 * file once the preview has been reviewed.
 */

const VARIANTS: SupportVariantId[] = [
  "server_cost",
  "roadmap_tier",
  "value_received",
  "social_proof",
];

const MOCK_CTX: SupportVariantContext = {
  raisedThisMonth: 12,
  monthlyGoal: 20,
  totalRaised: 133,
  supporters: 7,
  nextTierLabel: "Gear Affects Fame Points",
  nextTierAmountToGo: 8,
};

const MOCK_CTX_COVERED = {
  ...MOCK_CTX,
  raisedThisMonth: 20,
};

const PreviewCard = ({
  variant,
  ctx,
}: {
  variant: SupportVariantId;
  ctx: SupportVariantContext;
}) => {
  const copy = getSupportVariantCopy(variant, ctx);

  return (
    <div className='flex flex-col overflow-hidden rounded-xl bg-main-opposed-bg'>
      <div className='flex flex-wrap items-center gap-3 px-3 py-3 sm:px-5 sm:py-4'>
        <div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10'>
          <Heart size={16} className='text-amber-400' fill='currentColor' />
        </div>
        <div className='min-w-0 flex-1'>
          <p className='text-[10px] font-semibold uppercase tracking-widest text-amber-500/80'>
            {copy.eyebrow}
          </p>
          <h3 className='text-sm font-bold text-white sm:text-base'>{copy.headline}</h3>
        </div>
        <span className='ml-auto shrink-0 rounded bg-zinc-800 px-2 py-1 text-[10px] font-semibold text-zinc-400'>
          {variant}
        </span>
      </div>

      <div className='px-3 pb-4 sm:px-5'>
        <p className='text-sm text-secondText'>{copy.body}</p>
        <button className='mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-semibold text-zinc-950 sm:text-sm'>
          <Coffee size={14} />
          Support Riff Quest
        </button>
      </div>
    </div>
  );
};

export default function SupportPreviewPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className='mx-auto max-w-2xl p-8'>
      <h1 className='mb-1 text-xl font-bold text-white'>
        Support-ask preview (dev only, no Firestore writes)
      </h1>
      <p className='mb-6 text-sm text-zinc-400'>
        4 Activity-feed variants (cost not yet covered this month) below, one
        with cost already covered, and the fixed-copy modal.
      </p>

      <button
        onClick={() => setShowModal(true)}
        className='mb-8 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950'>
        Open the Support modal
      </button>

      <div className='flex flex-col gap-4'>
        {VARIANTS.map((variant) => (
          <PreviewCard key={variant} variant={variant} ctx={MOCK_CTX} />
        ))}
        <p className='mt-2 text-xs uppercase tracking-widest text-zinc-500'>
          server_cost: covered this month
        </p>
        <PreviewCard variant='server_cost' ctx={MOCK_CTX_COVERED} />
        <p className='mt-2 text-xs uppercase tracking-widest text-zinc-500'>
          roadmap_tier: every tier funded
        </p>
        <PreviewCard
          variant='roadmap_tier'
          ctx={{ ...MOCK_CTX, nextTierLabel: undefined, nextTierAmountToGo: undefined }}
        />
      </div>

      <SupportModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onDonate={() => setShowModal(false)}
      />
    </div>
  );
}
