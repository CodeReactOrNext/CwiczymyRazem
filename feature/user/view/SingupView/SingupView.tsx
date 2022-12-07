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

  function onSubmit() {
    console.log("submitted");
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
                Icon={FaLock}
                placeholder={t("common:input.password")}
                name={"password"}
              />
              <Input
                Icon={FaLock}
                placeholder={t("common:input.repeat_password")}
                name={"repeat_password"}
              />
              <div className='flex space-x-1 '>
                <Button>{t("common:button.sign_up")}</Button>
              </div>
            </>
          </FormLayout>
        </Form>
      </Formik>
    </MainLayout>
  );
};

export default SingupView;
