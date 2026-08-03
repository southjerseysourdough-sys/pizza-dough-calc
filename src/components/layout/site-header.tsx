import { siteConfig } from "@/config/site";

import { ThemeToggle } from "./theme-toggle";

/**
 * Product header.
 *
 * Server rendered apart from the theme control. The mark is a typographic
 * SJS monogram — an application mark, not a claim to be an official logo —
 * set on a warm plate so the header reads as branded rather than as a utility
 * toolbar, while staying compact enough to keep the calculator near the top.
 */

function BrandMark() {
  return (
    <span
      aria-hidden="true"
      className="flex size-9 shrink-0 items-center justify-center rounded-[0.7rem] border border-ember/25 bg-gradient-to-br from-crust/18 to-ember/12 text-[0.62rem] leading-none font-semibold tracking-[0.06em] text-ember"
    >
      SJS
    </span>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[84rem] items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <BrandMark />
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold">
              {siteConfig.name}
            </span>
            <span className="truncate text-[0.65rem] tracking-[0.12em] text-muted-foreground uppercase">
              {siteConfig.brand}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {/* Status label: this is the lab, not a marketing tagline. */}
          <span className="hidden items-center gap-1.5 rounded-full border border-hairline/60 bg-inset/60 px-2.5 py-1 text-[0.65rem] font-medium tracking-[0.1em] text-muted-foreground uppercase md:inline-flex">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-ember"
            />
            Dough Lab
          </span>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
