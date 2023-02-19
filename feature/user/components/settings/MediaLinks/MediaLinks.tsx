import Button from "components/Button";
import Input from "components/Input";
import { Form, Formik } from "formik";
import YoutubeLogo from "public/static/images/svg/Youtube_logo";
import { useTranslation } from "react-i18next";

function MediaLinks({ isFetching }: { isFetching: boolean }) {
  const { t } = useTranslation(["common", "toast", "settings"]);
  const formikInitialValues = {
    youtube: "",
    soundcloud: "",
    bands: "",
  };

  return (
    <>
      <Formik
        initialValues={formikInitialValues}
        // validationSchema={updateCredsSchema}
        onSubmit={(values) => {}}>
        {({ values, errors }) => (
          <Form>
            <div className='flex  flex-row gap-2 p-4 text-2xl'>
              <p className='text-tertiary'>{"Linki"}</p>
            </div>
            <div className='flex h-full w-full flex-col items-center gap-4 pb-5'>
              <div className='flex items-center gap-2'>
                <label
                  htmlFor='youtube'
                  className='flex h-10 w-20 items-center'>
                  <YoutubeLogo></YoutubeLogo>
                </label>
                <Input
                  id={"youtube"}
                  placeholder={"Youtube channel link"}
                  name='password'
                />
              </div>
              <Input placeholder={"Soundcloud link"} name='repeat_password' />
              <Button
                variant='small'
                loading={isFetching}
                disabled={Boolean(true)}
                type='submit'>
                {t("settings:save")}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </>
  );
}
export default MediaLinks;
