// App page outside AppLayout: register the app-only English namespaces.
import "lib/i18n/fullCatalog";

import { useQueryClient } from "@tanstack/react-query";
import {
  SupportModal,
  type SupportModalVariant,
} from "feature/support/components/SupportModal";
import { SUPPORTER_ROADMAP_KEY } from "feature/supporterPanel/hooks/useSupporterRoadmap";
import type { RoadmapBoard } from "feature/supporterPanel/types/supporterPanel.types";
import { useState } from "react";

/**
 * Dev-only harness: opens SupportModal straight away, skipping the
 * useSupportPrompt eligibility rules (7 days, 5 sessions, cooldowns), so both
 * versions can be looked at without faking an account. The ask's funding
 * numbers come from the real /api/buy-me-a-coffee; the thanks gets a fixture
 * wallet, since the real board 403s for anyone without the badge. Not linked
 * from any nav; renders nothing outside development.
 */
const VARIANTS: { variant: SupportModalVariant; label: string }[] = [
  { variant: "ask", label: "Ask (not a supporter)" },
  { variant: "thanks", label: "Thanks (supporter)" },
  { variant: "again", label: "Again (supporter, every 4th)" },
];

const FIXTURE_BOARD: RoadmapBoard = {
  ideas: [],
  myBacking: {},
  myUid: "preview",
  isOwner: false,
  wallet: {
    supportTotal: 10,
    fromDonation: 50,
    earned: 70,
    granted: 0,
    spent: 58,
    left: 12,
  },
};

export default function SupportModalPreviewPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState<SupportModalVariant | null>("ask");
  useState(() => queryClient.setQueryData(SUPPORTER_ROADMAP_KEY, FIXTURE_BOARD));

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div className='flex min-h-screen items-center justify-center gap-3 bg-zinc-950'>
      {VARIANTS.map(({ variant, label }) => (
        <button
          key={variant}
          onClick={() => setOpen(variant)}
          className='rounded-md bg-zinc-800/60 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-800'>
          {label}
        </button>
      ))}
      <SupportModal
        isOpen={open !== null}
        variant={open ?? "ask"}
        name='Alex'
        practiceHours={31}
        onClose={() => setOpen(null)}
        onDonate={() => setOpen(null)}
      />
    </div>
  );
}
