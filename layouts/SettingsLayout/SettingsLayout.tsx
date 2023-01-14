import Avatar from "components/Avatar";
import Backdrop from "components/Backdrop";
import Button from "components/Button";
import Input from "components/Input";
import {
  selectIsFetching,
  selectUserAvatar,
  selectUserName,
} from "feature/user/store/userSlice";
import {
  getUserProvider,
  restartUserStats,
  changeUserDisplayName,
  updateUserEmail,
  updateUserPassword,
  uploadUserAvatar,
} from "feature/user/store/userSlice.asyncThunk";

import { updateUserInterface as UpdatedUserCredentials } from "feature/user/store/userSlice.types";
import { UserInfo } from "firebase/auth";
import { Form, Formik } from "formik";
import FormLayout from "layouts/FormLayout";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaAt, FaLock } from "react-icons/fa";
import { toast } from "react-toastify";
import { loginSchema } from "feature/user/view/LoginView/Login.schemas";
import { updateCredsSchema } from "feature/user/view/SettingsView/Settings.schemas";
import { useAppDispatch, useAppSelector } from "store/hooks";
import Divider from "./components/Divider";
import FieldBox from "./components/FieldBox";

const SettingsLayout = () => {
  const { t } = useTranslation(["common", "settings", "toast"]);

  const [reauthFormVisible, setReauthFormVisible] = useState(false);
  const [userProviderData, setUserProviderData] = useState<UserInfo>();

  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [imageUpload, setImageUpload] = useState<Blob>();
  const [avatarIsValid, setAvatarIsValid] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>();

  const [restartConfirmShow, setRestartConfirmShow] = useState(false);

  const isFetching = useAppSelector(selectIsFetching) === "updateData";

  const dispatch = useAppDispatch();
  const userName = useAppSelector(selectUserName);
  const userAvatar = useAppSelector(selectUserAvatar);
  const isViaGoogle = userProviderData?.providerId !== "google.com";

  useEffect(() => {
    dispatch(getUserProvider()).then((data) => {
      setUserProviderData(data.payload as UserInfo);
    });
  }, [dispatch, newEmail]);

  const changeNameHandler = (name: string) => {
    dispatch(changeUserDisplayName(name));
  };

  const changeCredentialsHandler = async (data: UpdatedUserCredentials) => {
    if (data.newEmail) {
      await dispatch(updateUserEmail(data)).then(() => {
        setNewEmail("");
        setReauthFormVisible(false);
      });
    }
    if (data.newPassword) {
      await dispatch(updateUserPassword(data)).then(() => {
        setNewPassword("");
        setReauthFormVisible(false);
      });
    }
  };

  const changeHandler = (name: string, data: string) => {
    if (name === "login") changeNameHandler(data);
    if (name === "email") setReauthFormVisible(true);
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
      if (avatarFile.type !== "image/png" && avatarFile.type !== "image/jpeg") {
        toast.error(t("toast:errors.wrong_file_type"));
        return;
      } else {
        setImageUpload(avatarFile);
        const reader = new FileReader();
        reader.readAsDataURL(avatarFile);
        const img = new Image();
        img.src = URL.createObjectURL(avatarFile);
        img.onload = () => {
          if (img.naturalHeight > 250 || img.naturalWidth > 250) {
            setAvatarIsValid(false);
            toast.error(t("toast:errors.avatar_max"));
          } else {
            setAvatarPreview(img.src);
            setAvatarIsValid(true);
          }
        };
      }
    }
  };

  return (
    <>
      <div className='m-auto flex w-full flex-col bg-main-opposed-400 p-4 sm:w-[640px] '>
        <div className='flex flex-row justify-around gap-2 p-2 text-2xl'>
          <div>
            <Avatar
              avatarURL={avatarPreview ? avatarPreview : userAvatar}
              name={userName!}
            />
          </div>

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
                className='text-base'
              />
              <p className='text-base '>{t("settings:resolution_info")}</p>
            </div>
            <Button
              disabled={!avatarIsValid}
              variant='small'
              type='submit'
              loading={isFetching}>
              {t("settings:save")}
            </Button>
          </form>
        </div>
        <Divider />
        <Formik
          initialValues={formikInitialValues}
          validationSchema={updateCredsSchema}
          onSubmit={() => {}}>
          {({ values, errors }) => (
            <Form>
              <FieldBox
                title={t("settings:nickname")}
                submitHandler={() => {
                  changeHandler("login", values.login);
                }}
                errors={errors}
                values={values}
                inputName={"login"}
                isFetching={isFetching}
                value={userName}
              />
              <Divider />
              {isViaGoogle ? (
                <>
                  <FieldBox
                    title={"Email"}
                    submitHandler={() => {
                      if (values.email && !errors.email) {
                        setNewEmail(values.email);
                        toast.info(t("toast:info.log_in_again"));
                        setReauthFormVisible(true);
                      }
                    }}
                    errors={errors}
                    values={values}
                    inputName={"email"}
                    isFetching={isFetching}
                    value={userProviderData?.email}
                  />
                  )
                  <Divider />
                  <div className='flex  flex-row gap-2 p-4 text-2xl'>
                    <p className='text-tertiary'>{t("settings:password")}</p>
                  </div>
                  <div className='flex h-full w-full flex-col items-center gap-4 pb-5'>
                    <Input
                      placeholder={t("settings:new_password")}
                      name='password'
                      type='password'
                    />
                    <Input
                      placeholder={t("settings:repeat_new_password")}
                      name='repeat_password'
                      type='password'
                    />
                    <Button
                      variant='small'
                      loading={isFetching}
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
                          toast.info(t("toast:info.log_in_again"));
                          setReauthFormVisible(true);
                        }
                      }}
                      type='submit'>
                      {t("settings:save")}
                    </Button>
                  </div>
                </>
              ) : (
                <p className='p-5'>{t("settings:logged_in_via_google")}</p>
              )}
            </Form>
          )}
        </Formik>
        <Divider />
        <div className='flex flex-col gap-2  p-4 text-2xl'>
          <p className='text-tertiary'>{t("settings:reset_stats")}</p>
          {!restartConfirmShow && (
            <>
              <p className='text-lg'>{t("settings:reset_warning")}</p>
              <Button
                variant='small'
                onClick={() => setRestartConfirmShow(true)}>
                {t("settings:reset")}
              </Button>
            </>
          )}
          {restartConfirmShow && (
            <>
              <p className=' text-lg'>{t("settings:reset_approve_info")}</p>
              <div className='flex flex-row justify-center gap-3'>
                <Button
                  variant='small'
                  loading={isFetching}
                  onClick={() => dispatch(restartUserStats())}>
                  {t("settings:reset")}
                </Button>
                <Button
                  variant='small'
                  onClick={() => setRestartConfirmShow(false)}>
                  {t("settings:back")}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

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
                          <Button loading={isFetching} type='submit'>
                            {t("common:button.sign_in")}
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

export default SettingsLayout;
