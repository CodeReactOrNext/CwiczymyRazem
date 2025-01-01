import Link from "next/link";
import { Formik, Form } from "formik";
import { FaAt, FaLock } from "react-icons/fa";
import { useTranslation } from "react-i18next";

import FormLayout from "layouts/FormLayout";
import { Input, GoogleButton } from "components/UI";

import { useAppDispatch, useAppSelector } from "store/hooks";
import { selectIsFetching } from "feature/user/store/userSlice";
import { loginSchema } from "feature/user/view/LoginView/Login.schemas";
import {
  logInViaEmail,
  logInViaGoogle,
} from "feature/user/store/userSlice.asyncThunk";
import { Button } from "assets/components/ui/button";
import { Loader2 } from "lucide-react";

export interface logInCredentials {
  email: string;
  password: string;
}

const LoginView = () => {
  const { t } = useTranslation(["common", "login"]);
  const dispatch = useAppDispatch();

  const googleLogInHandler = () => {
    dispatch(logInViaGoogle());
  };

  const isFetching = useAppSelector(selectIsFetching) === "email";

  function onSubmit(credentials: logInCredentials) {
    dispatch(logInViaEmail(credentials));
  }

  const formikInitialValues = {
    email: "",
    password: "",
  };

  return (
    <Formik
      initialValues={formikInitialValues}
      validationSchema={loginSchema}
      onSubmit={onSubmit}>
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
              <Button size='lg' type='submit'>
                {isFetching && <Loader2 className='animate-spin' />}
                {t("common:button.sign_in")}
              </Button>
              <Link href='/signup'>
                <Button variant='secondary' size='lg'>
                  {t("common:button.sign_up")}
                </Button>
              </Link>
            </div>
            <GoogleButton onClick={googleLogInHandler}>
              {t("common:google_button.sign_in")}
            </GoogleButton>
          </>
        </FormLayout>
      </Form>
    </Formik>
  );
};

export default LoginView;
