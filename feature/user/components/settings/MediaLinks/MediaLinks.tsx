import { Formik } from "formik";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaGuitar, FaSoundcloud, FaYoutube } from "react-icons/fa";
import { mediaSchema } from "feature/user/view/SettingsView/Settings.schemas";

import FieldBox from "layouts/SettingsLayout/components/FieldBox";

function MediaLinks({ isFetching }: { isFetching: boolean }) {
  const [youtubeLink, setYoutubeLink] = useState("YouTube");
  const [soundcloudLink, setSoundcloudLink] = useState("SoundCloud");
  const [bands, setBands] = useState("");

  const { t } = useTranslation(["common", "toast", "settings"]);

  const formikInitialValues = {
    youtube: "",
    soundcloud: "",
    bands: "",
  };

  function updateYtLink(link: string) {
    setYoutubeLink(link);
  }

  function updateScLink(link: string) {
    setSoundcloudLink(link);
  }

  function updateBands(bands: string) {
    setBands(bands);
  }

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
              updateYtLink(values.youtube);
            }}
            errors={errors}
            values={values}
            inputName={"youtube"}
            isFetching={isFetching}
            value={youtubeLink}
          />
          <FieldBox
            title={"SoundCloud"}
            Icon={FaSoundcloud}
            submitHandler={() => {
              updateScLink(values.soundcloud);
            }}
            errors={errors}
            values={values}
            inputName={"soundcloud"}
            isFetching={isFetching}
            value={soundcloudLink}
          />
          <FieldBox
            title={t("settings:bands")}
            Icon={FaGuitar}
            submitHandler={() => {
              updateBands(values.bands);
            }}
            errors={errors}
            values={values}
            inputName={"bands"}
            isFetching={isFetching}
            value={bands}
          />
        </>
      )}
    </Formik>
  );
}
export default MediaLinks;
