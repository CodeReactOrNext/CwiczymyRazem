import { cn } from "assets/lib/utils";
import MainContainer from "components/MainContainer";
import { PAGE_CONTENT } from "components/PageShell/PageShell";
import { Form } from "formik";
import { motion } from "framer-motion";

interface ReportFormLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const ReportFormLayout = ({ children, className }: ReportFormLayoutProps) => {
  return (
    <MainContainer noBorder>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}>
        <Form className={cn("mx-auto flex max-w-6xl flex-col gap-6 text-zinc-100 md:gap-8", PAGE_CONTENT, className)}>
          {children}
        </Form>
      </motion.div>
    </MainContainer>
  );
};

export default ReportFormLayout;
