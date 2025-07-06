import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "assets/components/ui/accordion";
import { Card } from "assets/components/ui/card";
import { HelpCircle } from "lucide-react";
import { useTranslation } from "next-i18next";

export interface faqQuestionInterface {
  title: string;
  message: string;
}

interface FaqLayoutProps {
  faqQuestions: faqQuestionInterface[];
}

export const FaqLayout = ({ faqQuestions }: FaqLayoutProps) => {
  const { t } = useTranslation("faq");

  return (
    <div className='mx-auto w-full max-w-4xl space-y-8 p-4 font-openSans md:p-8'>
      <Card className='rounded-xl border border-border/40 bg-card/80 p-6 shadow-md backdrop-blur-sm'>
        <div className='mb-8 text-center'>
          <div className='mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10'>
            <HelpCircle className='h-10 w-10 text-primary' />
          </div>
          <h1 className='text-xl font-bold text-foreground/90 md:text-4xl'>
            {t("faq")}
          </h1>
        </div>

        <Accordion type='single' collapsible className='w-full space-y-4'>
          {faqQuestions.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className='rounded-md px-3 py-4 text-left text-base font-medium transition-all hover:bg-muted/30 md:py-5 md:text-lg'>
                {faq.title}
              </AccordionTrigger>
              <AccordionContent className='px-3 py-3 text-sm text-muted-foreground md:py-4 md:text-base'>
                <p>{faq.message}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>
    </div>
  );
};
