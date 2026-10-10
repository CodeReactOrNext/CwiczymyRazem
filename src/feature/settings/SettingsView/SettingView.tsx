import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "assets/components/ui/tabs";
import { cn } from "assets/lib/utils";
import {
  tabNavFadeClass,
  tabNavListClass,
  tabNavTriggerClass,
} from "components/PageTabs/tabNav";
import { useRailEdges } from "components/PageTabs/useRailEdges";
import EmailChange from "feature/settings/components/EmailChange";
import EmailNotificationSettings from "feature/settings/components/EmailNotificationSettings";
import { GuitarStartDate } from "feature/settings/components/GuitarStartDate";
import { LanguageSettings } from "feature/settings/components/LanguageSettings";
import MediaLinks from "feature/settings/components/MediaLinks";
import PasswordChange from "feature/settings/components/PasswordChange";
import ProfileBasics from "feature/settings/components/ProfileBasics";
import { TablatureAppearance } from "feature/settings/components/TablatureAppearance";
import SettingsLayout from "feature/settings/SettingsLayout";
import { getUserProvider } from "feature/user/store/userSlice.asyncThunk";
import type { UserInfo } from "firebase/auth";
import { useTranslation } from "hooks/useTranslation";
import { Bell, Guitar, Lock, Share2, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppDispatch } from "store/hooks";

const SETTINGS_TABS = [
  { value: "profile", label: "Profile", Icon: User },
  { value: "socials", label: "Social Media", Icon: Share2 },
  { value: "tablature", label: "Tablature", Icon: Guitar },
  { value: "notifications", label: "Notifications", Icon: Bell },
  { value: "security", label: "Security", Icon: Lock },
] as const;

const SettingsView = () => {
  const { t } = useTranslation(["common", "settings", "toast"]);
  const [userProviderData, setUserProviderData] = useState<UserInfo>();
  const dispatch = useAppDispatch();
  const { ref: railRef, edges } = useRailEdges<HTMLDivElement>();

  const isViaGoogle = userProviderData?.providerId === "google.com";

  useEffect(() => {
    dispatch(getUserProvider()).then((data) => {
      setUserProviderData(data.payload as UserInfo);
    });
  }, [dispatch]);

  return (
    <SettingsLayout>
      <Tabs defaultValue="profile" className="w-full">
        {/* Same underline tab bar as the rest of the app, so the form gets the
            full width instead of sharing it with a column of category cards. */}
        <div className="space-y-6">
          <h1 className="px-1 text-2xl font-bold text-zinc-100">{t("settings:tabs.title")}</h1>
          <TabsList
            ref={railRef}
            className={cn(tabNavListClass, tabNavFadeClass(edges))}>
            {SETTINGS_TABS.map(({ value, label, Icon }) => (
              <TabsTrigger key={value} value={value} className={tabNavTriggerClass}>
                <Icon className="h-4 w-4" />
                {t(`settings:tabs.${value}`, label)}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Content Area */}
          <div className="min-w-0 pb-20">
            <TabsContent value="profile" className="mt-0 space-y-8">
              <ProfileBasics />
              <GuitarStartDate />
              <LanguageSettings />
            </TabsContent>

            <TabsContent value="socials" className="mt-0">
              <MediaLinks />
            </TabsContent>

            <TabsContent value="tablature" className="mt-0">
              <TablatureAppearance />
            </TabsContent>

            <TabsContent value="notifications" className="mt-0">
              <EmailNotificationSettings />
            </TabsContent>

            <TabsContent value="security" className="mt-0 space-y-6">
               {isViaGoogle ? (
                  <div className="flex items-center gap-4 rounded-lg bg-cyan-500/10 p-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-400">
                       <Lock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-cyan-300">{t("settings:tabs.google_auth")}</p>
                      <p className="text-sm text-zinc-400">{t("settings:logged_in_via_google")}</p>
                    </div>
                  </div>
               ) : (
                 <div className="space-y-6">
                    <EmailChange />
                    <PasswordChange />
                 </div>
               )}
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </SettingsLayout>
  );
};

export default SettingsView;
