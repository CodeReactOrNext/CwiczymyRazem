import { Formik } from "formik";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaGuitar, FaSoundcloud, FaYoutube } from "react-icons/fa";

import FieldBox from "layouts/SettingsLayout/components/FieldBox";

import { mediaSchema } from "feature/user/view/SettingsView/Settings.schemas";
import { useAppDispatch, useAppSelector } from "store/hooks";
import { selectIsFetching, selectUserInfo } from "feature/user/store/userSlice";
import { uploadUserSocialData } from "feature/user/store/userSlice.asyncThunk";

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
  return (
    <Formik
      initialValues={formikInitialValues}
      validationSchema={mediaSchema}
      onSubmit={() => {}}>
      {({ values, errors }) => (
        <>
          <FieldBox
            title={"YouTube"}
            Icon={FaYoutube}
            submitHandler={() => {
              dispatch(
                uploadUserSocialData({
                  value: values.youtube,
                  type: "youTubeLink",
                })
              );
            }}
            errors={errors}
            values={values}
            inputName={"youtube"}
            isFetching={isFetching}
            value={youTubeLink ? youTubeLink : "YouTube Link"}
          />
          <FieldBox
            title={"SoundCloud"}
            Icon={FaSoundcloud}
            submitHandler={() => {
              dispatch(
                uploadUserSocialData({
                  value: values.soundcloud,
                  type: "soundCloudLink",
                })
              );
            }}
            errors={errors}
            values={values}
            inputName={"soundcloud"}
            isFetching={isFetching}
            value={soundCloudLink ? soundCloudLink : "SoundCloud Link"}
          />
          <FieldBox
            title={t("settings:bands")}
            Icon={FaGuitar}
            submitHandler={() => {
              dispatch(
                uploadUserSocialData({
                  value: values.bands,
                  type: "band",
                })
              );
            }}
            errors={errors}
            values={values}
            inputName={"bands"}
            isFetching={isFetching}
            value={band ? band : t("settings:bands")}
          />
        </>
      )}
    </Formik>
  );
};
export default MediaLinks;
