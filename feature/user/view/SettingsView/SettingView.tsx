import Avatar from "components/Avatar";
import Backdrop from "components/Backdrop";
import Button from "components/Button";
import Input from "components/Input";
import {
  getUserProvider,
  selectIsFetching,
  selectUserAvatar,
  selectUserName,
  updateDisplayName,
  updateUserEmail,
  updateUserPassword,
  uploadUserAvatar,
} from "feature/user/store/userSlice";
import { updateUserInterface as UpdatedUserCredentials } from "feature/user/store/userSlice.types";
import { UserInfo } from "firebase/auth";
import { Form, Formik } from "formik";
import FormLayout from "layouts/FormLayout";
import MainLayout from "layouts/MainLayout";
import React, { useEffect, useState } from "react";
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
  const [avatarInputVisible, setAvatarInputVisible] = useState(false);
  const [nameInputVisible, setNameInputVisible] = useState(false);
  const [emailInputVisible, setEmailInputVisible] = useState(false);
  const [passwordInputVisible, setPasswordInputVisible] = useState(false);

  const [reauthFormVisible, setReauthFormVisible] = useState(false);
  const [userProviderData, setUserProviderData] = useState<UserInfo>();

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [imageUpload, setImageUpload] = useState<Blob>();
  const [avatarIsValid, setAvatarIsValid] = useState(false);

  const isFetching = useAppSelector(selectIsFetching) === "updateData";

  const dispatch = useAppDispatch();
  const userName = useAppSelector(selectUserName);
  const userAvatar = useAppSelector(selectUserAvatar);

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
  const showAvatarInputHandler = () => {
    setAvatarInputVisible(true);
    setNameInputVisible(false);
    setEmailInputVisible(false);
    setPasswordInputVisible(false);
  };
  const showNameInputHandler = () => {
    setNameInputVisible(true);
    setEmailInputVisible(false);
    setPasswordInputVisible(false);
    setAvatarInputVisible(false);
  };
  const showEmailInputHandler = () => {
    setEmailInputVisible(true);
    setNameInputVisible(false);
    setPasswordInputVisible(false);
    setAvatarInputVisible(false);
  };
  const showPasswordInputHandler = () => {
    setPasswordInputVisible(true);
    setEmailInputVisible(false);
    setNameInputVisible(false);
    setAvatarInputVisible(false);
  };

  const formikInitialValues = {
    login: "",
    email: "",
    password: "",
    repeat_password: "",
  };
  const onImageChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      const avatarFile = event.target.files[0];
      setImageUpload(avatarFile);
      const reader = new FileReader();
      reader.readAsDataURL(avatarFile);
      const img = new Image();
      img.src = URL.createObjectURL(avatarFile);
      img.onload = () => {
        if (img.naturalHeight > 250 || img.naturalWidth > 250) {
          setAvatarIsValid(false);
          toast.error("Awatar może mieć maksymalnie 250px na 250px.");
        } else {
          setAvatarIsValid(true);
        }
      };
    }
  };

  return (
    <>
      <MainLayout subtitle='Edytuj Profil' variant='primary'>
        <div className='flex max-w-[800px] flex-col p-6'>
          <div className='flex flex-row gap-2 p-4  text-2xl'>
            <Avatar avatarURL={userAvatar} name={userName!} lvl={28} />
            {avatarInputVisible && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (imageUpload) {
                    dispatch(uploadUserAvatar(imageUpload));
                  }
                }}>
                <div className='flex flex-col'>
                  <input
                    onChange={(event) => {
                      onImageChangeHandler(event);
                    }}
                    type='file'
                    id='avatar'
                    name='avatar'
                    required
                    accept='image/png, image/jpeg'
                  />
                  <p>(250px/250px)</p>
                </div>
                {isFetching ? (
                  <Button type='submit' disabled>
                    <div className='px-3'>
                      <CircleSpinner size={24} />
                    </div>
                  </Button>
                ) : (
                  <Button disabled={!avatarIsValid} type='submit'>
                    Zapisz
                  </Button>
                )}
              </form>
            )}
            {!avatarInputVisible && (
              <button
                onClick={showAvatarInputHandler}
                className='text-lg text-main'>
                Edytuj
              </button>
            )}
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
                        {isFetching ? (
                          <Button type='submit' disabled>
                            <div className='px-3'>
                              <CircleSpinner size={24} />
                            </div>
                          </Button>
                        ) : (
                          <Button
                            disabled={Boolean(!values.login || errors.login)}
                            onClick={() => {
                              changeHandler("login", values.login);
                            }}
                            type='submit'>
                            Zapisz
                          </Button>
                        )}
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
                        {isFetching ? (
                          <Button type='submit' disabled>
                            <div className='px-3'>
                              <CircleSpinner size={24} />
                            </div>
                          </Button>
                        ) : (
                          <Button
                            disabled={Boolean(!values.email || errors.email)}
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
                        )}
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
                        {isFetching ? (
                          <Button type='submit' disabled>
                            <div className='px-3'>
                              <CircleSpinner size={24} />
                            </div>
                          </Button>
                        ) : (
                          <Button
                            disabled={Boolean(
                              !values.password ||
                                errors.password ||
                                !values.repeat_password ||
                                errors.repeat_password
                            )}
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
                        )}
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
