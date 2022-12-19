import MainLayout from "layouts/MainLayout";
import { firebaseGetUsersExceriseRaprot } from "utils/firebase/firebase.utils";
import LeadboardColumn from "./components/LeadboardColumn/LeadboardColumn";
import { useState, useEffect } from "react";
import { statistics } from "utils/firebase/userStatisticsInitialData";

const LeadboardLayout = ({ usersData }) => {
  return (
    <MainLayout subtitle='Leadboard' variant='secondary'>
      {usersData.map((user, index) => (
        <LeadboardColumn
          key={index}
          place={index + 1}
          nick={user.displayName}
          statistics={user.statistics}
        />
      ))}
    </MainLayout>
  );
};

export default LeadboardLayout;
