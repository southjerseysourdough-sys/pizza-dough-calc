"use client";

import { useMemo, useState } from "react";
import { Combobox } from "@base-ui/react/combobox";
import { CheckIcon, SearchIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PizzaRecipeDocument } from "@/features/dough-calculator/domain/recipe-document";
import { useCalculatorStore } from "@/features/dough-calculator/store/calculator-store";
import { useRecipeLibraryStore } from "@/features/dough-calculator/store/recipe-library-store";
import { startBakingDaySession } from "@/features/dough-calculator/utils/start-baking-day";
import {
  commandStates,
  type CommandDescriptor,
  type CommandId,
} from "../domain/commands";
import { usePwa } from "../pwa/pwa-provider";
import { dispatchLaunchAction } from "./launch-events";
import { dispatchRecipeAction } from "./recipe-action-events";

type CommandItem = CommandDescriptor & { isDisabled: boolean; value: string };

export function CommandPalette({
  open,
  onOpenChange,
  document,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: PizzaRecipeDocument | null;
}) {
  const values = useCalculatorStore((state) => state.values);
  const fermentationPlan = useCalculatorStore(
    (state) => state.fermentationPlan
  );
  const applyPreset = useCalculatorStore((state) => state.applyPreset);
  const setFormatMode = useCalculatorStore((state) => state.setFormatMode);
  const setValues = useCalculatorStore((state) => state.setValues);
  const showAdvanced = useCalculatorStore((state) => state.showAdvanced);
  const setShowAdvanced = useCalculatorStore((state) => state.setShowAdvanced);
  const setFermentationWorkspaceOpen = useCalculatorStore(
    (state) => state.setFermentationWorkspaceOpen
  );
  const setGlobalStatus = useRecipeLibraryStore(
    (state) => state.setStatusMessage
  );
  const { theme, setTheme } = useTheme();
  const { installAvailable, requestInstall } = usePwa();
  const [flow, setFlow] = useState<"commands" | "hydration" | "quantity">(
    "commands"
  );
  const [numericValue, setNumericValue] = useState("");
  const [status, setStatus] = useState("");
  const items = useMemo<CommandItem[]>(
    () =>
      commandStates({
        hasValidRecipe: Boolean(document),
        hasFermentationPlan: Boolean(fermentationPlan?.enabled),
        installAvailable,
      }).map((item) => ({ ...item, value: item.id })),
    [document, fermentationPlan?.enabled, installAvailable]
  );

  const close = (announcement?: string) => {
    if (announcement) {
      setStatus(announcement);
      setGlobalStatus(announcement);
    }
    onOpenChange(false);
    setFlow("commands");
    setNumericValue("");
  };

  const execute = async (id: CommandId) => {
    const command = items.find((item) => item.id === id);
    if (!command || command.isDisabled) return;
    if (id === "set-hydration" || id === "set-quantity") {
      setFlow(id === "set-hydration" ? "hydration" : "quantity");
      setNumericValue(
        id === "set-hydration"
          ? String(values.hydrationPercent)
          : String(values.quantity)
      );
      return;
    }
    const recipeActions: Partial<
      Record<CommandId, Parameters<typeof dispatchRecipeAction>[0]>
    > = {
      "save-recipe": "save",
      "open-saved": "saved",
      "share-recipe": "share",
      "copy-recipe": "copy",
      "print-recipe": "print",
      "download-pdf": "pdf",
    };
    const recipeAction = recipeActions[id];
    if (recipeAction) {
      dispatchRecipeAction(recipeAction);
      close(`${command.label} opened.`);
      return;
    }
    if (id === "format-round") setFormatMode("round");
    if (id === "format-sheet") setFormatMode("sheet-pan");
    if (id === "preset-new-york") applyPreset("new-york-steel");
    if (id === "preset-sicilian") applyPreset("sicilian-sheet-pan");
    if (id === "open-fermentation") setFermentationWorkspaceOpen(true);
    if (id === "toggle-advanced") setShowAdvanced(!showAdvanced);
    if (id === "toggle-theme") setTheme(theme === "dark" ? "light" : "dark");
    if (id === "open-help") {
      close();
      dispatchLaunchAction("help");
      return;
    }
    if (id === "open-data") {
      close();
      dispatchLaunchAction("data");
      return;
    }
    if (id === "install-app") {
      const result = await requestInstall();
      close(
        result === "accepted"
          ? "App installation accepted."
          : "Installation was not completed."
      );
      return;
    }
    if (id === "start-baking-day" && document) {
      const result = await startBakingDaySession(document);
      if (result.ok) window.location.assign("/bake");
      else {
        setStatus(result.message);
        setFermentationWorkspaceOpen(true);
      }
      return;
    }
    close(`${command.label} completed.`);
  };

  const applyNumeric = () => {
    const parsed = Number(numericValue);
    if (!Number.isFinite(parsed)) {
      setStatus("Enter a number.");
      return;
    }
    if (flow === "hydration") {
      if (parsed < 40 || parsed > 100) {
        setStatus("Hydration must be between 40% and 100%.");
        return;
      }
      setValues({ hydrationPercent: parsed });
      close(`Hydration set to ${parsed}%.`);
    } else {
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 100) {
        setStatus("Quantity must be a whole number from 1 to 100.");
        return;
      }
      setValues({ quantity: parsed });
      close(`Quantity set to ${parsed}.`);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setFlow("commands");
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="top-[12vh] w-[min(42rem,calc(100%-1rem))] max-w-none translate-y-0 gap-0 overflow-visible rounded-xl border-[0.5px] border-graphite bg-carbon p-0 shadow-xl sm:max-w-[42rem]"
        data-command-palette
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Command palette</DialogTitle>
          <DialogDescription>
            Search calculator and recipe actions.
          </DialogDescription>
        </DialogHeader>
        {flow === "commands" ? (
          <Combobox.Root<CommandItem>
            items={items}
            autoHighlight
            open
            onValueChange={(item) => {
              if (item) void execute(item.id);
            }}
            itemToStringLabel={(item) => item.label}
            filter={(item, query) => {
              const search = query.trim().toLocaleLowerCase();
              if (!search) return true;
              return `${item.label} ${item.keywords}`
                .toLocaleLowerCase()
                .includes(search);
            }}
          >
            <div className="flex items-center gap-2 border-b-[0.5px] border-graphite px-4">
              <SearchIcon
                aria-hidden="true"
                className="size-4 text-muted-foreground"
              />
              <Combobox.Input
                autoFocus
                placeholder="Search commands…"
                aria-label="Search commands"
                className="h-12 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <kbd className="font-mono text-[9px] text-muted-foreground">
                Esc
              </kbd>
            </div>
            <Combobox.Portal>
              <Combobox.Positioner
                className="z-[60] w-[var(--anchor-width)] outline-none"
                sideOffset={2}
              >
                <Combobox.Popup
                  className="w-[var(--anchor-width)] overflow-hidden rounded-b-xl border-[0.5px] border-t-0 border-graphite bg-carbon shadow-xl"
                  initialFocus={false}
                >
                  <Combobox.Empty className="p-5 text-sm text-muted-foreground">
                    No matching commands.
                  </Combobox.Empty>
                  <Combobox.List className="max-h-[min(26rem,55dvh)] overflow-y-auto p-2 outline-none">
                    {(item: CommandItem) => (
                      <Combobox.Item
                        key={item.id}
                        value={item}
                        disabled={item.isDisabled}
                        className="grid cursor-default grid-cols-[1fr_auto] gap-3 rounded-md px-3 py-2 text-sm outline-none data-highlighted:bg-inset data-disabled:opacity-40"
                      >
                        <span>
                          <span className="block text-foreground">
                            {item.label}
                          </span>
                          <span className="block font-mono text-[9px] text-muted-foreground uppercase">
                            {item.group}
                          </span>
                        </span>
                        <Combobox.ItemIndicator className="self-center text-acid-lime">
                          <CheckIcon className="size-3.5" />
                        </Combobox.ItemIndicator>
                      </Combobox.Item>
                    )}
                  </Combobox.List>
                </Combobox.Popup>
              </Combobox.Positioner>
            </Combobox.Portal>
          </Combobox.Root>
        ) : (
          <form
            className="grid gap-4 p-5"
            onSubmit={(event) => {
              event.preventDefault();
              applyNumeric();
            }}
          >
            <div>
              <p className="font-mono text-[9px] tracking-[0.1em] text-acid-lime uppercase">
                Focused command
              </p>
              <h2 className="mt-1 text-lg font-medium">Set {flow}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {flow === "hydration"
                  ? "Enter a percentage from 40 to 100."
                  : "Enter a whole number from 1 to 100."}
              </p>
            </div>
            <div className="flex items-center rounded-md border-[0.5px] border-input bg-inset px-3 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/25">
              <input
                autoFocus
                type="number"
                min={flow === "hydration" ? 40 : 1}
                max={100}
                step={flow === "hydration" ? "0.1" : "1"}
                value={numericValue}
                onChange={(event) => setNumericValue(event.target.value)}
                className="h-11 min-w-0 flex-1 bg-transparent text-lg outline-none"
                aria-label={flow}
              />
              {flow === "hydration" ? (
                <span className="text-muted-foreground">%</span>
              ) : null}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFlow("commands")}
              >
                Back
              </Button>
              <Button type="submit">Apply</Button>
            </div>
          </form>
        )}
        <p className="sr-only" role="status" aria-live="polite">
          {status}
        </p>
      </DialogContent>
    </Dialog>
  );
}
