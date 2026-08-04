export type CommandContext = {
  hasValidRecipe: boolean;
  hasFermentationPlan: boolean;
  installAvailable: boolean;
};

export type CommandId =
  | "format-round"
  | "format-sheet"
  | "preset-new-york"
  | "preset-sicilian"
  | "set-hydration"
  | "set-quantity"
  | "open-fermentation"
  | "start-baking-day"
  | "save-recipe"
  | "open-saved"
  | "share-recipe"
  | "copy-recipe"
  | "print-recipe"
  | "download-pdf"
  | "toggle-advanced"
  | "toggle-theme"
  | "open-help"
  | "open-data"
  | "install-app";

export type CommandDescriptor = {
  id: CommandId;
  label: string;
  group: "Recipe" | "Calculator" | "Workspace" | "Application";
  keywords: string;
  disabled: (context: CommandContext) => boolean;
};

const enabled = () => false;
const needsRecipe = (context: CommandContext) => !context.hasValidRecipe;

export const COMMANDS: readonly CommandDescriptor[] = [
  {
    id: "format-round",
    label: "Switch to Round Pizza",
    group: "Calculator",
    keywords: "shape circle pizza",
    disabled: enabled,
  },
  {
    id: "format-sheet",
    label: "Switch to Pan Pizza",
    group: "Calculator",
    keywords: "shape rectangle sheet pan sicilian grandma",
    disabled: enabled,
  },
  {
    id: "preset-new-york",
    label: "Load New York preset",
    group: "Calculator",
    keywords: "profile steel",
    disabled: enabled,
  },
  {
    id: "preset-sicilian",
    label: "Load Sicilian preset",
    group: "Calculator",
    keywords: "profile pan",
    disabled: enabled,
  },
  {
    id: "set-hydration",
    label: "Set hydration",
    group: "Calculator",
    keywords: "water percent",
    disabled: enabled,
  },
  {
    id: "set-quantity",
    label: "Set quantity",
    group: "Calculator",
    keywords: "pizzas pans count",
    disabled: enabled,
  },
  {
    id: "open-fermentation",
    label: "Open Fermentation Planner",
    group: "Workspace",
    keywords: "schedule backward bake time",
    disabled: needsRecipe,
  },
  {
    id: "start-baking-day",
    label: "Start Baking Day",
    group: "Workspace",
    keywords: "kitchen timer session",
    disabled: (context) => needsRecipe(context) || !context.hasFermentationPlan,
  },
  {
    id: "save-recipe",
    label: "Save Recipe",
    group: "Recipe",
    keywords: "local library",
    disabled: needsRecipe,
  },
  {
    id: "open-saved",
    label: "Open Saved Recipes",
    group: "Recipe",
    keywords: "library",
    disabled: enabled,
  },
  {
    id: "share-recipe",
    label: "Share Recipe",
    group: "Recipe",
    keywords: "url link",
    disabled: needsRecipe,
  },
  {
    id: "copy-recipe",
    label: "Copy Recipe",
    group: "Recipe",
    keywords: "clipboard text",
    disabled: needsRecipe,
  },
  {
    id: "print-recipe",
    label: "Print Recipe",
    group: "Recipe",
    keywords: "paper",
    disabled: needsRecipe,
  },
  {
    id: "download-pdf",
    label: "Download PDF",
    group: "Recipe",
    keywords: "document",
    disabled: needsRecipe,
  },
  {
    id: "toggle-advanced",
    label: "Toggle More Controls",
    group: "Calculator",
    keywords: "advanced expert flour custom precision",
    disabled: enabled,
  },
  {
    id: "toggle-theme",
    label: "Toggle Theme",
    group: "Application",
    keywords: "dark light color",
    disabled: enabled,
  },
  {
    id: "open-help",
    label: "Open Help",
    group: "Application",
    keywords: "guide privacy troubleshooting",
    disabled: enabled,
  },
  {
    id: "open-data",
    label: "Open Data Management",
    group: "Application",
    keywords: "archive import export reset cache",
    disabled: enabled,
  },
  {
    id: "install-app",
    label: "Install App",
    group: "Application",
    keywords: "pwa home screen",
    disabled: (context) => !context.installAvailable,
  },
] as const;

export function commandStates(context: CommandContext) {
  return COMMANDS.map((command) => ({
    ...command,
    isDisabled: command.disabled(context),
  }));
}
