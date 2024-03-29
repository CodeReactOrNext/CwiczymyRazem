import { Form, Formik } from "formik";
import { toast } from "react-toastify";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "store/hooks";

import { Input, Button } from "components/UI";
import ReauthForm from "../ReauthForm";

import { selectIsFetching } from "feature/user/store/userSlice";
import { updateUserPassword } from "feature/user/store/userSlice.asyncThunk";
import { updateCredsSchema } from "feature/user/view/SettingsView/Settings.schemas";
import { updateUserInterface as UpdatedUserCredentials } from "types/api.types";

const PasswordChangeView = () => {
  const { t } = useTranslation(["common", "toast", "settings"]);
  const [newPassword, setNewPassword] = useState("");
  const [reauthFormVisible, setReauthFormVisible] = useState(false);

  const formikInitialValues = {
    login: "",
    email: "",
    password: "",
    repeat_password: "",
  };

  const isFetching = useAppSelector(selectIsFetching) === "updateData";
  const dispatch = useAppDispatch();

  const changeCredentialsHandler = async (data: UpdatedUserCredentials) => {
    const updateData = {
      ...data,
      newPassword,
    };
    if (updateData.newPassword) {
      await dispatch(updateUserPassword(updateData)).then(() => {
        setNewPassword("");
        setReauthFormVisible(false);
      });
    }
  };

  return (
    <>
      <Formik
        initialValues={formikInitialValues}
        validationSchema={updateCredsSchema}
        onSubmit={(values) => {
          if (values.password && values.repeat_password) {
            setNewPassword(values.password);
            toast.info(t("toast:info.log_in_again"));
            setReauthFormVisible(true);
          }
        }}>
        {({ values, errors }) => (
          <Form>
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
                type='submit'>
                {t("settings:save")}
              </Button>
            </div>
          </Form>
        )}
      </Formik>

      {reauthFormVisible && (
        <ReauthForm
          closeBackdrop={() => setReauthFormVisible(false)}
          changeCredentialsHandler={changeCredentialsHandler}
        />
      )}
    </>
  );
};

export default PasswordChangeView;
