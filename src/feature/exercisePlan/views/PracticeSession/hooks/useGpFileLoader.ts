import { parseGpFile } from "feature/songs/services/gp5Parser.service";
import { fetchGpFileAsFile } from "feature/songs/services/userGpFiles.service";
import { useEffect, useState } from "react";

import type { BackingTrack } from "../../../types/exercise.types";

interface UseGpFileLoaderOptions {
  rawGpFile?:     File;
  gpFileUrl?:     string;
  exerciseTitle:  string;
}

export function useGpFileLoader({ rawGpFile, gpFileUrl, exerciseTitle }: UseGpFileLoaderOptions) {
  const [fetchedGpFile,    setFetchedGpFile]    = useState<File | null>(null);
  const [isFetchingGpFile, setIsFetchingGpFile] = useState(false);

  useEffect(() => {
    if (!gpFileUrl) { setFetchedGpFile(null); return; }
    const fileName = exerciseTitle.replace(/[^a-zA-Z0-9._-]/g, "_") + ".gp5";
    setIsFetchingGpFile(true);
    fetchGpFileAsFile(gpFileUrl, fileName)
      .then(file => { setFetchedGpFile(file);   setIsFetchingGpFile(false); })
      .catch(()   => { setFetchedGpFile(null);  setIsFetchingGpFile(false); });
  }, [gpFileUrl]);

  const effectiveRawGpFile = rawGpFile ?? fetchedGpFile ?? undefined;

  const [parsedGpTracks, setParsedGpTracks] = useState<BackingTrack[] | null>(null);

  useEffect(() => {
    if (!effectiveRawGpFile) { setParsedGpTracks(null); return; }
    parseGpFile(effectiveRawGpFile)
      .then(data => {
        setParsedGpTracks(data.tracks.map((t, idx) => ({
          id:        `track-${idx}`,
          name:      t.name,
          measures:  t.measures,
          trackType: t.trackType as BackingTrack["trackType"],
          pan:       t.pan,
        })));
      })
      .catch(() => setParsedGpTracks(null));
  }, [effectiveRawGpFile]);

  return { effectiveRawGpFile, isFetchingGpFile, parsedGpTracks };
}
