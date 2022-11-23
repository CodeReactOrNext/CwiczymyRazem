import MainLayout from "layouts/MainLayout";
import LeadboardColumn from "./components/LeadboardColumn/LeadboardColumn";

const LeadboardLayout = () => {
  return (
    <MainLayout subtitle='Leadboard' variant='secondary'>
      <div>
        <div className='flex w-full justify-end gap-6 px-4 text-xl'>
          <p>Dzień</p>
          <p>Tydzień</p>
          <p>Wszystko</p>
        </div>

        <LeadboardColumn place={1} />

        <LeadboardColumn place={2} />
        <LeadboardColumn place={3} />
        <LeadboardColumn place={4} />
        <LeadboardColumn place={2} />
        <LeadboardColumn place={3} />
        <LeadboardColumn place={4} />
        <LeadboardColumn place={2} />
        <LeadboardColumn place={3} />
        <LeadboardColumn place={4} />
        <LeadboardColumn place={2} />
        <LeadboardColumn place={3} />
        <LeadboardColumn place={4} />
      </div>
    </MainLayout>
  );
};

export default LeadboardLayout;
