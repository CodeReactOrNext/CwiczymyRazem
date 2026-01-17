import { Button } from "assets/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "assets/components/ui/select";
import { differenceInYears } from "date-fns";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { updateGuitarStartDate } from "utils/firebase/client/firebase.utils";
import { db } from "utils/firebase/client/firebase.utils";
import { auth } from "utils/firebase/client/firebase.utils";

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

  const durationYears = date ? differenceInYears(new Date(), date) : 0;

  return (
    <div className='flex flex-col gap-6'>
      <h3 className='font-openSans text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'>
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
        
        {date && (
            <div className="bg-muted/50 border border-muted p-3 rounded-md text-sm text-foreground">
                <span role="img" aria-label="guitar" className="mr-2">🎸</span>
                {t("guitarStartDate.duration_years", { years: durationYears })}
            </div>
        )}

        <Button onClick={handleSave} disabled={!date}>
          {t("guitarStartDate.save")}
        </Button>
      </div>
    </div>
  );
};
