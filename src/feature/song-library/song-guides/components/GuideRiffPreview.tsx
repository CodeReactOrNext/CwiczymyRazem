import { Button } from "assets/components/ui/button";
import { idToSlug } from "feature/exercises/lib/slugUtils";
import { MountOnVisible } from "feature/seoLanding/components/MountOnVisible";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import type { SongGuide } from "../types";
import { GuideRiffPlayer } from "./GuideRiffPlayer";
import { GuideSection } from "./GuideSection";

interface GuideRiffPreviewProps {
  riffPreview: NonNullable<SongGuide["riffPreview"]>;
}

/**
 * Playable notation excerpt for a guide — real audio via AlphaTab's own
 * synth, no login or microphone needed. Lazy-mounted (AlphaTab + a ~1.3MB
 * soundfont) only once scrolled into view.
 */
export const GuideRiffPreview = ({ riffPreview }: GuideRiffPreviewProps) => {
  return (
    <GuideSection heading={riffPreview.heading} intro={riffPreview.intro}>
      <div className='space-y-3'>
        <MountOnVisible
          placeholder={
            <div className='min-h-[180px] animate-pulse rounded-lg bg-zinc-950/70' />
          }>
          <GuideRiffPlayer
            measures={riffPreview.measures}
            bpm={riffPreview.bpm}
            bpmMin={riffPreview.bpmMin}
            bpmMax={riffPreview.bpmMax}
          />
        </MountOnVisible>
        {riffPreview.practiceExerciseId && (
          <div className='flex flex-wrap items-center gap-3 pt-1'>
            <Link href={`/practice/exercise/${idToSlug(riffPreview.practiceExerciseId)}`}>
              <Button className='h-9 rounded-lg bg-cyan-500 px-5 text-sm font-bold text-black transition-colors hover:bg-cyan-400'>
                Practice it with real-time scoring
                <ArrowRight className='ml-1.5 h-4 w-4' />
              </Button>
            </Link>
            <span className='text-xs font-medium text-zinc-500'>
              Free — tracks your accuracy via your mic
            </span>
          </div>
        )}
      </div>
    </GuideSection>
  );
};
