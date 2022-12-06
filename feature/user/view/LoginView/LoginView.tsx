import Link from "next/link";
import Router from "next/router";
import { useTranslation } from "react-i18next";
import { logInViaGoogle } from "../../store/userSlice";
import { useAppDispatch } from "store/hooks";
import { FaUserAlt, FaLock } from "react-icons/fa";
import MainLayout from "layouts/MainLayout";
import FormLayout from "layouts/FormLayout";
import Button from "components/Button";
import GoogleButton from "components/GoogleButton";
import Input from "components/Input";

import { Formik, Field, Form, ErrorMessage } from "formik";
import * as Yup from "yup";

const LoginView = () => {
  const { t } = useTranslation(["common", "login"]);
  const dispatch = useAppDispatch();

  const googleLogInHandler = () => {
    dispatch(logInViaGoogle());
  };

  return (
    <MainLayout subtitle={t("login:subtitlebar_text")} variant='primary'>
      <FormLayout>
        <>
          <Input Icon={FaUserAlt} placeholder={t("common:input.login")} />
          <Input Icon={FaLock} placeholder={t("common:input.password")} />
          <div className='flex space-x-1 '>
            <Button>{t("common:button.sign_in")}</Button>
            <Link href='/signup'>
              <a>
                <Button variant='secondary'>
                  {t("common:button.sign_up")}
                </Button>
              </a>
            </Link>
          </div>
          <GoogleButton onClick={googleLogInHandler}>
            {t("common:google_button.sign_in")}
          </GoogleButton>
        </>
      </FormLayout>
    </MainLayout>
  );
};

export default LoginView;
