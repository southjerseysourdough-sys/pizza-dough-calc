import { SiteHeader } from "@/components/layout/site-header";
import { Atmosphere } from "@/components/three/atmosphere";
import { siteConfig } from "@/config/site";
import { DoughCalculator } from "@/features/dough-calculator/components/dough-calculator";
import { FormulaExplanation } from "@/features/dough-calculator/components/formula-explanation";

/**
 * The calculator route.
 *
 * A Server Component: the header, the introduction and the explanation are
 * static, so only the calculator itself and the decorative canvas ship
 * JavaScript. The calculator sits immediately below a two-line introduction
 * rather than behind a marketing hero.
 */
export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="relative">
          <Atmosphere />
          <div className="mx-auto w-full max-w-6xl px-4 pt-10 pb-6 sm:px-6">
            <h1 className="max-w-2xl font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              Pizza dough, sized by area
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
              {siteConfig.description}
            </p>
          </div>
        </div>

        <DoughCalculator />

        <div className="mx-auto w-full max-w-6xl px-4 pb-24 sm:px-6">
          <FormulaExplanation />
        </div>
      </main>
    </>
  );
}
