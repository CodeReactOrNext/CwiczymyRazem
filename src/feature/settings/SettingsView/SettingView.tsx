import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "assets/components/ui/tabs";
import EmailChange from "feature/settings/components/EmailChange";
import EmailNotificationSettings from "feature/settings/components/EmailNotificationSettings";
import { GuitarStartDate } from "feature/settings/components/GuitarStartDate";
import MediaLinks from "feature/settings/components/MediaLinks";
import PasswordChange from "feature/settings/components/PasswordChange";
import ProfileBasics from "feature/settings/components/ProfileBasics";
import ProfileCustomization from "feature/settings/components/ProfileCustomization";
import SettingsLayout from "feature/settings/SettingsLayout";
import { getUserProvider } from "feature/user/store/userSlice.asyncThunk";
import type { UserInfo } from "firebase/auth";
import { useTranslation } from "hooks/useTranslation";
import { Bell, Lock, Share2, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppDispatch } from "store/hooks";

const SettingsView = () => {
  const { t } = useTranslation(["common", "settings", "toast"]);
  const [userProviderData, setUserProviderData] = useState<UserInfo>();
  const dispatch = useAppDispatch();

  const isViaGoogle = userProviderData?.providerId === "google.com";

  useEffect(() => {
    dispatch(getUserProvider()).then((data) => {
      setUserProviderData(data.payload as UserInfo);
    });
  }, [dispatch]);

  return (
    <SettingsLayout>
      <Tabs defaultValue="profile" className="w-full">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Sidebar-like TabsList */}
          <div className="w-full md:w-72 space-y-6 shrink-0">
             <div className="px-4 py-2">
                <h2 className="text-2xl font-black tracking-tight text-foreground">Settings</h2>
                <p className="text-sm text-muted-foreground font-medium">Manage your account</p>
             </div>
             <TabsList className="flex flex-col h-auto w-full bg-transparent p-0 gap-1.5">
                <TabsTrigger 
                  value="profile" 
                  className="w-full justify-start gap-3.5 px-5 py-4 rounded-lg transition-background data-[state=active]:bg-zinc-900 group text-muted-foreground data-[state=active]:text-foreground hover:bg-zinc-900/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <div className="p-2 rounded bg-zinc-900/50 group-data-[state=active]:bg-cyan-500/10 group-data-[state=active]:text-cyan-500 transition-colors">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="font-bold">Profile</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="socials" 
                  className="w-full justify-start gap-3.5 px-5 py-4 rounded-lg transition-background data-[state=active]:bg-zinc-900 group text-muted-foreground data-[state=active]:text-foreground hover:bg-zinc-900/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <div className="p-2 rounded bg-zinc-900/50 group-data-[state=active]:bg-blue-500/10 group-data-[state=active]:text-blue-500 transition-colors">
                    <Share2 className="h-4 w-4" />
                  </div>
                  <span className="font-bold">Social Media</span>
                </TabsTrigger>
                <TabsTrigger
                  value="notifications"
                  className="w-full justify-start gap-3.5 px-5 py-4 rounded-lg transition-background data-[state=active]:bg-zinc-900 group text-muted-foreground data-[state=active]:text-foreground hover:bg-zinc-900/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <div className="p-2 rounded bg-zinc-900/50 group-data-[state=active]:bg-cyan-500/10 group-data-[state=active]:text-cyan-500 transition-colors">
                    <Bell className="h-4 w-4" />
                  </div>
                  <span className="font-bold">Notifications</span>
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="w-full justify-start gap-3.5 px-5 py-4 rounded-lg transition-background data-[state=active]:bg-zinc-900 group text-muted-foreground data-[state=active]:text-foreground hover:bg-zinc-900/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <div className="p-2 rounded bg-zinc-900/50 group-data-[state=active]:bg-zinc-100 group-data-[state=active]:text-zinc-950 transition-colors">
                    <Lock className="h-4 w-4" />
                  </div>
                  <span className="font-bold">Security</span>
                </TabsTrigger>
             </TabsList>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0 pb-20">
            <TabsContent value="profile" className="mt-0 space-y-8">
              <ProfileBasics />
              <ProfileCustomization />
              <GuitarStartDate />
            </TabsContent>

            <TabsContent value="socials" className="mt-0">
              <MediaLinks />
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
                      <p className="font-semibold text-cyan-300">Google OAuth Authentication</p>
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
