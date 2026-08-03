"use client";

import { CircleHelpIcon } from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type ContextHelpContent = {
  term: string;
  definition: string;
  effect: string;
  current?: string;
};

export function ContextHelp({ content }: { content: ContextHelpContent }) {
  return (
    <Tooltip>
      <TooltipTrigger
        className="inline-flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
        aria-label={`Help: ${content.term}`}
      >
        <CircleHelpIcon className="size-3.5" aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="block max-w-72 rounded-md border-[0.5px] border-smoke bg-obsidian p-3 text-left text-secondary-foreground shadow-none"
      >
        <strong className="block text-xs font-medium text-foreground">
          {content.term}
        </strong>
        <span className="mt-1 block leading-relaxed">{content.definition}</span>
        <span className="mt-1 block leading-relaxed text-muted-foreground">
          Changing it: {content.effect}
        </span>
        {content.current ? (
          <span className="mt-2 block border-t-[0.5px] border-graphite pt-2 font-mono text-[10px] text-acid-lime">
            Current: {content.current}
          </span>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}
