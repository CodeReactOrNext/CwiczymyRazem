import Avatar from "components/Avatar";
import MainLayout from "layouts/MainLayout";

const SettingsView = () => {
  return (
    <MainLayout subtitle='Edytuj Profil' variant='primary'>
      <div className='flex max-w-[800px] flex-col p-6'>
        <div className='flex flex-row gap-2 p-4  text-2xl'>
          <Avatar name='Dummy name' lvl={28} />
          <button className='text-lg text-main'>Edytuj</button>
        </div>
        <hr className='border-main-opposed-400' />
        <div className='flex flex-row gap-2 p-4 text-2xl'>
          <p className='text-tertiary'>Nick:</p>
          <p>NazwaUżytwkonika</p>
          <button className='text-lg text-main'>Edytuj</button>
        </div>
        <hr className='border-main-opposed-400' />
        <div className='flex flex-row gap-2 p-4 text-2xl'>
          <p className='text-tertiary'>E-mail:</p>
          <p>mail@mail.pl</p>
          <button className='items-end text-lg text-main'>Edytuj</button>
        </div>
        <hr className='border-main-opposed-400' />
        <div className='flex  flex-row gap-2 p-4 text-2xl'>
          <p className='text-tertiary'>Hasło</p>
          <button className='text-lg text-main'>Edytuj</button>
        </div>
        <hr className='border-main-opposed-400' />

        <div className='flex flex-col gap-2  p-4 text-2xl'>
          <p className='text-tertiary'>Restart Statystyk</p>
          <p className='text-lg'>
            Uwaga. Wciśnięcie tego spowoduje restart wszystkich twoich
            statystyk.
          </p>
          <button className='text-lg text-main'>Restartuj</button>
        </div>
        <hr className='border-main-opposed-400' />
        <div className='flex flex-col gap-2 p-4 text-2xl'>
          <p className='text-tertiary'>Anonimowość </p>
          <p className='text-lg'>
            Czy chcesz aby twój nick pozostał anonimowy w ledbordzie?
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default SettingsView;
