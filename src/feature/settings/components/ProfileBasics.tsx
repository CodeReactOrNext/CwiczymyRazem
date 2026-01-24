import { Button } from "assets/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "assets/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "assets/components/ui/dialog";
import { Input } from "assets/components/ui/input";
import { Label } from "assets/components/ui/label";
import { Slider } from "assets/components/ui/slider";
import Avatar from "components/UI/Avatar";
import {
  selectIsFetching,
  selectUserAvatar,
  selectUserInfo,
  selectCurrentUserStats,
  selectUserName,
} from "feature/user/store/userSlice";
import {
  changeUserDisplayName,
  uploadUserAvatar,
} from "feature/user/store/userSlice.asyncThunk";
import { useTranslation } from "hooks/useTranslation";
import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "store/hooks";
import getCroppedImg from "utils/canvasUtils";

const ProfileBasics = () => {
  const { t } = useTranslation(["settings", "toast"]);
  const dispatch = useAppDispatch();

  const currentUserName = useAppSelector(selectUserName);
  const currentUserAvatar = useAppSelector(selectUserAvatar);
  const userInfo = useAppSelector(selectUserInfo);
  const userStats = useAppSelector(selectCurrentUserStats);
  const isFetching = useAppSelector(selectIsFetching) === "updateData";

  const [displayName, setDisplayName] = useState(currentUserName || "");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [imageUpload, setImageUpload] = useState<Blob | null>(null);
  

  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);

  useEffect(() => {
    if (currentUserName) {
      setDisplayName(currentUserName);
    }
  }, [currentUserName]);

  const onImageChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      const avatarFile = event.target.files[0];
      if (avatarFile.type !== "image/png" && avatarFile.type !== "image/jpeg") {
        toast.error(t("toast:errors.wrong_file_type"));
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(avatarFile);
      reader.onload = () => {
        setTempImageSrc(reader.result as string);
        setIsCropModalOpen(true);
      };
    }
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSave = async () => {
    if (!tempImageSrc || !croppedAreaPixels) return;

    try {
      const croppedImageBlob = await getCroppedImg(
        tempImageSrc,
        croppedAreaPixels
      );
      
      if (croppedImageBlob) {
        setImageUpload(croppedImageBlob);
        setAvatarPreview(URL.createObjectURL(croppedImageBlob));
        setIsCropModalOpen(false);
        setTempImageSrc(null);
      }
    } catch (e) {
      console.error(e);
      toast.error(t("toast:errors.generic"));
    }
  };

  const handleSave = async () => {

    const isNameChanged = displayName && displayName !== currentUserName;
    const isAvatarChanged = !!imageUpload;

    if (!isNameChanged && !isAvatarChanged) return;


    if (imageUpload) {
      dispatch(uploadUserAvatar(imageUpload));
    }

    if (isNameChanged) {
      dispatch(changeUserDisplayName(displayName));
    }
    

    setImageUpload(null);
  };

  const handleZoomChange = (value: number[]) => {
      setZoom(value[0]);
  }

  return (
    <>
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{t("settings:profile_settings")}</CardTitle>
          <CardDescription>Manage your public profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">

            <div className="flex flex-col items-center space-y-3 min-w-[150px]">
              <Avatar
                avatarURL={avatarPreview || currentUserAvatar}
                name={displayName || "User"}
                size="2xl"
                lvl={userStats?.lvl}
                selectedFrame={userInfo?.selectedFrame}
                selectedGuitar={userInfo?.selectedGuitar}
              />
              <div className="flex flex-col items-center">
                <Label
                  htmlFor="avatar-upload"
                  className="cursor-pointer text-sm text-primary hover:underline">
                  Change Avatar
                </Label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/png, image/jpeg"
                  className="hidden"
                  onChange={onImageChangeHandler}
                  onClick={(e) => ((e.target as HTMLInputElement).value = "")}
                />
              </div>
            </div>


            <div className="flex-1 space-y-4 w-full">
              <div className="space-y-2">
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                />
                <p className="text-sm text-muted-foreground">
                  This name is visible on leaderboards and your public profile.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={
                isFetching ||
                (!imageUpload && displayName === currentUserName)
              }>
              {isFetching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("settings:save")}
            </Button>
          </div>
        </CardContent>
      </Card>


      <Dialog open={isCropModalOpen} onOpenChange={setIsCropModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adjust Image</DialogTitle>
          </DialogHeader>
          <div className="relative h-64 w-full bg-black/50 overflow-hidden rounded-md">
            {tempImageSrc && (
              <Cropper
                image={tempImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>
          <div className="space-y-2 py-2">
            <Label>Zoom</Label>
             <Slider 
                min={1} 
                max={3} 
                step={0.1}
                value={[zoom]}
                onValueChange={handleZoomChange}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCropModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCropSave}>Set Avatar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfileBasics;
