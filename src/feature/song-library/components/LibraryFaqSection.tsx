import type { faqQuestionInterface } from "feature/faq/components/FaqLayout";
import { FaqSection } from "feature/landing/components/FaqSection";

interface LibraryFaqSectionProps {
  questions: faqQuestionInterface[];
}

export const LibraryFaqSection = ({ questions }: LibraryFaqSectionProps) => {
  return <FaqSection questions={questions} />;
};
