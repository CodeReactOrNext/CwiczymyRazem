import Button from "components/Button";
import { Form, Formik } from "formik";
import { useTranslation } from "react-i18next";
import { signupSchema } from "feature/user/view/SingupView/SignUp.schemas";
import { FaUserAlt, FaLock, FaAt, FaArrowLeft } from "react-icons/fa";
import MainLayout from "layouts/MainLayout";
import FormLayout from "layouts/FormLayout";
import Input from "components/Input";
import { createAccount, selectIsFetching } from "feature/user/store/userSlice";
import { useAppDispatch, useAppSelector } from "store/hooks";
import Link from "next/link";

export interface SignUpCredentials {
  login: string;
  email: string;
  password: string;
  repeat_password: string;
}

const SingupView = () => {
  const { t } = useTranslation(["common", "signup"]);

  const dispatch = useAppDispatch();
  const isFetching = useAppSelector(selectIsFetching) === "createAccount";

  const onSubmit = (credentials: SignUpCredentials) => {
    dispatch(createAccount(credentials));
  };

  const formikInitialValues = {
    login: "",
    email: "",
    password: "",
    repeat_password: "",
  };

  return (
    <Formik
      initialValues={formikInitialValues}
      validationSchema={signupSchema}
      onSubmit={onSubmit}>
      <Form>
        <FormLayout>
          <>
            <Link href='/login'>
              <a className='flex flex-row gap-x-2 click-behavior'>
                <FaArrowLeft /> Back to login
              </a>
            </Link>

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
              <Button loading={isFetching} type='submit'>
                {t("common:button.sign_up")}
              </Button>
            </div>
          </>
        </FormLayout>
      </Form>
    </Formik>
  );
};

export default SingupView;
