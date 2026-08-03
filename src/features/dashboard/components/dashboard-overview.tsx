import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants";

/**
 * Placeholder dashboard. Deliberately holds no dough logic — it exists to
 * confirm the shell, the design tokens and the provider boundary render, and
 * to give the first real feature somewhere to land.
 */

const PANELS = [
  {
    title: "Recipes",
    description: "Saved dough formulas will be listed here.",
  },
  {
    title: "Batches",
    description: "Scaled batches and their timings will be listed here.",
  },
  {
    title: "Notes",
    description: "Bake observations and adjustments will be listed here.",
  },
] as const;

export function DashboardOverview() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {APP_NAME}
          </h1>
          <Tooltip>
            <TooltipTrigger
              className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
              aria-label="Project status"
            >
              Scaffold
            </TooltipTrigger>
            <TooltipContent>
              Foundation only — no calculator yet.
            </TooltipContent>
          </Tooltip>
        </div>
        <p className="max-w-prose text-muted-foreground">{APP_DESCRIPTION}</p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PANELS.map((panel) => (
          <Card key={panel.title}>
            <CardContent className="flex flex-col gap-1">
              <CardTitle>{panel.title}</CardTitle>
              <CardDescription>{panel.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-dashed border-foreground/15 px-6 py-16 text-center">
        <p className="text-sm text-muted-foreground">
          The dough calculator will render here.
        </p>
      </div>
    </div>
  );
}
