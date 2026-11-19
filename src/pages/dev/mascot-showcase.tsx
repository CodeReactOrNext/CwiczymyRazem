import { cn } from "assets/lib/utils";
import { SCENES } from "feature/mascotSim/scenes";
import { SimProviders } from "feature/mascotSim/SimProviders";
import { onAuthStateChanged } from "firebase/auth";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { auth } from "utils/firebase/client/firebase.utils";

/**
 * Dev-only simulator: every place Kostek (or the anime moment) appears,
 * rendered from the real components — modals, dialogs and flows included —
 * on made-up data, so all of it can be clicked through on localhost without
 * an account. Scenes live in feature/mascotSim/scenes.tsx; `[` and `]` step
 * through them. Renders nothing in production.
 *
 * It only runs signed out: some of these components write through the signed-in
 * account (the streak toggle, the chat), and signed out Firestore refuses
 * every write, so a click here can never change real data.
 */

const IDS = Object.keys(SCENES);

const useSignedIn = () => {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => onAuthStateChanged(auth, (user) => setSignedIn(!!user)), []);
  return signedIn;
};

function MascotSimulator() {
  const router = useRouter();
  const signedIn = useSignedIn();
  const sceneId = typeof router.query.scene === "string" && SCENES[router.query.scene] ? router.query.scene : null;
  const scene = sceneId ? SCENES[sceneId] : null;
  const [run, setRun] = useState(0);

  const groups = useMemo(() => {
    const byGroup = new Map<string, string[]>();
    IDS.forEach((id) => byGroup.set(SCENES[id].group, [...(byGroup.get(SCENES[id].group) ?? []), id]));
    return [...byGroup.entries()];
  }, []);

  // `[` / `]`: previous / next scene (not while typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return;
      if (e.key !== "[" && e.key !== "]") return;
      const i = sceneId ? IDS.indexOf(sceneId) : -1;
      const next = IDS[(i + (e.key === "]" ? 1 : -1) + IDS.length) % IDS.length];
      void router.push({ query: { scene: next } }, undefined, { shallow: true });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router, sceneId]);

  if (process.env.NODE_ENV === "production") return null;

  if (signedIn) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-center'>
        <div className='max-w-md space-y-3'>
          <h1 className='text-lg font-semibold text-zinc-100'>Symulator działa tylko po wylogowaniu</h1>
          <p className='text-sm leading-relaxed text-zinc-400'>
            Część widoków zapisuje przez zalogowane konto (np. przełącznik serii, czat). Wyloguj się albo otwórz tę stronę w oknie
            prywatnym, żeby nic z symulacji nie trafiło do prawdziwych danych.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex min-h-screen bg-zinc-950 text-zinc-100'>
      <nav className='sticky top-0 hidden h-screen w-64 shrink-0 overflow-y-auto bg-zinc-900/60 p-4 lg:block'>
        <Link href='/dev/mascot-showcase' className='mb-4 block text-sm font-semibold text-zinc-100'>
          Kostek: symulator
        </Link>
        {groups.map(([group, ids]) => (
          <div key={group} className='mb-5'>
            <p className='mb-1.5 px-2 text-xs text-zinc-500'>{group}</p>
            <ul className='space-y-0.5'>
              {ids.map((id) => (
                <li key={id}>
                  <Link
                    href={{ query: { scene: id } }}
                    shallow
                    className={cn(
                      "block rounded-md px-2 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100",
                      id === sceneId && "bg-zinc-800 text-zinc-100",
                    )}>
                    {SCENES[id].label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <p className='px-2 text-xs leading-relaxed text-zinc-500'>
          <kbd className='rounded bg-zinc-800 px-1'>[</kbd> <kbd className='rounded bg-zinc-800 px-1'>]</kbd> poprzednia / następna scena
        </p>
      </nav>

      <main className='min-w-0 flex-1'>
        {scene ? (
          <>
            <div className='flex flex-wrap items-center gap-3 bg-zinc-900/40 px-6 py-3 text-sm'>
              <span className='font-medium text-zinc-100'>{scene.label}</span>
              {scene.hint && <span className='text-zinc-400'>{scene.hint}</span>}
              <button
                type='button'
                onClick={() => setRun((r) => r + 1)}
                className='ml-auto rounded-md bg-zinc-800 px-3 py-1 text-xs text-zinc-200 hover:bg-zinc-700'>
                Od nowa
              </button>
            </div>
            <div className='p-6'>
              {/* Keyed so a new scene (or "Od nowa") starts from a fresh store and cache. */}
              <SimProviders key={`${sceneId}-${run}`} setup={scene.sim ?? {}}>
                {scene.node()}
              </SimProviders>
            </div>
          </>
        ) : (
          <div className='p-8'>
            <h1 className='mb-2 text-xl font-semibold'>Kostek: wszystkie miejsca w aplikacji</h1>
            <p className='mb-8 text-sm text-zinc-400'>
              Prawdziwe komponenty na podstawionych danych. Wybierz scenę z listy albo przechodź po kolei klawiszami [ i ].
            </p>
            <div className='grid gap-8 sm:grid-cols-2 xl:grid-cols-3'>
              {groups.map(([group, ids]) => (
                <div key={group}>
                  <p className='mb-2 text-xs text-zinc-500'>{group}</p>
                  <ul className='space-y-1'>
                    {ids.map((id) => (
                      <li key={id}>
                        <Link
                          href={{ query: { scene: id } }}
                          shallow
                          className='block rounded-lg bg-zinc-900 px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800'>
                          {SCENES[id].label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default dynamic(() => Promise.resolve(MascotSimulator), { ssr: false });
