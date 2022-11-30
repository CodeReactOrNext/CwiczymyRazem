import MainLayout from "layouts/MainLayout";
import LeadboardColumn from "./components/LeadboardColumn/LeadboardColumn";

const LeadboardLayout = () => {
  return (
    <MainLayout subtitle='Leadboard' variant='secondary'>
      <div>
        <div className='flex w-full justify-end gap-6 px-4 text-xl xl:mr-12'>
          <p>Dzień</p>
          <p>Tydzień</p>
          <p>Wszystko</p>
        </div>

        <LeadboardColumn place={1} nick='Darek' />
        <LeadboardColumn place={2} nick='WWWWWWWWWW...' />
        <LeadboardColumn place={1} nick='Dzień dobry' />
        <LeadboardColumn place={4} nick='Dududek' />
        <LeadboardColumn place={2} nick='Rais' />
        <LeadboardColumn place={3} nick='Krokon' />
        <LeadboardColumn place={4} nick='Marcin Srzyżewski' />
        <LeadboardColumn place={4} nick='kamils_p' />
        <LeadboardColumn place={4} nick='wrop_330' />
      </div>
    </MainLayout>
  );
};

export default LeadboardLayout;
