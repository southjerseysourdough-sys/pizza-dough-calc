"use client";

import Link from "next/link";
import { AlertCircleIcon, RefreshCwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { normalizeProductionError } from "@/features/launch/domain/errors";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const normalized = normalizeProductionError(error);
  return (
    <main className="grid min-h-[70dvh] place-items-center px-4 py-12">
      <section className="surface-workbench max-w-lg p-6" role="alert">
        <AlertCircleIcon
          aria-hidden="true"
          className="mb-4 size-6 text-warning"
        />
        <h1 className="text-xl font-medium">{normalized.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {normalized.message}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={reset}>
            <RefreshCwIcon />
            Reload this screen
          </Button>
          <Button variant="outline" render={<Link href="/" />}>
            Return to calculator
          </Button>
        </div>
      </section>
    </main>
  );
}
