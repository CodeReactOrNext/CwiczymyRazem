import { Form } from "formik";

interface ReportFormLayoutProps {
  children: React.ReactNode;
}

const ReportFormLayout = ({ children }: ReportFormLayoutProps) => {
  return (
    <Form className='flex flex-col items-center gap-10 text-mainText'>
      {children}
    </Form>
  );
};

export default ReportFormLayout;
