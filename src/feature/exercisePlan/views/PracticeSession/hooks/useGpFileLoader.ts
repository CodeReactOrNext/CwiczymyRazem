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
  // Both results below carry what they were loaded from, and only count while
  // that is still the current source: moving on in a plan must not leave the
  // previous exercise's tab up, nor let its late download replace the new one.
  const [fetched, setFetched] = useState<{ url: string; file: File | null } | null>(null);
  const isFetched = !!gpFileUrl && fetched?.url === gpFileUrl;
  const fetchedGpFile = isFetched ? fetched.file : null;
  const isFetchingGpFile = !!gpFileUrl && !isFetched;

  useEffect(() => {
    if (!gpFileUrl) return;
    let isStale = false;
    const fileName = exerciseTitle.replace(/[^a-zA-Z0-9._-]/g, "_") + ".gp5";
    fetchGpFileAsFile(gpFileUrl, fileName)
      .then(file => { if (!isStale) setFetched({ url: gpFileUrl, file }); })
      .catch(()   => { if (!isStale) setFetched({ url: gpFileUrl, file: null }); });
    return () => { isStale = true; };
  }, [gpFileUrl]);

  const effectiveRawGpFile = rawGpFile ?? fetchedGpFile ?? undefined;

  const [parsed, setParsed] = useState<{ file: File; tracks: BackingTrack[] | null; tempo: number | null } | null>(null);
  const isParsed = !!effectiveRawGpFile && parsed?.file === effectiveRawGpFile;
  const parsedGpTracks = isParsed ? parsed.tracks : null;
  // The score's own tempo, kept alongside the tracks: a backing recording of the
  // same song was almost certainly played at it, so it seeds the sync defaults
  // (see feature/backingTrack). Null until the file is parsed.
  const gpTempo = isParsed ? parsed.tempo : null;

  useEffect(() => {
    if (!effectiveRawGpFile) return;
    let isStale = false;
    parseGpFile(effectiveRawGpFile)
      .then(data => {
        if (isStale) return;
        setParsed({
          file: effectiveRawGpFile,
          tracks: data.tracks.map((t, idx) => ({
            id:        `track-${idx}`,
            name:      t.name,
            measures:  t.measures,
            trackType: t.trackType as BackingTrack["trackType"],
            stringCount: t.stringCount,
            openStringMidi: t.openStringMidi,
            pan:       t.pan,
          })),
          tempo: data.tempo > 0 ? data.tempo : null,
        });
      })
      .catch(() => { if (!isStale) setParsed({ file: effectiveRawGpFile, tracks: null, tempo: null }); });
    return () => { isStale = true; };
  }, [effectiveRawGpFile]);

  const isParsingGpFile = !!effectiveRawGpFile && !isParsed;

  return { effectiveRawGpFile, isFetchingGpFile, isParsingGpFile, parsedGpTracks, gpTempo };
}
