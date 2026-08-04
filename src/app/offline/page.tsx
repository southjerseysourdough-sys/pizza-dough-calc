import Link from "next/link";
import { WifiOffIcon } from "lucide-react";

export default function OfflineFallback() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-12">
      <section className="surface-workbench max-w-lg p-6">
        <WifiOffIcon
          aria-hidden="true"
          className="mb-4 size-6 text-acid-lime"
        />
        <p className="font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
          Connection unavailable
        </p>
        <h1 className="mt-2 text-2xl font-medium">
          This screen was not prepared for offline use.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Reconnect and open the calculator or prepare Baking Day for offline
          use. Browser-saved recipes and sessions have not been deleted.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex h-9 items-center rounded-md bg-acid-lime px-3 text-sm font-medium text-void"
        >
          Return to calculator
        </Link>
      </section>
    </main>
  );
}
