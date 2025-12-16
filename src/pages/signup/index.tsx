import SingupView from "feature/user/view/SingupView";
import type { NextPage } from "next";
import { withAuth } from "utils/auth/serverAuth";

const SignUpPage: NextPage = () => {
  return <SingupView />;
};

export default SignUpPage;

export const getServerSideProps = withAuth({
  redirectIfAuthenticated: "/dashboard",
  translations: ["common", "signup", "yup_errors", "toast"],
});
