import { Formik } from "formik";
import { UserInfo } from "firebase/auth";
import { useTranslation } from "react-i18next";
import React, { useEffect, useState } from "react";

import { Divider } from "components/UI";
import SettingsLayout from "layouts/SettingsLayout";
import FieldBox from "layouts/SettingsLayout/components/FieldBox";
import EmailChange from "feature/user/components/settings/EmailChange";
import AvatarChange from "feature/user/components/settings/AvatarChange";
import PasswordChange from "feature/user/components/settings/PasswordChange";
import StatisticRestart from "feature/user/components/settings/StatisticsRestart";
import MediaLinks from "feature/user/components/settings/MediaLinks";

import { useAppDispatch, useAppSelector } from "store/hooks";
import { selectIsFetching, selectUserName } from "feature/user/store/userSlice";
import { updateCredsSchema } from "feature/user/view/SettingsView/Settings.schemas";
import {
  getUserProvider,
  changeUserDisplayName,
} from "feature/user/store/userSlice.asyncThunk";

const SettingsView = () => {
  const { t } = useTranslation(["common", "settings", "toast"]);

  const [userProviderData, setUserProviderData] = useState<UserInfo>();
  const isFetching = useAppSelector(selectIsFetching) === "updateData";
  const dispatch = useAppDispatch();
  const userName = useAppSelector(selectUserName);

  const formikInitialValues = {
    login: "",
    email: "",
    password: "",
    repeat_password: "",
  };

  const isViaGoogle = userProviderData?.providerId !== "google.com";

  const changeNameHandler = (name: string) => {
    dispatch(changeUserDisplayName(name));
  };

  const changeHandler = (name: string, data: string) => {
    if (name === "login") changeNameHandler(data);
  };

  useEffect(() => {
    dispatch(getUserProvider()).then((data) => {
      setUserProviderData(data.payload as UserInfo);
    });
  }, [dispatch]);

  return (
    <SettingsLayout>
      <AvatarChange />
      <Divider />
      <Formik
        initialValues={formikInitialValues}
        validationSchema={updateCredsSchema}
        onSubmit={() => {}}>
        {({ values, errors }) => (
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
        )}
      </Formik>
      <Divider />
      {isViaGoogle ? (
        <>
          <EmailChange />
          <Divider />
          <PasswordChange />
        </>
      ) : (
        <p className='p-5 font-openSans text-sm font-bold'>
          {t("settings:logged_in_via_google")}
        </p>
      )}

      <Divider />
      <MediaLinks />
      <Divider />
      <StatisticRestart />
    </SettingsLayout>
  );
};

export default SettingsView;
