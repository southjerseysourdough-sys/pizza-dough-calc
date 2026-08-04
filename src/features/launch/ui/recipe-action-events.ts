export const RECIPE_ACTION_EVENT = "pdc:recipe-action";

export type RecipeAction =
  "menu" | "save" | "saved" | "share" | "copy" | "print" | "pdf";

export function dispatchRecipeAction(action: RecipeAction): void {
  window.dispatchEvent(
    new CustomEvent<RecipeAction>(RECIPE_ACTION_EVENT, { detail: action })
  );
}
