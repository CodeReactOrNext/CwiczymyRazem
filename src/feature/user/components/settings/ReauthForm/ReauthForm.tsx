import { Form, Formik } from "formik";
import { useAppSelector } from "store/hooks";
import { FaAt, FaLock } from "react-icons/fa";
import { useTranslation } from "react-i18next";

import Input from "components/UI/Input";
import Button from "components/UI/Button";
import Backdrop from "components/Backdrop";
import FormLayout from "layouts/FormLayout";

import { selectIsFetching } from "feature/user/store/userSlice";
import { loginSchema } from "feature/user/view/LoginView/Login.schemas";
import { updateUserInterface as UpdatedUserCredentials } from "types/api.types";

interface ReauthFormInteface {
  changeCredentialsHandler: (data: UpdatedUserCredentials) => Promise<void>;
  closeBackdrop: () => void;
}
const ReauthForm = ({
  changeCredentialsHandler,
  closeBackdrop,
}: ReauthFormInteface) => {
  const { t } = useTranslation(["common", "toast", "settings"]);
  const formikInitialValues = {
    login: "",
    email: "",
    password: "",
    repeat_password: "",
  };
  const isFetching = useAppSelector(selectIsFetching) === "updateData";

  return (
    <Backdrop
      onClick={() => {
        closeBackdrop();
      }}
      selector='overlays'>
      <>
        <div className='flex items-center justify-center'>
          <div className='bg-second-500 p-20'>
            <Formik
              initialValues={formikInitialValues}
              validationSchema={loginSchema}
              onSubmit={(data) => {
                changeCredentialsHandler(data);
              }}>
              <Form>
                <FormLayout>
                  <>
                    <Input
                      name='email'
                      Icon={FaAt}
                      placeholder={t("common:input.email")}
                    />
                    <Input
                      name='password'
                      type='password'
                      Icon={FaLock}
                      placeholder={t("common:input.password")}
                    />
                    <div className='flex space-x-1 '>
                      <Button loading={isFetching} type='submit'>
                        {t("common:button.sign_in")}
                      </Button>
                    </div>
                  </>
                </FormLayout>
              </Form>
            </Formik>
          </div>
        </div>
      </>
    </Backdrop>
  );
};

export default ReauthForm;
