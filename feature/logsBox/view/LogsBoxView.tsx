import { FaSpinner } from "react-icons/fa";
import { useState, useEffect } from "react";

import LogsBoxLayout from "layouts/LogsBoxLayout";

import { FirebaseLogsInterface } from "utils/firebase/firebase.types";
import { firebaseGetLogs } from "utils/firebase/firebase.utils";

const LogsBoxView = () => {
  const [logs, setLogs] = useState<FirebaseLogsInterface[] | null>(null);

  useEffect(() => {
    firebaseGetLogs()
      .then((logsData) => {
        setLogs(logsData);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  return logs ? <LogsBoxLayout logs={logs} /> : <FaSpinner />;
};

export default LogsBoxView;
