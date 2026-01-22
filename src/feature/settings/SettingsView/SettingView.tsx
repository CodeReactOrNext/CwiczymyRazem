import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "assets/components/ui/card";
import { Separator } from "assets/components/ui/separator";
import EmailChange from "feature/settings/components/EmailChange";
import { GuitarStartDate } from "feature/settings/components/GuitarStartDate";
import MediaLinks from "feature/settings/components/MediaLinks";
import PasswordChange from "feature/settings/components/PasswordChange";
import ProfileBasics from "feature/settings/components/ProfileBasics";
import StatisticRestart from "feature/settings/components/StatisticsRestart";
import SettingsLayout from "feature/settings/SettingsLayout";
import { selectIsFetching } from "feature/user/store/userSlice";
import { getUserProvider } from "feature/user/store/userSlice.asyncThunk";
import type { UserInfo } from "firebase/auth";
import { useTranslation } from "hooks/useTranslation";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "store/hooks";

const SettingsView = () => {
  const { t } = useTranslation(["common", "settings", "toast"]);
  const [userProviderData, setUserProviderData] = useState<UserInfo>();
  const dispatch = useAppDispatch();

  const isViaGoogle = userProviderData?.providerId !== "google.com";

  useEffect(() => {
    dispatch(getUserProvider()).then((data) => {
      setUserProviderData(data.payload as UserInfo);
    });
  }, [dispatch]);

  return (
    <SettingsLayout>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        

        <div className="lg:col-span-2">
          <ProfileBasics />
        </div>


        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>{t("settings:additional_info")}</CardTitle>
              <CardDescription>
                Manage your public links and bands
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MediaLinks />
            </CardContent>
          </Card>
        </div>


        <div className="lg:col-span-1 space-y-6">
          <Card>
             <CardHeader>
               <CardTitle>Preferences</CardTitle>
             </CardHeader>
             <CardContent>
                <GuitarStartDate />
             </CardContent>
          </Card>

          {isViaGoogle ? (
            <Card>
              <CardHeader>
                <CardTitle>{t("settings:security")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <EmailChange />
                <Separator />
                <PasswordChange />
              </CardContent>
            </Card>
          ) : (
             <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  {t("settings:logged_in_via_google")}
                </p>
              </CardContent>
            </Card>
          )}
        </div>


        <div className="lg:col-span-2 opacity-80 hover:opacity-100 transition-opacity">
           <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive">{t("settings:danger_zone")}</CardTitle>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent>
              <StatisticRestart />
            </CardContent>
          </Card>
        </div>

      </div>
    </SettingsLayout>
  );
};

export default SettingsView;
