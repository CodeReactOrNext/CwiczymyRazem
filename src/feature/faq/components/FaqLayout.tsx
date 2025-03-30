import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "assets/components/ui/accordion";
import { Card } from "assets/components/ui/card";
import { HelpCircle } from "lucide-react";

export interface faqQuestionInterface {
  title: string;
  message: string;
}

interface FaqLayoutProps {
  faqQuestions: faqQuestionInterface[];
}

export const FaqLayout = ({ faqQuestions }: FaqLayoutProps) => {
  return (
    <div className='mx-auto w-full max-w-4xl space-y-8 p-4 font-openSans md:p-8'>
      <Card className='rounded-xl border border-border/40 bg-card/80 p-6 shadow-md backdrop-blur-sm'>
        <div className='mb-8 text-center'>
          <div className='mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10'>
            <HelpCircle className='h-10 w-10 text-primary' />
          </div>
          <h1 className='text-4xl font-bold text-foreground/90'>
            Często zadawane pytania
          </h1>
          <p className='mx-auto mt-2 max-w-2xl text-lg text-muted-foreground'>
            Znajdź odpowiedzi na najczęściej zadawane pytania dotyczące naszej
            platformy.
          </p>
        </div>

        <Accordion type='single' collapsible className='w-full space-y-4'>
          {faqQuestions.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className='rounded-md px-3 py-5 text-left text-lg font-medium transition-all hover:bg-muted/30'>
                {faq.title}
              </AccordionTrigger>
              <AccordionContent className='px-3 py-4 text-base text-muted-foreground'>
                <p>{faq.message}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>
    </div>
  );
};

