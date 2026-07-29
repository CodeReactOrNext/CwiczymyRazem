import { ExternalLink } from "lucide-react";

import type { GuideSource } from "../types";
import { GuideSection } from "./GuideSection";

interface GuideSourcesProps {
  sources: GuideSource[];
}

export const GuideSources = ({ sources }: GuideSourcesProps) => {
  if (sources.length === 0) return null;

  return (
    <GuideSection heading='Sources'>
      <ul className='space-y-2'>
        {sources.map((source) => (
          <li key={source.url}>
            <a
              href={source.url}
              target='_blank'
              rel='noopener noreferrer'
              className='inline-flex items-center gap-1.5 text-sm text-cyan-400 transition-colors hover:text-cyan-300'>
              {source.label}
              <ExternalLink className='h-3.5 w-3.5 shrink-0' aria-hidden='true' />
            </a>
          </li>
        ))}
      </ul>
    </GuideSection>
  );
};
