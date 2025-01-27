import { Button } from "assets/components/ui/button";
import Avatar from "components/Avatar";
import {
  selectIsFetching,
  selectUserAvatar,
  selectUserName,
} from "feature/user/store/userSlice";
import { uploadUserAvatar } from "feature/user/store/userSlice.asyncThunk";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "store/hooks";

const AvatarChange = () => {
  const [avatarIsValid, setAvatarIsValid] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>();
  const [imageUpload, setImageUpload] = useState<Blob>();
  const { t } = useTranslation(["settings", "toast"]);

  const userAvatar = useAppSelector(selectUserAvatar);
  const isFetching = useAppSelector(selectIsFetching) === "updateData";
  const userName = useAppSelector(selectUserName);
  const dispatch = useAppDispatch();

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
          <p className='mt-2 font-openSans text-xs text-secondText  '>
            {t("settings:resolution_info")}
          </p>
        </div>
        <Button
          className='mt-4'
          disabled={!avatarIsValid || isFetching}
          type='submit'
          size='sm'>
          {isFetching && <Loader2 className='animate-spin' />}
          {t("settings:save")}
        </Button>
      </form>
    </div>
  );
};

export default AvatarChange;
