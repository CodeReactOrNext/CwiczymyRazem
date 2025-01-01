import MainContainer from "components/MainContainer";
import { Form } from "formik";

interface ReportFormLayoutProps {
  children: React.ReactNode;
}

const ReportFormLayout = ({ children }: ReportFormLayoutProps) => {
  return (
    <MainContainer title={"Leadboard"}>
      <Form className=' flex flex-col items-center gap-10 py-6 text-mainText'>
        {children}
      </Form>
    </MainContainer>
  );
};

export default ReportFormLayout;
