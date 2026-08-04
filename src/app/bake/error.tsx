"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function BakingDayError({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-12">
      <section className="surface-workbench max-w-lg p-6" role="alert">
        <p className="font-mono text-[10px] tracking-[0.1em] text-warning uppercase">
          Baking Day recovery
        </p>
        <h1 className="mt-2 text-2xl font-medium">
          Baking Day could not finish loading.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Reload this screen or return to the calculator. The locally saved
          session and its timestamp-based timer have not been deleted.
        </p>
        <div className="mt-5 flex gap-2">
          <Button onClick={reset}>Reload this screen</Button>
          <Button variant="outline" render={<Link href="/" />}>
            Return to calculator
          </Button>
        </div>
      </section>
    </main>
  );
}
