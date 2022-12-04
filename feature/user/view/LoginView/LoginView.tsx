import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import Button from "components/Button";
import Input from "components/Input";
import MainLayout from "layouts/MainLayout";
import {
  createUserDocumentFromAuth,
  signInWithGooglePopup,
} from "utils/firebase/firebase.utils";
import { addUserAuth, addUserData } from "../../store/userSlice";
import { FaUserAlt, FaLock } from "react-icons/fa";
import GoogleButton from "components/GoogleButton";
import FormLayout from "layouts/FormLayout";
import Link from "next/link";
import Router from "next/router";
import { useAppDispatch, useAppSelector } from "store/hooks";

const LoginView = () => {
  const { t } = useTranslation(["common", "login"]);
  const dispatch = useAppDispatch();

  const logGoogleUser = async () => {
    const { user } = await signInWithGooglePopup();
    dispatch(addUserData(user));
    const userAuth = await createUserDocumentFromAuth(user);
    dispatch(addUserAuth(userAuth));
    Router.push("/landing");
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
          <GoogleButton onClick={logGoogleUser}>
            {t("common:google_button.sign_in")}
          </GoogleButton>
        </>
      </FormLayout>
    </MainLayout>
  );
};

export default LoginView;
