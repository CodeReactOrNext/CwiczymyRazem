import { useId } from 'react';

interface PatternBackgroundProps {
  icon: React.ReactNode;
  strokeClass: string;
  opacity?: number;
}

// Repeats `icon` in a loose diagonal grid as a decorative, low-opacity backdrop.
// Shared by BlogAlert and the blockquote/citation box so both use the same motif.
export const PatternBackground = ({ icon, strokeClass, opacity = 0.08 }: PatternBackgroundProps) => {
  const patternId = useId();
  const tiles: Array<[size: number, x: number, y: number]> = [
    [40, 40, 40],
    [32, 160, 80],
    [36, 80, 160],
    [40, 180, 180]
  ];

  return (
    <svg
      className='pointer-events-none absolute inset-0 h-full w-full rounded-lg'
      style={{ opacity }}
      aria-hidden='true'
    >
      <defs>
        <pattern
          id={patternId}
          x='0'
          y='0'
          width='240'
          height='240'
          patternUnits='userSpaceOnUse'
          patternTransform='rotate(-15)'
        >
          {tiles.map(([size, x, y]) => (
            <g key={`${x}-${y}`} transform={`translate(${x}, ${y})`}>
              <svg
                width={size}
                height={size}
                viewBox='0 0 24 24'
                className={strokeClass}
                strokeWidth='1.5'
                fill='none'
              >
                {icon}
              </svg>
            </g>
          ))}
        </pattern>
      </defs>
      <rect x='0' y='0' width='100%' height='100%' fill={`url(#${patternId})`} />
    </svg>
  );
};
