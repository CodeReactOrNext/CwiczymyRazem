import { Card } from "assets/components/ui/card";

import type { InsightItem } from "./types";

export const InsightCard = ({ insight }: { insight: InsightItem }) => (
  <Card className='border-0 bg-zinc-900/40 p-5 shadow-sm backdrop-blur-sm'>
    <div className='flex items-start gap-4'>
      <div className='rounded-lg bg-zinc-800 p-2.5 text-zinc-400'>{insight.icon}</div>
      <div>
        <p className='mb-1.5 text-[11px] font-semibold tracking-widest text-zinc-500'>{insight.label}</p>
        <p className='text-xl font-bold tabular-nums text-white'>{insight.value}</p>
        {insight.description && (
          <p className='mt-1 text-xs font-medium text-zinc-500'>
            {insight.description}
          </p>
        )}
      </div>
    </div>
  </Card>
);
