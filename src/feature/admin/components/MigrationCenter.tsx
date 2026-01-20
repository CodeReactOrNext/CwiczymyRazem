import { Button } from "assets/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "assets/components/ui/card";
import { cn } from "assets/lib/utils";
import { Database,RefreshCw } from "lucide-react";

interface MigrationCenterProps {
  onMigrateExercises: () => void;
  isMigrating: boolean;
  progress: { current: number; total: number };
}

export const MigrationCenter = ({
  onMigrateExercises,
  isMigrating,
  progress,
}: MigrationCenterProps) => {
  return (
    <Card className='border-white/5 bg-zinc-900/40 backdrop-blur-md'>
      <CardHeader>
        <div className='flex items-center gap-3'>
          <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500'>
            <Database size={20} />
          </div>
          <div>
            <CardTitle className='text-xl font-bold text-white'>Migration Center</CardTitle>
            <CardDescription className='text-zinc-500'>
              Database maintenance and schema migrations
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='flex flex-col items-start justify-between gap-4 rounded-xl border border-white/5 bg-black/20 p-4 sm:flex-row sm:items-center'>
          <div className='space-y-1'>
            <h4 className='text-sm font-bold text-zinc-100'>Exercise Localization Migration</h4>
            <p className='text-xs text-zinc-500'>
              Converts exercise titles and descriptions from localized objects to plain strings.
            </p>
          </div>
          <Button
            onClick={onMigrateExercises}
            disabled={isMigrating}
            className='h-10 bg-orange-600 hover:bg-orange-500 shadow-lg shadow-orange-500/20 rounded-xl px-5 text-[10px] font-black uppercase tracking-[0.2em] text-white'
          >
            <RefreshCw className={cn("mr-2 h-3.5 w-3.5", isMigrating && "animate-spin")} />
            {isMigrating ? "Migrating..." : "Run Migration"}
          </Button>
        </div>

        {isMigrating && progress.total > 0 && (
          <div className='space-y-2'>
            <div className='flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500'>
              <span>Progress</span>
              <span>
                {progress.current} / {progress.total}
              </span>
            </div>
            <div className='h-1.5 w-full overflow-hidden rounded-full bg-zinc-800'>
              <div
                className='h-full bg-orange-500 transition-all duration-300'
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
