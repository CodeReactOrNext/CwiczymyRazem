import { ToneStudioView } from "feature/toneStudio/components/ToneStudioView";

/**
 * Dev-only harness: renders ToneStudioView with no Firebase auth and no Electron
 * bridge present, so the layout/knobs/preset cards can be screenshotted headlessly
 * in a plain browser. Not linked from any nav; 404s outside development. Mirrors
 * src/pages/dev/highway-preview.tsx.
 */
export default function ToneStudioPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div className='min-h-screen bg-zinc-950'>
      <ToneStudioView />
    </div>
  );
}
