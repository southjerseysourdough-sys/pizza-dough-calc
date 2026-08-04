export default function Loading() {
  return (
    <main
      className="mx-auto w-full max-w-[84rem] flex-1 px-4 pt-4 pb-16 sm:px-6"
      aria-label="Loading calculator"
    >
      <div className="surface-stage h-72 animate-pulse motion-reduce:animate-none" />
      <p className="mt-4 font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
        Preparing dough workspace…
      </p>
    </main>
  );
}
