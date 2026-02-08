import React from 'react';
import { Info, AlertTriangle, Lightbulb, Zap } from 'lucide-react';

type AlertType = 'info' | 'warning' | 'tip' | 'important';

interface BlogAlertProps {
  type?: AlertType;
  children: React.ReactNode;
}

const config = {
  info: {
    icon: Info,
    baseClass: 'border-blue-500/30 bg-blue-500/5 text-blue-200',
    iconClass: 'text-blue-400',
    title: 'Note'
  },
  warning: {
    icon: AlertTriangle,
    baseClass: 'border-amber-500/30 bg-amber-500/5 text-amber-200',
    iconClass: 'text-amber-400',
    title: 'Warning'
  },
  tip: {
    icon: Lightbulb,
    baseClass: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-200',
    iconClass: 'text-emerald-400',
    title: 'Tip'
  },
  important: {
    icon: Zap,
    baseClass: 'border-purple-500/30 bg-purple-500/5 text-purple-200',
    iconClass: 'text-purple-400',
    title: 'Important'
  }
};

export const BlogAlert = ({ type = 'info', children }: BlogAlertProps) => {
  const { icon: Icon, baseClass, iconClass, title } = config[type];

  return (
    <div className={`my-8 flex gap-4 rounded-lg border p-4 ${baseClass}`}>
      <div className="mt-0.5 shrink-0">
        <Icon className={`h-5 w-5 ${iconClass}`} />
      </div>
      <div>
        <div className={`mb-1 text-sm font-bold tracking-wider ${iconClass}`}>
          {title}
        </div>
        <div className="text-sm leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
};
