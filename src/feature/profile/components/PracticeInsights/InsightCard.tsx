import { Card } from "assets/components/ui/card";

import type { InsightItem } from "./types";

export const InsightCard = ({ insight }: { insight: InsightItem }) => (
  <Card className='p-4'>
    <div className='flex items-start gap-3'>
      <div className='rounded-lg bg-second p-2'>{insight.icon}</div>
      <div>
        <p className='mb-3 text-sm text-muted-foreground'>{insight.label}</p>
        <p className='text-md font-semibold'>{insight.value}</p>
        {insight.description && (
          <p className='mt-1 text-xs text-muted-foreground'>
            {insight.description}
          </p>
        )}
      </div>
    </div>
  </Card>
);
