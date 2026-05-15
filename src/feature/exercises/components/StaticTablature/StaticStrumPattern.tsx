import type { StrumPattern } from 'feature/exercisePlan/types/exercise.types';

interface StaticStrumPatternProps {
  patterns?: StrumPattern[];
  className?: string;
}

/**
 * Render strumming patterns as visual arrow directions.
 * Example: ↓ ↑ – ↓ ↑ – (down, up, miss pattern)
 */
export const StaticStrumPattern: React.FC<StaticStrumPatternProps> = ({
  patterns,
  className = '',
}) => {
  if (!patterns || patterns.length === 0) {
    return null;
  }

  const directionSymbols: Record<string, string> = {
    down: '↓',
    up: '↑',
    miss: '–',
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {patterns.map((pattern, idx) => (
        <div key={idx} className="space-y-1">
          {pattern.name && (
            <h4 className="text-sm font-semibold text-zinc-300">{pattern.name}</h4>
          )}
          {pattern.chord && (
            <div className="text-xs text-zinc-500">{pattern.chord}</div>
          )}
          <div className="flex gap-2 font-mono text-sm text-zinc-300 font-bold">
            {pattern.strums.map((beat, beatIdx) => (
              <span
                key={beatIdx}
                className={`${
                  beat.muted ? 'text-yellow-500' : ''
                } ${beat.accented ? 'font-black' : ''}`}
              >
                {directionSymbols[beat.direction] || '–'}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
