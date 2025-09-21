import MainContainer from "components/MainContainer";
import { Form } from "formik";
import { motion } from "framer-motion";

interface ReportFormLayoutProps {
  children: React.ReactNode;
}

const ReportFormLayout = ({ children }: ReportFormLayoutProps) => {
  return (
    <MainContainer title={"Report"}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}>
        <Form className='mx-auto flex max-w-6xl flex-col gap-6 p-4 py-5 text-white sm:p-5 md:gap-8'>
          {children}
        </Form>
      </motion.div>
    </MainContainer>
  );
};

export default ReportFormLayout;
