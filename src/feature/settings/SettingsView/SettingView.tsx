import { Button } from "assets/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "assets/components/ui/card";
import { Input } from "assets/components/ui/input";
import { Label } from "assets/components/ui/label";
import { Separator } from "assets/components/ui/separator";
import AvatarChange from "feature/settings/components/AvatarChange";
import EmailChange from "feature/settings/components/EmailChange";
import { GuitarStartDate } from "feature/settings/components/GuitarStartDate";
import MediaLinks from "feature/settings/components/MediaLinks";
import PasswordChange from "feature/settings/components/PasswordChange";
import StatisticRestart from "feature/settings/components/StatisticsRestart";
import SettingsLayout from "feature/settings/SettingsLayout";
import { updateCredsSchema } from "feature/settings/SettingsView/Settings.schemas";
import { selectIsFetching, selectUserName } from "feature/user/store/userSlice";
import {
  changeUserDisplayName,
  getUserProvider,
} from "feature/user/store/userSlice.asyncThunk";
import type { UserInfo } from "firebase/auth";
import { Formik } from "formik";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "store/hooks";

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

  useEffect(() => {
    dispatch(getUserProvider()).then((data) => {
      setUserProviderData(data.payload as UserInfo);
    });
  }, [dispatch]);

  return (
    <SettingsLayout>
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle>{t("settings:profile_settings")}</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <AvatarChange />
            <Separator className='my-4' />

            <div className='space-y-2'>
              <Formik
                initialValues={formikInitialValues}
                validationSchema={updateCredsSchema}
                onSubmit={() => {}}>
                {({ values, errors, handleChange, handleBlur }) => (
                  <div className='space-y-2'>
                    <Label htmlFor='login'>{t("settings:nickname")}</Label>
                    <div className='flex space-x-2'>
                      <Input
                        id='login'
                        name='login'
                        value={values.login}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder={userName || ""}
                        className='flex-1'
                      />
                      <Button
                        onClick={() => changeNameHandler(values.login)}
                        disabled={
                          isFetching || !values.login || !!errors.login
                        }>
                        {t("settings:save")}
                      </Button>
                    </div>
                    {errors.login && (
                      <p className='text-sm text-destructive'>{errors.login}</p>
                    )}
                  </div>
                )}
              </Formik>
            </div>
          </CardContent>
        </Card>

        {isViaGoogle ? (
          <Card>
            <CardHeader>
              <CardTitle>{t("settings:security")}</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <EmailChange />
              <Separator className='my-4' />
              <PasswordChange />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent>
              <p className='text-sm text-muted-foreground'>
                {t("settings:logged_in_via_google")}
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{t("settings:additional_info")}</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <MediaLinks />
            <Separator className='my-4' />
            <GuitarStartDate />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("settings:danger_zone")}</CardTitle>
          </CardHeader>
          <CardContent>
            <StatisticRestart />
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
};

export default SettingsView;
