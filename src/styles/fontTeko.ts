import { Teko } from "next/font/google";

export const teko = Teko({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-teko",
  display: "swap",
});
