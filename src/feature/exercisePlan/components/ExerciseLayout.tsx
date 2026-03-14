import type { ReactNode } from "react";

import { PageHeader } from "components/PageHeader/PageHeader";

interface ExerciseLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export const ExerciseLayout = ({
  children,
  title,
  subtitle,
  actions,
  icon,
}: ExerciseLayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="relative z-10 flex-1 py-4 md:py-12">
        <div className="container mx-auto px-3 md:px-0">
          <PageHeader
            title={title}
            subtitle={subtitle}
            actions={actions}
            icon={icon}
          />
          <div className="transition-all">{children}</div>
        </div>
      </main>
    </div>
  );
};
