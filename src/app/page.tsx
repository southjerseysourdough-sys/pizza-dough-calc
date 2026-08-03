import { SiteHeader } from "@/components/layout/site-header";
import { siteConfig } from "@/config/site";
import { DoughCalculator } from "@/features/dough-calculator/components/dough-calculator";
import { FormulaExplanation } from "@/features/dough-calculator/components/formula-explanation";

/**
 * The calculator route.
 *
 * A Server Component: the header, the explanation and the footer are static,
 * so only the calculator itself and its canvas ship JavaScript. The dough
 * stage sits immediately below the header — there is no marketing hero to
 * scroll past.
 */
export default function Home() {
  return (
    <>
      <SiteHeader />

      {/*
       * Page atmosphere: a warm key light from the upper right and a cool
       * steel reflection from the lower left, both low contrast so nothing
       * competes with the text. Fixed, so it does not scroll away.
       */}
      <div
        aria-hidden="true"
        className="page-atmosphere pointer-events-none fixed inset-0 -z-10"
      />

      <main className="flex-1 pt-5">
        <DoughCalculator />

        <div className="mx-auto w-full max-w-[84rem] px-4 pb-20 sm:px-6">
          <div className="max-w-3xl">
            <FormulaExplanation />
          </div>
        </div>
      </main>

      <footer className="border-t border-hairline/40">
        <div className="mx-auto flex w-full max-w-[84rem] flex-col gap-1 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-muted-foreground">
            {siteConfig.name} · built by {siteConfig.brand}
          </p>
          <p className="text-xs text-muted-foreground/70">
            {siteConfig.productionUrl.replace("https://", "")}
          </p>
        </div>
      </footer>
    </>
  );
}
