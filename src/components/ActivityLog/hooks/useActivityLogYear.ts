import { useState } from "react";

export const useActivityLogYear = (initialYear: number = new Date().getFullYear()) => {
  const [year, setYear] = useState(initialYear);
  return { year, setYear };
}; 