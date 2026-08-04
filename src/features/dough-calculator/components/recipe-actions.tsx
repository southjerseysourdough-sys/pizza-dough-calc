"use client";

import {
  CalendarClockIcon,
  DownloadIcon,
  FileDownIcon,
  FolderOpenIcon,
  MoreHorizontalIcon,
  PrinterIcon,
  PlayIcon,
  SaveIcon,
  Share2Icon,
  UploadIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";
import dynamic from "next/dynamic";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  RECIPE_NAME_MAX_LENGTH,
  migrateRecipeDocument,
  type PizzaRecipeDocument,
} from "../domain/recipe-document";
import { useCalculatorStore } from "../store/calculator-store";
import { useRecipeLibraryStore } from "../store/recipe-library-store";
import {
  formatRecipeAsPlainText,
  IMPORT_FILE_SIZE_LIMIT_BYTES,
  sanitizeRecipeFilename,
  serializeRecipeDocument,
} from "../utils/recipe-format";
import { areRecipeDocumentsEquivalent } from "../utils/recipe-normalization";
import {
  createRecipePresentationModel,
  type RecipePresentationModel,
} from "../utils/recipe-presentation";
import { createRecipeShareUrl } from "../utils/recipe-share";
import { startBakingDaySession } from "../utils/start-baking-day";
import { RecipePrintSheet } from "./recipe-print-sheet";
import {
  RECIPE_ACTION_EVENT,
  type RecipeAction,
} from "@/features/launch/ui/recipe-action-events";
import { dispatchLaunchAction } from "@/features/launch/ui/launch-events";

const SavedRecipesDialog = dynamic(() =>
  import("./saved-recipes-dialog").then((module) => module.SavedRecipesDialog)
);

type FallbackContent = { title: string; label: string; value: string } | null;

export function RecipeActions({
  document,
  initialAction,
}: {
  document: PizzaRecipeDocument;
  initialAction?: RecipeAction;
}) {
  const collection = useRecipeLibraryStore((state) => state.collection);
  const activeRecipeId = useRecipeLibraryStore((state) => state.activeRecipeId);
  const setActiveRecipeId = useRecipeLibraryStore(
    (state) => state.setActiveRecipeId
  );
  const setWorkingName = useRecipeLibraryStore((state) => state.setWorkingName);
  const setStatusMessage = useRecipeLibraryStore(
    (state) => state.setStatusMessage
  );
  const applyRecipeDocument = useCalculatorStore(
    (state) => state.applyRecipeDocument
  );
  const setFermentationWorkspaceOpen = useCalculatorStore(
    (state) => state.setFermentationWorkspaceOpen
  );
  const [savedOpen, setSavedOpen] = useState(initialAction === "saved");
  const [nameOpen, setNameOpen] = useState(initialAction === "save");
  const [menuOpen, setMenuOpen] = useState(initialAction === "menu");
  const [nameDraft, setNameDraft] = useState(document.name);
  const [fallback, setFallback] = useState<FallbackContent>(null);
  const [importDocument, setImportDocument] =
    useState<PizzaRecipeDocument | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const initialHandled = useRef(false);

  const activeRecipe =
    collection.recipes.find((recipe) => recipe.id === activeRecipeId) ?? null;
  const modified = activeRecipe
    ? !areRecipeDocumentsEquivalent(document, activeRecipe.document)
    : false;
  const presentation = useMemo(
    () => createRecipePresentationModel(document),
    [document]
  );
  const model = presentation.ok ? presentation.value : null;

  const printRecipe = useReactToPrint({
    contentRef: printRef,
    documentTitle: sanitizeRecipeFilename(document.name, "pdf").replace(
      /\.pdf$/,
      ""
    ),
    onAfterPrint: () =>
      setStatusMessage("Print dialog opened for the dedicated recipe sheet."),
    onPrintError: () =>
      setStatusMessage(
        "Printing could not be opened in this browser. Download the PDF instead."
      ),
  });

  const openNameDialog = (suggestion = document.name) => {
    setNameDraft(suggestion);
    setNameOpen(true);
  };

  const ensureLibraryHydrated = async () => {
    if (!useRecipeLibraryStore.getState().hydrated)
      await useRecipeLibraryStore.getState().hydrate();
  };

  const saveAsNew = async () => {
    const name = nameDraft.trim();
    if (!name || name.length > RECIPE_NAME_MAX_LENGTH) return;
    await ensureLibraryHydrated();
    const result = await useRecipeLibraryStore
      .getState()
      .save({ ...document, name });
    if (result.ok) {
      setWorkingName(name);
      setStatusMessage(`${name} saved to My Recipes.`);
      setNameOpen(false);
    } else setStatusMessage(result.error.message);
  };

  const updateActive = async () => {
    if (!activeRecipeId) return openNameDialog();
    await ensureLibraryHydrated();
    const result = await useRecipeLibraryStore
      .getState()
      .update(activeRecipeId, document);
    setStatusMessage(
      result.ok ? `${document.name} updated.` : result.error.message
    );
  };

  const revert = () => {
    if (!activeRecipe) return;
    applyRecipeDocument(activeRecipe.document);
    setWorkingName(activeRecipe.document.name);
    setStatusMessage(
      `${activeRecipe.document.name} reverted to the saved version.`
    );
  };

  const writeClipboard = async (
    value: string,
    success: string,
    fallbackContent: NonNullable<FallbackContent>
  ) => {
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(value);
      setStatusMessage(success);
    } catch {
      setFallback(fallbackContent);
      setStatusMessage(
        "Clipboard access is unavailable. Select and copy the displayed text instead."
      );
    }
  };

  const share = async () => {
    const url = createRecipeShareUrl(document);
    const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
    if (
      coarsePointer &&
      navigator.share &&
      (!navigator.canShare || navigator.canShare({ url }))
    ) {
      try {
        await navigator.share({
          title: document.name,
          text: model
            ? `${document.name} · ${(model.hydration * 100).toFixed(0)}% hydration · ${model.quantity} ${model.unitNoun}${model.quantity === 1 ? "" : "s"}`
            : `${document.name} · South Jersey Sourdough`,
          url,
        });
        setStatusMessage("Recipe share sheet opened.");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
      }
    }
    await writeClipboard(url, "Shared recipe link copied.", {
      title: "Copy recipe link",
      label: "Share link",
      value: url,
    });
  };

  const copyRecipe = async () => {
    if (!model) return;
    const text = formatRecipeAsPlainText(model);
    await writeClipboard(text, "Readable recipe copied.", {
      title: "Copy recipe text",
      label: "Recipe text",
      value: text,
    });
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const downloadJson = () => {
    downloadBlob(
      new Blob([serializeRecipeDocument(document)], {
        type: "application/json;charset=utf-8",
      }),
      sanitizeRecipeFilename(document.name, "json")
    );
    setStatusMessage("Recipe JSON downloaded.");
  };

  const downloadPdf = async () => {
    if (!model || pdfGenerating) return;
    setPdfGenerating(true);
    setStatusMessage("Generating selectable-text PDF…");
    try {
      const { generateRecipePdf } =
        await import("../documents/generate-recipe-pdf");
      const blob = await generateRecipePdf(model);
      downloadBlob(blob, sanitizeRecipeFilename(document.name, "pdf"));
      setStatusMessage("Recipe PDF generated and downloaded.");
    } catch {
      setStatusMessage(
        "PDF generation failed. The calculator is unchanged; try printing instead."
      );
    } finally {
      setPdfGenerating(false);
    }
  };

  const importFile = async (file: File | undefined) => {
    setImportError(null);
    setImportDocument(null);
    if (!file) return;
    if (file.size > IMPORT_FILE_SIZE_LIMIT_BYTES) {
      setImportError(
        "That file is larger than the 512 KB recipe import limit."
      );
      return;
    }
    try {
      const parsedJson: unknown = JSON.parse(await file.text());
      const migrated = migrateRecipeDocument(parsedJson);
      if (!migrated.ok) throw new Error(migrated.message);
      setImportDocument(migrated.value);
      setStatusMessage("Recipe JSON validated. Review it before applying.");
    } catch (error) {
      setImportError(
        error instanceof Error
          ? error.message
          : "That file is not a valid recipe JSON document."
      );
      setStatusMessage(
        "Recipe JSON import failed. The current recipe was not changed."
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const applyImport = () => {
    if (!importDocument) return;
    applyRecipeDocument(importDocument);
    setActiveRecipeId(null);
    setWorkingName(importDocument.name);
    setStatusMessage(
      `${importDocument.name} imported and applied. It has not been saved.`
    );
    setImportDocument(null);
  };

  const startBakingDay = async () => {
    const result = await startBakingDaySession(document);
    if (!result.ok) {
      setStatusMessage(result.message);
      setFermentationWorkspaceOpen(true);
      return;
    }
    window.location.assign("/bake");
  };

  const importModel: RecipePresentationModel | null = importDocument
    ? (() => {
        const result = createRecipePresentationModel(importDocument);
        return result.ok ? result.value : null;
      })()
    : null;

  useEffect(() => {
    if (!useRecipeLibraryStore.getState().hydrated)
      void useRecipeLibraryStore.getState().hydrate();
    if (!initialHandled.current && initialAction) {
      initialHandled.current = true;
      queueMicrotask(() => {
        if (initialAction === "share") void share();
        if (initialAction === "copy") void copyRecipe();
        if (initialAction === "print") void printRecipe();
        if (initialAction === "pdf") void downloadPdf();
      });
    }
    const onRecipeAction = (event: Event) => {
      const action = (event as CustomEvent<RecipeAction>).detail;
      if (action === "save") openNameDialog();
      if (action === "saved") setSavedOpen(true);
      if (action === "share") void share();
      if (action === "copy") void copyRecipe();
      if (action === "print") void printRecipe();
      if (action === "pdf") void downloadPdf();
    };
    window.addEventListener(RECIPE_ACTION_EVENT, onRecipeAction);
    return () =>
      window.removeEventListener(RECIPE_ACTION_EVENT, onRecipeAction);
  });

  return (
    <>
      <div
        className="flex flex-wrap items-center gap-2"
        data-recipe-actions
        data-onboarding-target="actions"
      >
        <Button
          type="button"
          size="sm"
          className="rounded-md bg-acid-lime text-void hover:bg-acid-lime/85"
          onClick={
            activeRecipeId && modified
              ? () => void updateActive()
              : () => openNameDialog()
          }
        >
          <SaveIcon />
          {activeRecipeId && modified ? "Update Recipe" : "Save Recipe"}
        </Button>
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger
            render={
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="rounded-md"
              />
            }
          >
            <MoreHorizontalIcon />
            Recipe actions
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 rounded-md border-[0.5px] border-graphite bg-obsidian shadow-none"
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel>Execution</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => setFermentationWorkspaceOpen(true)}
              >
                <CalendarClockIcon />
                Fermentation planner
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void startBakingDay()}>
                <PlayIcon />
                Start Baking Day
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Recipe lifecycle</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSavedOpen(true)}>
                <FolderOpenIcon />
                Saved Recipes
              </DropdownMenuItem>
              {activeRecipeId ? (
                <DropdownMenuItem
                  onClick={() => openNameDialog(`${document.name} copy`)}
                >
                  <SaveIcon />
                  Save as New
                </DropdownMenuItem>
              ) : null}
              {activeRecipe && modified ? (
                <DropdownMenuItem onClick={revert}>
                  Revert to Saved
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => void share()}>
                <Share2Icon />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void copyRecipe()}>
                <DownloadIcon />
                Copy Recipe
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setStatusMessage(
                    "Preparing the dedicated recipe print sheet…"
                  );
                  printRecipe();
                }}
              >
                <PrinterIcon />
                Print
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={pdfGenerating}
                onClick={() => void downloadPdf()}
              >
                <FileDownIcon />
                {pdfGenerating ? "Generating PDF…" : "Download PDF"}
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={downloadJson}>
                <DownloadIcon />
                Download JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <UploadIcon />
                Import JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => dispatchLaunchAction("help")}>
                <ShieldCheckIcon />
                Privacy and local data
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        {activeRecipe && modified ? (
          <span className="font-mono text-[9px] tracking-[0.08em] text-acid-lime uppercase">
            Modified
          </span>
        ) : null}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        aria-label="Import recipe JSON"
        onChange={(event) => void importFile(event.target.files?.[0])}
      />
      {model ? <RecipePrintSheet ref={printRef} model={model} /> : null}
      {savedOpen ? (
        <SavedRecipesDialog
          open={savedOpen}
          onOpenChange={setSavedOpen}
          currentDocument={document}
        />
      ) : null}

      <Dialog open={nameOpen} onOpenChange={setNameOpen}>
        <DialogContent className="rounded-xl border-[0.5px] border-graphite bg-carbon shadow-none">
          <DialogHeader>
            <DialogTitle>Save recipe</DialogTitle>
            <DialogDescription>
              Names may repeat and stay local to this browser.
            </DialogDescription>
          </DialogHeader>
          <label className="grid gap-2 text-xs text-muted-foreground">
            Recipe name
            <Input
              value={nameDraft}
              maxLength={RECIPE_NAME_MAX_LENGTH}
              autoFocus
              onChange={(event) => setNameDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void saveAsNew();
              }}
            />
          </label>
          {!nameDraft.trim() ? (
            <p className="text-xs text-destructive">Enter a recipe name.</p>
          ) : null}
          <DialogFooter className="rounded-b-xl border-graphite bg-inset">
            <Button variant="ghost" onClick={() => setNameOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => void saveAsNew()}
              disabled={!nameDraft.trim()}
            >
              Save to My Recipes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={fallback !== null}
        onOpenChange={(open) => {
          if (!open) setFallback(null);
        }}
      >
        <DialogContent className="rounded-xl border-[0.5px] border-graphite bg-carbon shadow-none">
          <DialogHeader>
            <DialogTitle>{fallback?.title}</DialogTitle>
            <DialogDescription>
              Clipboard permission was unavailable. Select the text below and
              copy it manually.
            </DialogDescription>
          </DialogHeader>
          <label className="grid gap-2 text-xs text-muted-foreground">
            {fallback?.label}
            <textarea
              readOnly
              value={fallback?.value ?? ""}
              className="min-h-36 resize-y rounded-md border-[0.5px] border-input bg-inset p-3 font-mono text-xs text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/25"
              onFocus={(event) => event.currentTarget.select()}
            />
          </label>
        </DialogContent>
      </Dialog>

      <Dialog
        open={importDocument !== null || importError !== null}
        onOpenChange={(open) => {
          if (!open) {
            setImportDocument(null);
            setImportError(null);
          }
        }}
      >
        <DialogContent className="rounded-xl border-[0.5px] border-graphite bg-carbon shadow-none sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {importError
                ? "Import could not be opened"
                : "Review imported recipe"}
            </DialogTitle>
            <DialogDescription>
              {importError ??
                "Applying changes the current calculator but does not save the recipe."}
            </DialogDescription>
          </DialogHeader>
          {importModel ? (
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border-[0.5px] border-graphite bg-graphite text-xs">
              <ImportStat label="Name" value={importModel.name} />
              <ImportStat label="Style" value={importModel.style} />
              <ImportStat label="Format" value={importModel.size} />
              <ImportStat
                label="Hydration"
                value={`${Math.round(importModel.hydration * 100)}%`}
              />
              <ImportStat
                label="Total"
                value={`${Math.round(importModel.totalDoughWeightGrams)} g`}
              />
              <ImportStat label="Quantity" value={`${importModel.quantity}`} />
            </div>
          ) : null}
          <DialogFooter className="rounded-b-xl border-graphite bg-inset">
            <Button
              variant="ghost"
              onClick={() => {
                setImportDocument(null);
                setImportError(null);
                fileInputRef.current?.click();
              }}
            >
              {importError ? "Choose another file" : "Cancel"}
            </Button>
            {importDocument ? (
              <Button onClick={applyImport}>Apply imported recipe</Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ImportStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 bg-inset p-3">
      <span className="font-mono text-[9px] text-muted-foreground uppercase">
        {label}
      </span>
      <p className="mt-1 truncate text-foreground">{value}</p>
    </div>
  );
}
