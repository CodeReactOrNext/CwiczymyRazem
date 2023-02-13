import Link from "next/link";
import { Form, Formik } from "formik";
import { useTranslation } from "react-i18next";
import { FaUserAlt, FaLock, FaAt, FaArrowLeft } from "react-icons/fa";

import Input from "components/Input";
import Button from "components/Button";
import FormLayout from "layouts/FormLayout";

import { useAppDispatch, useAppSelector } from "store/hooks";
import { selectIsFetching } from "feature/user/store/userSlice";
import {
  createAccount,
  logInViaGoogle,
} from "feature/user/store/userSlice.asyncThunk";
import { signupSchema } from "feature/user/view/SingupView/SignUp.schemas";
import GoogleButton from "components/GoogleButton";

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
  const googleLogInHandler = () => {
    dispatch(logInViaGoogle());
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
              <a className='flex flex-row gap-x-2 font-sans click-behavior'>
                <FaArrowLeft /> {t("signup:back_to_login")}
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
            <div className='flex w-full flex-row items-center '>
              <hr className=' w-full border-second-300 ' />
              <p className='p-2 font-sans text-lg uppercase tracking-wider '>
                {t("common:or")}
              </p>
              <hr className='w-full  border-second-300' />
            </div>
            <GoogleButton onClick={googleLogInHandler}>
              {t("common:google_button.sign_up")}
            </GoogleButton>
          </>
        </FormLayout>
      </Form>
    </Formik>
  );
};

export default SingupView;
