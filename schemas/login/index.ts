import * as yup from "yup";
import { passwordRegexRules } from "schemas/passwordRules";

export const loginSchema = yup.object().shape({
  email: yup.string().email("Please enter a valid email").required("Required"),
  password: yup
    .string()
    .min(8)
    .matches(passwordRegexRules, {
      message: "Please create a stronger password",
    })
    .required("Required"),
});
