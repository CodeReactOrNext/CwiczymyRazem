import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import type { LocalizedContent } from "../../types/exercise.types";

interface ExerciseLayoutProps {
  children: ReactNode;
  title: string | LocalizedContent;
  actions?: ReactNode;
  showBreadcrumbs?: boolean;
}

export const ExerciseLayout = ({
  children,
  title,
  actions,
}: ExerciseLayoutProps) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language as "pl" | "en";

  const getLocalizedContent = (content: string | LocalizedContent): string => {
    if (typeof content === "string") {
      return content;
    }
    return content[currentLang] || content.pl;
  };

  return (
    <div className='flex min-h-screen flex-col'>
      <header className='border-b '>
        <div className='container py-4'>
          <div className='flex items-center justify-between'>
            <h1 className='text-xl font-semibold'>
              {getLocalizedContent(title)}
            </h1>

            <div className='flex items-center gap-3'>{actions}</div>
          </div>
        </div>
      </header>

      <main className='container flex-1 py-6'>{children}</main>
    </div>
  );
};
