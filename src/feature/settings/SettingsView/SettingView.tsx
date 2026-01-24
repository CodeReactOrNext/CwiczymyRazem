import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "assets/components/ui/tabs";
import EmailChange from "feature/settings/components/EmailChange";
import { GuitarStartDate } from "feature/settings/components/GuitarStartDate";
import MediaLinks from "feature/settings/components/MediaLinks";
import PasswordChange from "feature/settings/components/PasswordChange";
import ProfileBasics from "feature/settings/components/ProfileBasics";
import ProfileCustomization from "feature/settings/components/ProfileCustomization";
import StatisticRestart from "feature/settings/components/StatisticsRestart";
import SettingsLayout from "feature/settings/SettingsLayout";
import { getUserProvider } from "feature/user/store/userSlice.asyncThunk";
import type { UserInfo } from "firebase/auth";
import { useTranslation } from "hooks/useTranslation";
import { User, Palette, Share2, Settings as SettingsIcon, ShieldAlert, Lock } from "lucide-react";
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
                <h2 className="text-2xl font-black tracking-tight text-foreground">Ustawienia</h2>
                <p className="text-sm text-muted-foreground font-medium">Zarządzaj swoim kontem</p>
             </div>
             <TabsList className="flex flex-col h-auto w-full bg-transparent p-0 gap-1.5">
                <TabsTrigger 
                  value="profile" 
                  className="w-full justify-start gap-3.5 px-5 py-4 rounded-2xl transition-all duration-300 data-[state=active]:bg-zinc-900 data-[state=active]:shadow-lg data-[state=active]:shadow-black/20 border border-transparent data-[state=active]:border-zinc-800 group text-muted-foreground data-[state=active]:text-foreground hover:bg-zinc-900/50"
                >
                  <div className="p-2 rounded-xl bg-zinc-900/50 group-data-[state=active]:bg-cyan-500/10 group-data-[state=active]:text-cyan-500 transition-colors">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="font-bold">Profil</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="customization" 
                  className="w-full justify-start gap-3.5 px-5 py-4 rounded-2xl transition-all duration-300 data-[state=active]:bg-zinc-900 data-[state=active]:shadow-lg data-[state=active]:shadow-black/20 border border-transparent data-[state=active]:border-zinc-800 group text-muted-foreground data-[state=active]:text-foreground hover:bg-zinc-900/50"
                >
                  <div className="p-2 rounded-xl bg-zinc-900/50 group-data-[state=active]:bg-purple-500/10 group-data-[state=active]:text-purple-500 transition-colors">
                    <Palette className="h-4 w-4" />
                  </div>
                  <span className="font-bold">Wygląd profilu</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="socials" 
                  className="w-full justify-start gap-3.5 px-5 py-4 rounded-2xl transition-all duration-300 data-[state=active]:bg-zinc-900 data-[state=active]:shadow-lg data-[state=active]:shadow-black/20 border border-transparent data-[state=active]:border-zinc-800 group text-muted-foreground data-[state=active]:text-foreground hover:bg-zinc-900/50"
                >
                  <div className="p-2 rounded-xl bg-zinc-900/50 group-data-[state=active]:bg-blue-500/10 group-data-[state=active]:text-blue-500 transition-colors">
                    <Share2 className="h-4 w-4" />
                  </div>
                  <span className="font-bold">Social Media</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="preferences" 
                  className="w-full justify-start gap-3.5 px-5 py-4 rounded-2xl transition-all duration-300 data-[state=active]:bg-zinc-900 data-[state=active]:shadow-lg data-[state=active]:shadow-black/20 border border-transparent data-[state=active]:border-zinc-800 group text-muted-foreground data-[state=active]:text-foreground hover:bg-zinc-900/50"
                >
                  <div className="p-2 rounded-xl bg-zinc-900/50 group-data-[state=active]:bg-amber-500/10 group-data-[state=active]:text-amber-500 transition-colors">
                    <SettingsIcon className="h-4 w-4" />
                  </div>
                  <span className="font-bold">Preferencje</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="security" 
                  className="w-full justify-start gap-3.5 px-5 py-4 rounded-2xl transition-all duration-300 data-[state=active]:bg-zinc-900 data-[state=active]:shadow-lg data-[state=active]:shadow-black/20 border border-transparent data-[state=active]:border-zinc-800 group text-muted-foreground data-[state=active]:text-foreground hover:bg-zinc-900/50"
                >
                  <div className="p-2 rounded-xl bg-zinc-900/50 group-data-[state=active]:bg-zinc-100 group-data-[state=active]:text-zinc-950 transition-colors">
                    <Lock className="h-4 w-4" />
                  </div>
                  <span className="font-bold">Bezpieczeństwo</span>
                </TabsTrigger>
                
                <div className="py-2 px-4">
                   <div className="h-px w-full bg-zinc-800" />
                </div>

                <TabsTrigger 
                  value="danger" 
                  className="w-full justify-start gap-3.5 px-5 py-4 rounded-2xl transition-all duration-300 data-[state=active]:text-red-500 data-[state=active]:bg-red-500/10 hover:bg-red-500/5 border border-transparent group text-muted-foreground font-bold"
                >
                  <div className="p-2 rounded-xl bg-red-500/5 group-data-[state=active]:bg-red-500 group-data-[state=active]:text-white transition-colors">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <span>Strefa Niebezpieczna</span>
                </TabsTrigger>
             </TabsList>
          </div>

          {/* Content Area */}
          <div className="flex-1 min-w-0 pb-20">
            <TabsContent value="profile" className="mt-0">
              <ProfileBasics />
            </TabsContent>

            <TabsContent value="customization" className="mt-0">
              <ProfileCustomization />
            </TabsContent>

            <TabsContent value="socials" className="mt-0">
              <MediaLinks />
            </TabsContent>

            <TabsContent value="preferences" className="mt-0">
               <GuitarStartDate />
            </TabsContent>

            <TabsContent value="security" className="mt-0 space-y-6">
               {isViaGoogle ? (
                  <div className="rounded-xl bg-cyan-50 border border-cyan-100 p-6 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600">
                       <Lock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-cyan-900">Google OAuth Authentication</p>
                      <p className="text-sm text-cyan-700">{t("settings:logged_in_via_google")}</p>
                    </div>
                  </div>
               ) : (
                 <div className="space-y-6">
                    <EmailChange />
                    <PasswordChange />
                 </div>
               )}
            </TabsContent>

            <TabsContent value="danger" className="mt-0">
              <StatisticRestart />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </SettingsLayout>
  );
};

export default SettingsView;
