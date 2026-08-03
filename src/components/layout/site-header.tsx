import { siteConfig } from "@/config/site";

import { ThemeToggle } from "./theme-toggle";

/**
 * Product header. Server rendered apart from the theme control, which is the
 * only interactive part and the only thing here that ships JavaScript.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate font-heading text-sm font-semibold">
            {siteConfig.name}
          </span>
          <span className="truncate text-[11px] tracking-wide text-muted-foreground uppercase">
            {siteConfig.brand}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden text-xs text-muted-foreground md:block">
            Grams · Baker&rsquo;s percentages
          </span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
