import Head from "next/head";
import ForgotPasswordView from "feature/user/view/ForgotPasswordView/ForgotPasswordView";

export default function ForgotPassword() {
  return (
    <>
      <Head>
        <title>Forgot Password | CwiczymyRazem</title>
      </Head>
      <ForgotPasswordView />
    </>
  );
}
