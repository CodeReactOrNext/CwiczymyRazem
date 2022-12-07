import * as yup from "yup";
import { passwordRegexRules } from "schemas/passwordRules";

export const signupSchema = yup.object().shape({
  login: yup.string().min(3).required("Required"),
  email: yup.string().email("Please enter a valid email").required("Required"),
  password: yup
    .string()
    .min(8)
    .matches(passwordRegexRules, {
      message: "Please create a stronger password",
    })
    .required("Required"),
  repeat_password: yup
    .string()
    .oneOf([yup.ref("password"), null], "Passwords must be the same.")
    .required("Required"),
});
