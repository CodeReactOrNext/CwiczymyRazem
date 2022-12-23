import Avatar from "components/Avatar";
import Backdrop from "components/Backdrop";
import Button from "components/Button";
import GoogleButton from "components/GoogleButton";
import Input from "components/Input";
import OldEffect from "components/OldEffect";
import {
  getUserProvider,
  reauthenticateUser,
  selectIsFetching,
  selectUserAuth,
  selectUserData,
  updateDisplayName,
  updateUserEmail,
} from "feature/user/store/userSlice";
import { UserInfo } from "firebase/auth";
import { Form, Formik } from "formik";
import FormLayout from "layouts/FormLayout";
import MainLayout from "layouts/MainLayout";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaAt, FaLock, FaUserAlt } from "react-icons/fa";
import { CircleSpinner } from "react-spinners-kit";
import { loginSchema } from "schemas/login";
import { updateCredsSchema } from "schemas/updateCreds";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { signUpCredentials } from "../SingupView/SingupView";

const SettingsView = () => {
  const { t } = useTranslation(["common", "settings"]);
  const [nameInputVisible, setNameInputVisible] = useState(false);
  const [emailInputVisible, setEmailInputVisible] = useState(false);
  const [reauthFormVisible, setReauthFormVisible] = useState(false);
  const [userProviderData, setUserProviderData] = useState<UserInfo>();

  const isFetching = useAppSelector(selectIsFetching) === "updateData";

  const dispatch = useAppDispatch();
  const userName = useAppSelector((state) => state.user.userInfo?.displayName);

  useEffect(() => {
    dispatch(getUserProvider()).then((data) => {
      setUserProviderData(data.payload as UserInfo);
    });
  }, [dispatch]);

  const changeNameHandler = (name: string) => {
    dispatch(updateDisplayName({ login: name } as signUpCredentials));
  };
  const changeEmailHandler = (email: string) => {
    // dispatch(reauthenticateUser({ email } as signUpCredentials));
    setReauthFormVisible(true);
  };

  const changeHandler = (name: "login" | "email", data: string) => {
    console.log("Button is clicked", name);

    if (name === "login") changeNameHandler(data);
    if (name === "email") changeEmailHandler(data);
  };
  const showNameInputHandler = () => {
    setNameInputVisible(true);
    setEmailInputVisible(false);
  };
  const showEmailInputHandler = () => {
    setEmailInputVisible(true);
    setNameInputVisible(false);
  };

  const formikInitialValues = {
    login: "",
    email: "",
    password: "",
    repeat_password: "",
  };

  const onSubmit = (data: signUpCredentials) => {
    // if (data.login && data.login.length > 0) {
    //   changeNameHandler(data.login);
    // }
    // if (data.email && data.login.length > 0) {
    //   changeEmailHandler(data.email);
    // }
  };

  return (
    <>
      <MainLayout subtitle='Edytuj Profil' variant='primary'>
        <div className='flex max-w-[800px] flex-col p-6'>
          <div className='flex flex-row gap-2 p-4  text-2xl'>
            <Avatar name='Dummy name' lvl={28} />
            <button className='text-lg text-main'>Edytuj</button>
          </div>
          <hr className='border-main-opposed-400' />
          <Formik
            initialValues={formikInitialValues}
            validationSchema={updateCredsSchema}
            onSubmit={onSubmit}>
            {({ values, errors }) => (
              <Form>
                <>
                  <div className='flex flex-col'>
                    <div className='flex flex-row gap-2 p-4 text-2xl'>
                      <p className='text-tertiary'>Nick:</p>
                      <p>{userName}</p>
                      {!nameInputVisible && (
                        <button
                          type='button'
                          onClick={showNameInputHandler}
                          className='text-lg text-main'>
                          Edytuj
                        </button>
                      )}
                    </div>
                    {nameInputVisible && (
                      <div className='flex h-full w-full gap-2 pb-5'>
                        <Input
                          Icon={FaUserAlt}
                          placeholder={"Nowy nick"}
                          name={"login"}
                        />
                        <Button
                          onClick={() => {
                            changeHandler("login", values.login);
                          }}
                          type='submit'>
                          Zapisz
                        </Button>
                      </div>
                    )}
                  </div>
                  <>
                    <hr className='border-main-opposed-400' />
                    <div className='flex flex-row gap-2 p-4 text-2xl'>
                      <p className='text-tertiary'>E-mail:</p>
                      <p>{userProviderData?.email}</p>
                      {userProviderData?.providerId !== "google.com" ? (
                        <button
                          type='button'
                          onClick={showEmailInputHandler}
                          className='text-lg text-main'>
                          Edytuj
                        </button>
                      ) : (
                        "Zalogowano z Google"
                      )}
                    </div>
                    {emailInputVisible && (
                      <div className='flex h-full w-full gap-2 pb-5'>
                        <Input
                          Icon={FaUserAlt}
                          placeholder={"Nowy email"}
                          name={"email"}
                        />
                        <Button
                          onClick={() => {
                            // changeHandler("email", values.email);
                            if (values.email && !errors.email) {
                              setReauthFormVisible(true);
                            }
                          }}
                          type='submit'>
                          Zapisz
                        </Button>
                      </div>
                    )}
                    <hr className='border-main-opposed-400' />
                    <div className='flex  flex-row gap-2 p-4 text-2xl'>
                      <p className='text-tertiary'>Hasło</p>
                      {userProviderData?.providerId !== "google.com" ? (
                        <button type='button' className='text-lg text-main'>
                          Edytuj
                        </button>
                      ) : (
                        "Zalogowano z Google"
                      )}
                    </div>
                  </>
                </>
              </Form>
            )}
          </Formik>
          <hr className='border-main-opposed-400' />
          <div className='flex flex-col gap-2  p-4 text-2xl'>
            <p className='text-tertiary'>Restart Statystyk</p>
            <p className='text-lg'>
              Uwaga. Wciśnięcie tego spowoduje restart wszystkich twoich
              statystyk.
            </p>
            <button className='text-lg text-main'>Restartuj</button>
          </div>
          <hr className='border-main-opposed-400' />
          <div className='flex flex-col gap-2 p-4 text-2xl'>
            <p className='text-tertiary'>Anonimowość </p>
            <p className='text-lg'>
              Czy chcesz aby twój nick pozostał anonimowy w ledbordzie?
            </p>
          </div>
        </div>
      </MainLayout>
      {reauthFormVisible && (
        <Backdrop
          onClick={() => {
            setReauthFormVisible(false);
          }}
          selector='overlays'>
          <>
            <div className='flex items-center justify-center'>
              <div className='bg-second-500 p-20'>
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
                          <Button type='submit'>
                            {isFetching ? (
                              <div className='px-3'>
                                <CircleSpinner size={24} />
                              </div>
                            ) : (
                              t("common:button.sign_in")
                            )}
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
      )}
    </>
  );
};

export default SettingsView;
