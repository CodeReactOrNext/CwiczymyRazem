import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import { Label } from "assets/components/ui/label";
import { selectIsFetching, selectUserInfo } from "feature/user/store/userSlice";
import { uploadUserSocialData } from "feature/user/store/userSlice.asyncThunk";
import { useTranslation } from "hooks/useTranslation";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { FaGuitar, FaSoundcloud, FaYoutube } from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "store/hooks";

const MediaLinks = () => {
  const isFetching = useAppSelector(selectIsFetching) === "updateData";
  const userInfo = useAppSelector(selectUserInfo)!;
  const dispatch = useAppDispatch();
  const { t } = useTranslation(["common", "toast", "settings"]);

  const [state, setState] = useState({
    youtube: "",
    soundcloud: "",
    bands: "",
  });

  useEffect(() => {
    if (userInfo) {
      setState({
        youtube: userInfo.youTubeLink || "",
        soundcloud: userInfo.soundCloudLink || "",
        bands: userInfo.band || "",
      });
    }
  }, [userInfo]);

  const handleChange = (field: keyof typeof state, value: string) => {
    setState((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const promises = [];

    if (state.youtube !== (userInfo.youTubeLink || "")) {
      promises.push(
        dispatch(
          uploadUserSocialData({ value: state.youtube, type: "youTubeLink" })
        )
      );
    }
    if (state.soundcloud !== (userInfo.soundCloudLink || "")) {
      promises.push(
        dispatch(
          uploadUserSocialData({ value: state.soundcloud, type: "soundCloudLink" })
        )
      );
    }
    if (state.bands !== (userInfo.band || "")) {
      promises.push(
        dispatch(uploadUserSocialData({ value: state.bands, type: "band" }))
      );
    }

    await Promise.all(promises);
  };

  const hasChanges =
    state.youtube !== (userInfo.youTubeLink || "") ||
    state.soundcloud !== (userInfo.soundCloudLink || "") ||
    state.bands !== (userInfo.band || "");

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <FaYoutube className="h-4 w-4" />
          YouTube
        </Label>
        <Input
          value={state.youtube}
          onChange={(e) => handleChange("youtube", e.target.value)}
          placeholder="https://youtube.com/..."
        />
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <FaSoundcloud className="h-4 w-4" />
          SoundCloud
        </Label>
        <Input
          value={state.soundcloud}
          onChange={(e) => handleChange("soundcloud", e.target.value)}
          placeholder="https://soundcloud.com/..."
        />
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <FaGuitar className="h-4 w-4" />
          {t("settings:bands")}
        </Label>
        <Input
          value={state.bands}
          onChange={(e) => handleChange("bands", e.target.value)}
          placeholder="Your bands..."
        />
      </div>

      <div className="flex justify-end pt-4">
        <Button onClick={handleSave} disabled={!hasChanges || isFetching}>
          {isFetching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("settings:save")}
        </Button>
      </div>
    </div>
  );
};

export default MediaLinks;
