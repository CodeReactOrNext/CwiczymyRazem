import type { faqQuestionInterface } from "feature/faq/components/FaqLayout";
import { FaqSection } from "feature/landing/components/FaqSection";

interface LibraryFaqSectionProps {
  questions: faqQuestionInterface[];
}

export const LibraryFaqSection = ({ questions }: LibraryFaqSectionProps) => {
  return (
    <FaqSection
      questions={questions}
      moreLink={{
        intro:
          "Questions about the app rather than the library — points, streaks, note detection or what any of it costs — are answered on",
        href: "/faq",
        label: "the frequently asked questions page",
      }}
    />
  );
};
