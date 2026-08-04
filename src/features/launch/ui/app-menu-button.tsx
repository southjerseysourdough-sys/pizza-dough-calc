"use client";

import { CommandIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { dispatchLaunchAction } from "./launch-events";

export function AppMenuButton() {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className="rounded-md"
      aria-label="Open command palette"
      onClick={() => dispatchLaunchAction("commands")}
    >
      <CommandIcon />
      <span className="hidden lg:inline">Commands</span>
      <kbd className="hidden font-mono text-[9px] text-muted-foreground xl:inline">
        ⌘K
      </kbd>
    </Button>
  );
}
