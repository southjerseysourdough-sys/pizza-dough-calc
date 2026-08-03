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

      <main className="flex-1 pt-4">
        <DoughCalculator />

        <div className="mx-auto w-full max-w-[84rem] px-4 pb-16 sm:px-6">
          <div className="max-w-3xl">
            <FormulaExplanation />
          </div>
        </div>
      </main>

      <footer className="border-t-[0.5px] border-graphite">
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
