export default function BakingDayLoading() {
  return (
    <main
      className="min-h-dvh bg-background px-4 py-6"
      aria-label="Loading Baking Day"
    >
      <div className="mx-auto max-w-5xl">
        <div className="surface-workbench h-56 animate-pulse motion-reduce:animate-none" />
        <p className="mt-4 text-xs text-muted-foreground">
          Restoring the local Baking Day session…
        </p>
      </div>
    </main>
  );
}
