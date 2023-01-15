import { FaSpinner } from "react-icons/fa";
import { useState, useEffect } from "react";

import LogsBoxLayout from "layouts/LogsBoxLayout";

import { firebaseGetLogs } from "utils/firebase/client/firebase.utils";
import { FirebaseLogsInterface } from "utils/firebase/client/firebase.types";

const LogsBoxView = () => {
  const [logs, setLogs] = useState<FirebaseLogsInterface[] | null>(null);

  useEffect(() => {
    firebaseGetLogs()
      .then((logsData) => {
        setLogs(logsData);
      })
      .catch((error) => {
        throw new Error(error);
      });
  }, []);

  return logs ? <LogsBoxLayout logs={logs} /> : <FaSpinner />;
};

export default LogsBoxView;
