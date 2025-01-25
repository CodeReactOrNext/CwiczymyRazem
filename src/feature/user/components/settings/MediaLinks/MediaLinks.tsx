import { Button } from "assets/components/ui/button";
import { Input } from "assets/components/ui/input";
import { Label } from "assets/components/ui/label";
import { selectIsFetching, selectUserInfo } from "feature/user/store/userSlice";
import { uploadUserSocialData } from "feature/user/store/userSlice.asyncThunk";
import { mediaSchema } from "feature/user/view/SettingsView/Settings.schemas";
import { Formik } from "formik";
import { useTranslation } from "react-i18next";
import { FaGuitar, FaSoundcloud, FaYoutube } from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "store/hooks";

export type MediaType = "youTubeLink" | "soundCloudLink" | "band";

const MediaLinks = () => {
  const isFetching = useAppSelector(selectIsFetching) === "updateData";
  const { soundCloudLink, youTubeLink, band } = useAppSelector(selectUserInfo)!;
  const dispatch = useAppDispatch();
  const { t } = useTranslation(["common", "toast", "settings"]);

  const formikInitialValues = {
    youtube: "",
    soundcloud: "",
    bands: "",
  };

  const SocialField = ({
    name,
    icon: Icon,
    title,
    currentValue,
  }: {
    name: string;
    icon: any;
    title: string;
    currentValue?: string;
  }) => (
    <div className='space-y-2'>
      <Label className='flex items-center gap-2'>
        <Icon className='h-4 w-4' />
        {title}
      </Label>
      <div className='flex space-x-2'>
        <Input
          name={name}
          placeholder={currentValue || title}
          className='flex-1'
        />
        <Button
          type='submit'
          disabled={isFetching}
          onClick={() => {
            const value =
              formikInitialValues[name as keyof typeof formikInitialValues];
            if (value) {
              dispatch(
                uploadUserSocialData({
                  value,
                  type:
                    name === "youtube"
                      ? "youTubeLink"
                      : name === "soundcloud"
                      ? "soundCloudLink"
                      : "band",
                })
              );
            }
          }}>
          {t("settings:save")}
        </Button>
      </div>
    </div>
  );

  return (
    <Formik
      initialValues={formikInitialValues}
      validationSchema={mediaSchema}
      onSubmit={() => {}}>
      {({ values, errors }) => (
        <div className='space-y-4'>
          <SocialField
            name='youtube'
            icon={FaYoutube}
            title='YouTube'
            currentValue={youTubeLink}
          />
          <SocialField
            name='soundcloud'
            icon={FaSoundcloud}
            title='SoundCloud'
            currentValue={soundCloudLink}
          />
          <SocialField
            name='bands'
            icon={FaGuitar}
            title={t("settings:bands")}
            currentValue={band}
          />
        </div>
      )}
    </Formik>
  );
};

export default MediaLinks;
