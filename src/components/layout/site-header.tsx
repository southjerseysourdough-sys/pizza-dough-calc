import { siteConfig } from "@/config/site";

import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-[0.5px] border-graphite bg-background/92 backdrop-blur-md">
      <div className="mx-auto flex h-13 w-full max-w-[84rem] items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-7 shrink-0 place-items-center rounded-sm border-[0.5px] border-smoke bg-obsidian font-mono text-[9px] tracking-[0.08em] text-soft-foreground"
          >
            SJS
          </span>
          <div className="flex min-w-0 flex-1 items-baseline gap-2">
            <span className="hidden truncate text-xs text-muted-foreground sm:inline">
              {siteConfig.brand}
            </span>
            <span className="hidden text-graphite sm:inline">/</span>
            <span className="min-w-0 truncate text-sm font-medium text-foreground">
              {siteConfig.name}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border-[0.5px] border-graphite bg-carbon px-2.5 py-1 font-mono text-[9px] tracking-[0.08em] text-muted-foreground uppercase md:flex">
            <span className="size-1.5 rounded-full bg-success" />
            Dough Lab / Live
          </span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
