import Avatar from "components/Avatar";
import Backdrop from "components/Backdrop";
import Button from "components/Button";
import Input from "components/Input";
import {
  getUserProvider,
  selectIsFetching,
  updateDisplayName,
  updateUserEmail,
  updateUserPassword,
} from "feature/user/store/userSlice";
import { updateUserInterface as UpdatedUserCredentials } from "feature/user/store/userSlice.types";
import { UserInfo } from "firebase/auth";
import { Form, Formik } from "formik";
import FormLayout from "layouts/FormLayout";
import MainLayout from "layouts/MainLayout";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaAt, FaLock, FaUserAlt } from "react-icons/fa";
import { CircleSpinner } from "react-spinners-kit";
import { toast } from "react-toastify";
import { loginSchema } from "feature/user/view/LoginView/Login.schemas";
import { updateCredsSchema } from "feature/user/view/SettingsView/Settings.schemas";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { SignUpCredentials as SignUpCredentials } from "../SingupView/SingupView";

const SettingsView = () => {
  const { t } = useTranslation(["common", "settings"]);
  const [nameInputVisible, setNameInputVisible] = useState(false);
  const [emailInputVisible, setEmailInputVisible] = useState(false);
  const [passwordInputVisible, setPasswordInputVisible] = useState(false);

  const [reauthFormVisible, setReauthFormVisible] = useState(false);
  const [userProviderData, setUserProviderData] = useState<UserInfo>();

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const isFetching = useAppSelector(selectIsFetching) === "updateData";

  const dispatch = useAppDispatch();
  const userName = useAppSelector((state) => state.user.userInfo?.displayName);

  useEffect(() => {
    dispatch(getUserProvider()).then((data) => {
      setUserProviderData(data.payload as UserInfo);
    });
  }, [dispatch, newEmail]);

  const changeNameHandler = (name: string) => {
    dispatch(updateDisplayName({ login: name } as SignUpCredentials));
  };

  const changeCredentialsHandler = async (data: UpdatedUserCredentials) => {
    if (data.newEmail) {
      await dispatch(updateUserEmail(data)).then(() => {
        setNewEmail("");
        setReauthFormVisible(false);
        setEmailInputVisible(false);
      });
    }
    if (data.newPassword) {
      await dispatch(updateUserPassword(data)).then(() => {
        setNewPassword("");
        setReauthFormVisible(false);
        setPasswordInputVisible(false);
      });
    }
  };

  const changeHandler = (name: "login" | "email", data: string) => {
    console.log("Button is clicked", name);
    if (name === "login") changeNameHandler(data);
    if (name === "email") setReauthFormVisible(true);
  };
  const showNameInputHandler = () => {
    setNameInputVisible(true);
    setEmailInputVisible(false);
    setPasswordInputVisible(false);
  };
  const showEmailInputHandler = () => {
    setEmailInputVisible(true);
    setNameInputVisible(false);
    setPasswordInputVisible(false);
  };
  const showPasswordInputHandler = () => {
    setPasswordInputVisible(true);
    setEmailInputVisible(false);
    setNameInputVisible(false);
  };

  const formikInitialValues = {
    login: "",
    email: "",
    password: "",
    repeat_password: "",
  };

  return (
    <>
      <MainLayout subtitle='Edytuj Profil' variant='primary'>
        <div className='flex max-w-[800px] flex-col p-6'>
          <div className='flex flex-row gap-2 p-4  text-2xl'>
            <Avatar name={userName!} lvl={28} />
            <button className='text-lg text-main'>Edytuj</button>
          </div>
          <hr className='border-main-opposed-400' />
          <Formik
            initialValues={formikInitialValues}
            validationSchema={updateCredsSchema}
            onSubmit={() => {}}>
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
                            if (values.email && !errors.email) {
                              setNewEmail(values.email);
                              toast.info(
                                "Do zmiany danych musisz się ponownie zalogować."
                              );
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
                        <button
                          onClick={showPasswordInputHandler}
                          type='button'
                          className='text-lg text-main'>
                          Edytuj
                        </button>
                      ) : (
                        "Zalogowano z Google"
                      )}
                    </div>
                    {passwordInputVisible && (
                      <div className='flex h-full w-full gap-2 pb-5'>
                        <Input
                          Icon={FaUserAlt}
                          placeholder={"Nowe hasło"}
                          name={"password"}
                          type='password'
                        />
                        <Input
                          Icon={FaUserAlt}
                          placeholder={"Powtórz nowe hasło"}
                          name={"repeat_password"}
                          type='password'
                        />
                        <Button
                          onClick={() => {
                            if (
                              values.password &&
                              !errors.password &&
                              values.repeat_password &&
                              !errors.repeat_password
                            ) {
                              setNewPassword(values.password);
                              toast.info(
                                "Do zmiany danych musisz się ponownie zalogować."
                              );
                              setReauthFormVisible(true);
                            }
                          }}
                          type='submit'>
                          Zapisz
                        </Button>
                      </div>
                    )}
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
                  onSubmit={(data) => {
                    changeCredentialsHandler({
                      ...data,
                      newEmail,
                      newPassword,
                    });
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
                          {isFetching ? (
                            <Button type='submit' disabled>
                              <div className='px-3'>
                                <CircleSpinner size={24} />
                              </div>
                            </Button>
                          ) : (
                            <Button type='submit'>
                              {t("common:button.sign_in")}
                            </Button>
                          )}
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
