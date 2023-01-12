
import LogsBoxLayout from "layouts/LogsBoxLayout";
import { useState, useEffect } from "react";
import { FaSpinner } from "react-icons/fa";
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
