import { PatternBackground } from './PatternBackground';

type AlertType = 'info' | 'warning' | 'tip' | 'important' | 'takeaway';

interface BlogAlertProps {
  type?: AlertType;
  children: React.ReactNode;
}

const config = {
  info: {
    baseClass: 'bg-blue-500/5 text-blue-200',
    textClass: 'text-blue-200',
    strokeClass: 'stroke-blue-400',
    title: 'Note'
  },
  warning: {
    baseClass: 'bg-amber-500/5 text-amber-200',
    textClass: 'text-amber-200',
    strokeClass: 'stroke-amber-400',
    title: 'Warning'
  },
  tip: {
    baseClass: 'bg-emerald-500/5 text-emerald-200',
    textClass: 'text-emerald-200',
    strokeClass: 'stroke-emerald-400',
    title: 'Tip'
  },
  important: {
    baseClass: 'bg-purple-500/5 text-purple-200',
    textClass: 'text-purple-200',
    strokeClass: 'stroke-violet-400',
    title: 'Important'
  },
  takeaway: {
    baseClass: 'bg-rose-500/5 text-rose-200',
    textClass: 'text-rose-200',
    strokeClass: 'stroke-rose-400',
    title: 'Takeaway'
  }
};

const ICONS: Record<AlertType, React.ReactNode> = {
  info: (
    <g>
      <circle cx='12' cy='12' r='10' />
      <path d='M12 16v-4M12 8h.01' />
    </g>
  ),
  warning: (
    <g>
      <path d='M12 2L2 20h20L12 2M12 9v4M12 17h.01' />
    </g>
  ),
  tip: (
    <g>
      <path d='M15 14c1.66-1.66 2.5-2.5 2.5-4C17.5 9.1 15.9 7.5 14 7.5S10.5 9.1 10.5 10c0 1.5.84 2.34 2.5 4m-5 4h8m-4 6a6 6 0 1 1 0-12 6 6 0 0 1 0 12' />
    </g>
  ),
  important: (
    <g>
      <path d='M13 2L3 14h9l-1 8 10-12h-9l1-8z' />
    </g>
  ),
  takeaway: (
    <g>
      <path d='M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' />
    </g>
  )
};

export const BlogAlert = ({ type = 'info', children }: BlogAlertProps) => {
  const { baseClass, textClass, strokeClass, title } = config[type];

  return (
    <div className={`relative my-8 overflow-hidden rounded-lg p-8 ${baseClass}`}>
      <PatternBackground icon={ICONS[type]} strokeClass={strokeClass} />
      <div className='relative'>
        <div className={`mb-2 text-sm font-bold tracking-wider ${textClass}`}>
          {title}
        </div>
        <div className='text-sm leading-relaxed'>{children}</div>
      </div>
    </div>
  );
};
