import { useDispatch } from "react-redux";
import Button from "components/Button";
import { Form, Formik } from "formik";
import { useTranslation } from "react-i18next";
import { signupSchema } from "schemas/signup";
import { FaUserAlt, FaLock, FaAt } from "react-icons/fa";
import MainLayout from "layouts/MainLayout";
import FormLayout from "layouts/FormLayout";
import Input from "components/Input";

const SingupView = () => {
  const { t } = useTranslation(["common", "signup"]);

  const dispatch = useDispatch();

  function onSubmit(formData: {
    login: string;
    email: string;
    password: string;
    repeat_password: string;
  }) {
    console.log(formData);
  }

  const formikInitialValues = {
    login: "",
    email: "",
    password: "",
    repeat_password: "",
  };

  return (
    <MainLayout subtitle={t("signup:subtitlebar_text")} variant='primary'>
      <Formik
        initialValues={formikInitialValues}
        validationSchema={signupSchema}
        onSubmit={onSubmit}>
        <Form>
          <FormLayout>
            <>
              <Input
                Icon={FaUserAlt}
                placeholder={t("common:input.login")}
                name={"login"}
              />
              <Input
                Icon={FaAt}
                placeholder={t("common:input.email")}
                name={"email"}
              />
              <Input
                type='password'
                Icon={FaLock}
                placeholder={t("common:input.password")}
                name={"password"}
              />
              <Input
                type='password'
                Icon={FaLock}
                placeholder={t("common:input.repeat_password")}
                name={"repeat_password"}
              />
              <div className='flex space-x-1 '>
                <Button type='submit'>{t("common:button.sign_up")}</Button>
              </div>
            </>
          </FormLayout>
        </Form>
      </Formik>
    </MainLayout>
  );
};

export default SingupView;
