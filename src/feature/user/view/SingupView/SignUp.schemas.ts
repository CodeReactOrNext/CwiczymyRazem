import * as yup from "yup";

export const signupSchema = yup.object().shape({
  login: yup
    .string()
    .min(3, "yup_errors:username_char_number")
    .max(28, "yup_errors:username_char_max_number")
    .matches(/^[^\s]+(\s+[^\s]+)*$/, "yup_errors:no_ends_whitespace")
    .matches(
      /^[\u0041-\u005A\u0061-\u007A\u0100-\u017F\u0180-\u024F\u0259\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03CE\u03D0-\u03D7\u03DA-\u03FB\u1F00-\u1FFF\p{N}\d_-\s]+$/,
      "yup_errors:allowed_signs"
    )
    .required("yup_errors:required"),
  email: yup
    .string()
    .email("yup_errors:valid_email")
    .required("yup_errors:required"),
  password: yup
    .string()
    .min(8, "yup_errors:password_char_number")
    .required("yup_errors:required"),
  repeat_password: yup
    .string()
    .oneOf([yup.ref("password"), null], "yup_errors:same_passwords")
    .required("yup_errors:required"),
});
