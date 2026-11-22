import { PageTitle } from "components/PageTitle/PageTitle";
import type { ReactNode } from "react";

interface ExerciseLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export const ExerciseLayout = ({
  children,
  title,
  subtitle,
  actions,
}: ExerciseLayoutProps) => {
  return (
    <div className="flex flex-col">
      <main className="relative z-10 flex-1 py-4 md:py-12">
        <div className="container mx-auto px-3 md:px-0">
          <PageTitle
            title={title}
            subtitle={subtitle}
            actions={actions}
            className='mb-8'
          />
          <div className="transition-all">{children}</div>
        </div>
      </main>
    </div>
  );
};
