import { cn } from "assets/lib/utils";
import type { WikiSection } from "lib/wiki";
import Link from "next/link";
import { useRouter } from "next/router";

interface WikiSidebarProps {
  sections: WikiSection[];
}

export const WikiSidebar = ({ sections }: WikiSidebarProps) => {
  const router = useRouter();

  return (
    <div className='w-full md:w-72 space-y-6 shrink-0'>
      <div className='px-4 py-2'>
        <h2 className='text-2xl font-black tracking-tight text-foreground'>Wiki</h2>
        <p className='text-sm text-muted-foreground font-medium'>How riff.quest works</p>
      </div>
      <nav className='flex flex-col gap-5'>
        {sections.map((section) => (
          <div key={section.section} className='flex flex-col gap-1'>
            <div className='px-5 text-xs font-bold uppercase tracking-wider text-zinc-600'>
              {section.section}
            </div>
            {section.pages.map((page) => {
              const href = `/wiki/${page.slug}`;
              const isActive = router.pathname === "/wiki/[slug]" && router.query.slug === page.slug;

              return (
                <Link
                  key={page.slug}
                  href={href}
                  className={cn(
                    "rounded-lg px-5 py-2.5 text-sm font-bold transition-background",
                    isActive
                      ? "bg-zinc-900 text-foreground"
                      : "text-muted-foreground hover:bg-zinc-900/50 hover:text-foreground"
                  )}>
                  {page.title}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </div>
  );
};
