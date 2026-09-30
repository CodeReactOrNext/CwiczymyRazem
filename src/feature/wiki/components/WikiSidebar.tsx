import { cn } from "assets/lib/utils";
import type { WikiSection } from "lib/wiki";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";

interface WikiSidebarProps {
  sections: WikiSection[];
}

export const WikiSidebar = ({ sections }: WikiSidebarProps) => {
  const router = useRouter();
  const activeSlug =
    router.pathname === "/wiki/[slug]" ? router.query.slug : undefined;

  // Only the group you're reading in (or "Start Here" on the index) starts
  // open — the full tree of every article buried the first step. Groups the
  // reader opens by hand stay open while they move between articles.
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
  const activeSection =
    sections.find((s) => s.pages.some((p) => p.slug === activeSlug))?.section ??
    sections[0]?.section;

  const isOpen = (section: string) =>
    toggled[section] ?? section === activeSection;

  return (
    <div className='w-full shrink-0 space-y-6 md:sticky md:top-4 md:max-h-[calc(100vh-2rem)] md:w-72 md:overflow-y-auto'>
      <Link href='/wiki' className='block px-4 py-2'>
        <h2 className='text-2xl font-black tracking-tight text-foreground'>
          Wiki
        </h2>
        <p className='text-sm font-medium text-muted-foreground'>
          How riff.quest works
        </p>
      </Link>
      <nav className='flex flex-col gap-2'>
        {sections.map((section) => {
          const open = isOpen(section.section);
          return (
            <div key={section.section} className='flex flex-col gap-1'>
              <button
                type='button'
                aria-expanded={open}
                onClick={() =>
                  setToggled((prev) => ({ ...prev, [section.section]: !open }))
                }
                className='flex items-center justify-between rounded-lg px-5 py-2 text-left text-xs font-bold tracking-wide text-zinc-500 transition-colors hover:bg-zinc-900/50 hover:text-zinc-300'>
                {section.section}
                <ChevronDown
                  size={14}
                  className={cn("transition-transform", open && "rotate-180")}
                />
              </button>
              {open &&
                section.pages.map((page) => {
                  const isActive = page.slug === activeSlug;
                  return (
                    <Link
                      key={page.slug}
                      href={`/wiki/${page.slug}`}
                      className={cn(
                        "rounded-lg px-5 py-2.5 text-sm font-bold transition-background",
                        isActive
                          ? "bg-zinc-900 text-foreground"
                          : "text-muted-foreground hover:bg-zinc-900/50 hover:text-foreground",
                      )}>
                      {page.title}
                    </Link>
                  );
                })}
            </div>
          );
        })}
      </nav>
    </div>
  );
};
