import ForgotPasswordView from "feature/user/view/ForgotPasswordView/ForgotPasswordView";
import Head from "next/head";

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
