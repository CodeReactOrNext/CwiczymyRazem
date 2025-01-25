import { Button } from "assets/components/ui/button";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { updateGuitarStartDate } from "utils/firebase/client/firebase.utils";
import { doc, getDoc } from "firebase/firestore";
import { db } from "utils/firebase/client/firebase.utils";
import { auth } from "utils/firebase/client/firebase.utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "assets/components/ui/select";

export const GuitarStartDate = () => {
  const { t } = useTranslation("settings");
  const [date, setDate] = useState<Date>();

  const years = Array.from(
    { length: new Date().getFullYear() - 1900 + 1 },
    (_, i) => 1900 + i
  ).reverse();

  useEffect(() => {
    const fetchCurrentDate = async () => {
      const userDocRef = doc(db, "users", auth.currentUser?.uid!);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists() && userDoc.data().guitarStartDate) {
        setDate(userDoc.data().guitarStartDate.toDate());
      }
    };
    fetchCurrentDate();
  }, []);

  const handleYearChange = (year: string) => {
    const newDate = new Date(parseInt(year), 0, 1);
    setDate(newDate);
  };

  const handleSave = async () => {
    if (!date) return;

    try {
      await updateGuitarStartDate(date);
      toast.success(t("guitarStartDate.success"));
    } catch (error) {
      toast.error(t("guitarStartDate.error"));
    }
  };

  return (
    <div className=' mt-6 p-4'>
      <h3 className='mb-4 font-openSans text-lg font-semibold'>
        {t("guitarStartDate.title")}
      </h3>

      <div className='flex flex-col gap-4'>
        <Select
          value={date?.getFullYear().toString()}
          onValueChange={handleYearChange}>
          <SelectTrigger className='w-[240px]'>
            <SelectValue placeholder={t("guitarStartDate.placeholder")} />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={handleSave} disabled={!date}>
          {t("guitarStartDate.save")}
        </Button>
      </div>
    </div>
  );
};
