import MainLayout from "layouts/MainLayout";
import LeadboardColumn from "./components/LeadboardColumn/LeadboardColumn";

const LeadboardLayout = () => {
  return (
    <MainLayout subtitle='Leadboard' variant='secondary'>
      <div className='w-[80%]'>
        <div className='flex w-full justify-end gap-6 text-xl'>
          <p>Dzień</p>
          <p>Tydzień</p>
          <p>Wszystko</p>
        </div>

        <LeadboardColumn place={1} />
        <LeadboardColumn place={2} />
        <LeadboardColumn place={3} />
        <LeadboardColumn place={4} />
      </div>
    </MainLayout>
  );
};

export default LeadboardLayout;
