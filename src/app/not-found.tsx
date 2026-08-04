import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[70dvh] place-items-center px-4 py-12">
      <section className="surface-workbench max-w-lg p-6">
        <p className="font-mono text-[10px] tracking-[0.1em] text-acid-lime uppercase">
          404 / Not found
        </p>
        <h1 className="mt-2 text-2xl font-medium">
          That kitchen station does not exist.
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Return to the calculator. Nothing in your local recipe library was
          changed.
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
